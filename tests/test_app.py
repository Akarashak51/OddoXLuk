import os, tempfile, unittest
from datetime import date, timedelta
from unittest.mock import MagicMock, patch
from app import create_app
from app.domain.pricing import advance, compute
from app.security import password_error


class PricingTests(unittest.TestCase):
    def test_password_rules(self):
        self.assertIsNotNone(password_error("Short1!"))          # 7 chars
        self.assertIsNotNone(password_error("Eightchr!"[:8]))    # exactly 8 -> must be MORE than 8
        self.assertIsNotNone(password_error("alllowercase!1"))
        self.assertIsNotNone(password_error("ALLUPPERCASE!1"))
        self.assertIsNotNone(password_error("NoSpecial12345"))
        self.assertIsNone(password_error("Valid#Pass1"))

    def test_month_end_does_not_drift(self):
        self.assertEqual(advance("2026-01-31", "monthly", 1).isoformat(), "2026-02-28")
        self.assertEqual(advance("2026-01-31", "monthly", 2).isoformat(), "2026-03-31")

    def test_discount_and_tax(self):
        lines = [dict(product_id=1, description="A", quantity=10, unit_price=100, tax_rate=18)]
        d = [dict(id=1, name="10%", type="percent", value=10, min_purchase=0, min_quantity=10, applies_to="product", product_id=1)]
        r = compute(lines, d)
        self.assertEqual((r["subtotal"], r["discount_total"], r["tax_total"], r["total"]), (1000, 100, 162, 1062))
        d[0]["min_quantity"] = 11   # not eligible
        self.assertEqual(compute(lines, d)["discount_total"], 0)

    def test_smtp_configuration_fails_fast_when_incomplete(self):
        with self.assertRaisesRegex(RuntimeError, "SMTP_HOST"):
            create_app({"MAIL_MODE": "smtp", "SMTP_HOST": "", "MAIL_FROM": "billing@example.com",
                        "FRONTEND_URL": "https://brightloop.example"})


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp()
        cls.app = create_app({"DATABASE": os.path.join(cls.tmp, "t.db"), "TESTING": True})
        cls.c = cls.app.test_client()

    def login(self, email, pw):
        r = self.c.post("/api/auth/login", json={"email": email, "password": pw})
        self.assertEqual(r.status_code, 200, r.get_json())
        return {"Authorization": "Bearer " + r.get_json()["token"]}

    def admin(self): return self.login("admin@brightloop.com", "Admin@12345")

    def test_signup_rules_and_reset(self):
        r = self.c.post("/api/auth/signup", json={"name": "T", "email": "t@x.com", "password": "weak"})
        self.assertEqual(r.status_code, 422)
        ok = {"name": "T User", "email": "t@x.com", "password": "Strong#Pass1", "accepted_terms": True}
        self.assertEqual(self.c.post("/api/auth/signup", json={**ok, "accepted_terms": False}).status_code, 422)   # consent is required
        self.assertEqual(self.c.post("/api/auth/signup", json=ok).status_code, 201)
        self.assertEqual(self.c.post("/api/auth/signup", json=ok).status_code, 422)   # unique email
        link = self.c.post("/api/auth/forgot-password", json={"email": "t@x.com"}).get_json()["dev_reset_link"]
        token = link.split("token=")[1]
        r = self.c.post("/api/auth/reset-password", json={"token": token, "password": "Another#Pass2"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.c.post("/api/auth/reset-password", json={"token": token, "password": "Third#Pass3"}).status_code, 400)  # single use
        self.login("t@x.com", "Another#Pass2")

    def test_smtp_reset_sends_mail_without_exposing_dev_link(self):
        keys = ("MAIL_MODE", "MAIL_FROM", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "FRONTEND_URL")
        previous = {key: self.app.config[key] for key in keys}
        self.app.config.update(MAIL_MODE="smtp", MAIL_FROM="billing@brightloop.test", SMTP_HOST="smtp.test",
                               SMTP_PORT=587, SMTP_USER="mailer", SMTP_PASSWORD="secret",
                               FRONTEND_URL="https://brightloop.test")
        smtp = MagicMock()
        smtp.__enter__.return_value = smtp
        try:
            with patch("app.services.mailer.smtplib.SMTP", return_value=smtp) as connect:
                r = self.c.post("/api/auth/forgot-password", json={"email": "admin@brightloop.com"})
            self.assertEqual(r.status_code, 200)
            self.assertNotIn("dev_reset_link", r.get_json())
            connect.assert_called_once_with("smtp.test", 587, timeout=15)
            smtp.starttls.assert_called_once()
            smtp.login.assert_called_once_with("mailer", "secret")
            message = smtp.send_message.call_args.args[0]
            self.assertEqual(message["To"], "admin@brightloop.com")
            self.assertIn("https://brightloop.test/#/reset?token=", message.get_content())
        finally:
            self.app.config.update(previous)

    def test_profile_password_and_contact(self):
        h = self.login("staff@brightloop.com", "Staff@12345")
        a = self.c.get("/api/me/account", headers=h).get_json()
        self.assertEqual((a["role"], a["customer"]), ("staff", None))
        self.assertIn("payments_recorded", a["stats"])
        self.assertEqual(self.c.put("/api/me/account", json={"name": ""}, headers=h).status_code, 422)
        self.assertEqual(self.c.put("/api/me/account", json={"name": "Rohan G."}, headers=h).get_json()["name"], "Rohan G.")
        c = self.login("customer@example.com", "Customer@123")
        ca = self.c.put("/api/me/account", json={"name": "Meera Joshi", "phone": "+91 99999 00000", "company": "Nova Retail"}, headers=c).get_json()
        self.assertEqual(ca["customer"]["phone"], "+91 99999 00000")
        self.assertIn("balance_due", ca["stats"])
        self.assertEqual(self.c.get("/api/me/account").status_code, 401)
        bad = self.c.post("/api/me/password", json={"current_password": "nope", "new_password": "weak"}, headers=c)
        self.assertEqual(bad.status_code, 422)
        self.assertEqual(set(bad.get_json()["errors"]), {"current_password", "new_password"})
        self.assertEqual(self.c.post("/api/me/password", json={"current_password": "Customer@123", "new_password": "Customer@456"}, headers=c).status_code, 200)
        self.login("customer@example.com", "Customer@456")
        self.c.post("/api/me/password", json={"current_password": "Customer@456", "new_password": "Customer@123"}, headers=self.login("customer@example.com", "Customer@456"))
        self.assertEqual(self.c.post("/api/contact", json={"name": "A", "email": "a@b.co", "message": "hi"}).status_code, 422)
        self.assertEqual(self.c.post("/api/contact", json={"name": "Ana", "email": "ana@b.co", "topic": "sales", "message": "Do you support yearly plans?"}).status_code, 201)

    def test_role_permissions(self):
        staff = self.login("staff@brightloop.com", "Staff@12345")
        self.assertEqual(self.c.post("/api/discounts", json={}, headers=staff).status_code, 403)
        self.assertEqual(self.c.post("/api/users", json={}, headers=staff).status_code, 403)
        cust = self.login("customer@example.com", "Customer@123")
        self.assertEqual(self.c.get("/api/customers", headers=cust).status_code, 403)
        self.assertEqual(self.c.get("/api/subscriptions").status_code, 401)
        mine = self.c.get("/api/subscriptions", headers=cust).get_json()
        self.assertTrue(all(s["customer_name"] == "Meera Joshi" for s in mine["items"]))

    def test_billing_is_idempotent_and_payments(self):
        h = self.admin()
        before = self.c.get("/api/invoices?per_page=1", headers=h).get_json()["total"]
        r = self.c.post("/api/billing/run", json={}, headers=h).get_json()
        self.assertEqual(r["invoices_created"], 0)                      # seed already billed everything due
        self.assertEqual(self.c.get("/api/invoices?per_page=1", headers=h).get_json()["total"], before)
        future = (date.today() + timedelta(days=40)).isoformat()
        r1 = self.c.post("/api/billing/run", json={"as_of": future}, headers=h).get_json()
        self.assertGreater(r1["invoices_created"], 0)
        r2 = self.c.post("/api/billing/run", json={"as_of": future}, headers=h).get_json()
        self.assertEqual(r2["invoices_created"], 0)                     # nothing billed twice
        inv = self.c.get("/api/invoices?status=draft&per_page=1", headers=h).get_json()["items"][0]
        self.assertEqual(self.c.post(f"/api/invoices/{inv['id']}/payments", json={"method": "cash", "amount": 1, "payment_date": date.today().isoformat()}, headers=h).status_code, 409)
        self.c.post(f"/api/invoices/{inv['id']}/confirm", headers=h)
        over = self.c.post(f"/api/invoices/{inv['id']}/payments", json={"method": "cash", "amount": inv["total"] + 1, "payment_date": date.today().isoformat()}, headers=h)
        self.assertEqual(over.status_code, 422)
        ok = self.c.post(f"/api/invoices/{inv['id']}/payments", json={"method": "upi", "amount": inv["total"], "payment_date": date.today().isoformat()}, headers=h)
        self.assertEqual(ok.get_json()["invoice"]["status"], "paid")

    def test_dashboard_and_print(self):
        h = self.admin()
        d = self.c.get("/api/reports/dashboard", headers=h).get_json()
        self.assertGreater(d["active_subscriptions"], 0)
        inv = self.c.get("/api/invoices?per_page=1", headers=h).get_json()["items"][0]
        self.assertIn(inv["number"], self.c.get(f"/api/invoices/{inv['id']}/print", headers=h).get_data(as_text=True))

    def test_lifecycle_and_plan_rules(self):
        h = self.admin()
        tpl = self.c.get("/api/templates", headers=h).get_json()["items"][0]
        body = {"customer_id": 1, "template_id": tpl["id"], "start_date": date.today().isoformat(), "expiry_date": (date.today() + timedelta(days=365)).isoformat()}
        s = self.c.post("/api/subscriptions", json=body, headers=h).get_json()
        self.assertEqual(s["status"], "draft")
        for a, st in (("send", "quotation"), ("confirm", "confirmed"), ("activate", "active")):
            self.assertEqual(self.c.post(f"/api/subscriptions/{s['id']}/actions/{a}", headers=h).get_json()["status"], st)
        self.assertEqual(self.c.post(f"/api/subscriptions/{s['id']}/actions/confirm", headers=h).status_code, 409)   # cannot skip/repeat steps
        bad = dict(body, lines=[{"product_id": 1, "quantity": 0}])
        self.assertEqual(self.c.post("/api/subscriptions", json=bad, headers=h).status_code, 422)

    def test_customer_can_renew_expired_subscription_when_plan_allows_it(self):
        admin = self.admin()
        customer = self.login("customer@example.com", "Customer@123")
        account = self.c.get("/api/me/account", headers=customer).get_json()
        customer_id = account["customer"]["id"]
        templates = self.c.get("/api/templates?per_page=100", headers=admin).get_json()["items"]
        plans = self.c.get("/api/plans?per_page=100", headers=admin).get_json()["items"]
        plan = next(p for p in plans if p["billing_period"] == "monthly" and p["allow_renew"])
        template = next(t for t in templates if t["plan_id"] == plan["id"])
        today = date.today()
        body = {"customer_id": customer_id, "template_id": template["id"],
                "start_date": today.isoformat(), "expiry_date": (today + timedelta(days=30)).isoformat()}
        sub = self.c.post("/api/subscriptions", json=body, headers=admin).get_json()
        for action in ("send", "confirm", "activate"):
            self.c.post(f"/api/subscriptions/{sub['id']}/actions/{action}", headers=admin)
        before = date.fromisoformat(sub["expiry_date"])
        term = (before - today).days
        expired = today - timedelta(days=1)
        from app.db import commit, execute
        with self.app.app_context():
            execute("UPDATE subscriptions SET start_date=?,expiry_date=?,status='closed',closed_at=? WHERE id=?",
                    ((expired - timedelta(days=term)).isoformat(), expired.isoformat(), expired.isoformat(), sub["id"]))
            commit()
        detail = self.c.get(f"/api/subscriptions/{sub['id']}", headers=customer).get_json()
        self.assertTrue(detail["can_renew"])
        renewed = self.c.post(f"/api/subscriptions/{sub['id']}/actions/renew", headers=customer)
        self.assertEqual(renewed.status_code, 200, renewed.get_json())
        result = renewed.get_json()
        self.assertEqual(result["status"], "active")
        self.assertEqual(result["expiry_date"], (expired + timedelta(days=term)).isoformat())
        self.assertIsNone(result["closed_at"])

        no_renew_plan = next(p for p in plans if not p["allow_renew"])
        product = self.c.get("/api/products?per_page=1", headers=admin).get_json()["items"][0]
        blocked_body = {"customer_id": customer_id, "plan_id": no_renew_plan["id"],
                        "start_date": today.isoformat(), "expiry_date": (today + timedelta(days=30)).isoformat(),
                        "lines": [{"product_id": product["id"], "quantity": no_renew_plan["min_quantity"]}]}
        blocked = self.c.post("/api/subscriptions", json=blocked_body, headers=admin).get_json()
        for action in ("send", "confirm", "activate"):
            self.c.post(f"/api/subscriptions/{blocked['id']}/actions/{action}", headers=admin)
        blocked_detail = self.c.get(f"/api/subscriptions/{blocked['id']}", headers=customer).get_json()
        self.assertFalse(blocked_detail["can_renew"])
        self.assertEqual(self.c.post(f"/api/subscriptions/{blocked['id']}/actions/renew", headers=customer).status_code, 409)

    def test_partial_payments_settle_exactly(self):
        h = self.admin()
        self.c.post("/api/billing/run", json={"as_of": (date.today() + timedelta(days=80)).isoformat()}, headers=h)
        inv = self.c.get("/api/invoices?status=draft&per_page=1", headers=h).get_json()["items"][0]
        self.c.post(f"/api/invoices/{inv['id']}/confirm", headers=h)
        pay = lambda amt: self.c.post(f"/api/invoices/{inv['id']}/payments", headers=h,
                                      json={"method": "cash", "amount": amt, "payment_date": date.today().isoformat()})
        half = round(inv["total"] / 2, 2)
        self.assertEqual(pay(half).get_json()["invoice"]["status"], "confirmed")       # partly paid stays open
        self.assertEqual(pay(round(inv["total"] - half + 0.5, 2)).status_code, 422)    # would over-pay
        last = pay(round(inv["total"] - half, 2)).get_json()["invoice"]
        self.assertEqual((last["status"], last["balance"]), ("paid", 0))
        self.assertEqual(pay(1).status_code, 409)                                       # paid invoices take no more money

    def test_health_and_security_headers(self):
        r = self.c.get("/healthz")
        self.assertEqual((r.status_code, r.get_json()["status"]), (200, "ok"))
        self.assertEqual(r.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(self.c.get("/api/subscriptions").headers["Cache-Control"], "no-store")


class CliTests(unittest.TestCase):
    def test_billing_job_persists_without_http_request(self):
        """Regression: `python run.py billing` used to report invoices but never commit them."""
        import sqlite3
        path = os.path.join(tempfile.mkdtemp(), "cli.db")
        app = create_app({"DATABASE": path, "TESTING": True})
        con = sqlite3.connect(path)
        con.execute("UPDATE subscriptions SET next_invoice_date='2026-01-01' WHERE status='active'")
        con.commit()
        before = con.execute("SELECT COUNT(*) FROM invoices").fetchone()[0]
        from app.db import commit
        from app.services import billing
        with app.app_context():
            created = billing.run_billing(auto_confirm=True)["invoices_created"]
            commit()
        self.assertGreater(created, 0)
        self.assertEqual(con.execute("SELECT COUNT(*) FROM invoices").fetchone()[0], before + created)
        con.close()


if __name__ == "__main__":
    unittest.main()
