from flask import current_app
from .. import repositories as R
from ..db import q, q1, paginate
from ..errors import ApiError
from ..security import hash_password, issue, password_error, read, verify_password
from ..validators import Validator
from . import mailer


def public(u):
    return {k: u[k] for k in ("id", "name", "email", "role")}


def _email_taken(email):
    return q1("SELECT id FROM users WHERE email=?", (email,)) is not None


def signup(data):
    v = Validator(data).text("name", max_len=80).email("email").text("company", False, 120)
    pw = (data or {}).get("password")
    err = password_error(pw)
    if err:
        v.error("password", err)
    if (data or {}).get("accepted_terms") is not True:
        v.error("accepted_terms", "Please accept the Terms and Privacy Policy to create an account")
    d = v.done()
    if _email_taken(d["email"]):
        raise ApiError("Please fix the highlighted fields", 422, {"email": "This email is already registered"})
    uid = R.users.insert(dict(name=d["name"], email=d["email"], password_hash=hash_password(pw), role="customer", active=1))
    R.customers.insert(dict(user_id=uid, name=d["name"], email=d["email"], company=d["company"]))
    return {"token": issue(uid), "user": public(R.users.get(uid))}


def login(data):
    email = str((data or {}).get("email", "")).strip().lower()
    pw = (data or {}).get("password") or ""
    u = q1("SELECT * FROM users WHERE email=?", (email,))
    if not u or not u["active"] or not verify_password(u["password_hash"], pw):
        raise ApiError("Invalid email or password", 401)
    return {"token": issue(u["id"]), "user": public(u)}


def forgot_password(data):
    email = str((data or {}).get("email", "")).strip().lower()
    u = q1("SELECT * FROM users WHERE email=?", (email,))
    out = {"message": "If that email is registered, a reset link is on its way."}
    if u and u["active"]:
        token = issue({"id": u["id"], "h": u["password_hash"][-10:]}, salt="reset")
        link = f"{current_app.config['FRONTEND_URL']}/#/reset?token={token}"
        mailer.get_mailer().send(u["email"], "Reset your Brightloop password",
                                 f"Hi {u['name']},\n\nUse this link to choose a new password (valid 1 hour):\n{link}\n")
        if mailer.is_console():  # dev convenience only; never enabled with SMTP
            out["dev_reset_link"] = link
    return out


def reset_password(data):
    token, pw = (data or {}).get("token", ""), (data or {}).get("password")
    err = password_error(pw)
    if err:
        raise ApiError("Please fix the highlighted fields", 422, {"password": err})
    p = read(token, salt="reset", max_age=current_app.config["RESET_MAX_AGE"])
    u = R.users.get(p["id"]) if p else None
    if not u or u["password_hash"][-10:] != p["h"]:
        raise ApiError("This reset link is invalid or has expired. Request a new one.", 400)
    R.users.update(u["id"], {"password_hash": hash_password(pw)})
    return {"message": "Password updated. You can sign in now."}


def create_staff(data):
    v = Validator(data).text("name", max_len=80).email("email")
    pw = (data or {}).get("password")
    err = password_error(pw)
    if err:
        v.error("password", err)
    d = v.done()
    if _email_taken(d["email"]):
        raise ApiError("Please fix the highlighted fields", 422, {"email": "This email is already registered"})
    uid = R.users.insert(dict(name=d["name"], email=d["email"], password_hash=hash_password(pw), role="staff", active=1))
    return public(R.users.get(uid))


def list_team(page, per):
    return paginate("SELECT id,name,email,role,active,created_at FROM users WHERE role IN('admin','staff') ORDER BY role,name",
                    "SELECT COUNT(*) n FROM users WHERE role IN('admin','staff')", (), page, per)


def set_active(uid, active, actor_id):
    u = R.users.get(uid)
    if not u or u["role"] == "customer":
        raise ApiError("Team member not found", 404)
    if u["id"] == actor_id:
        raise ApiError("You cannot deactivate your own account", 400)
    R.users.update(uid, {"active": 1 if active else 0})
    return {"id": uid, "active": 1 if active else 0}


# ---------- own account (every role) ----------
def account(user):
    """Everything the Profile page needs: identity, billing details (customers) and a few real activity numbers."""
    u = R.users.get(user["id"])
    out = {**public(u), "created_at": u["created_at"], "customer": None, "stats": {}}
    if u["role"] == "customer":
        c = q1("SELECT * FROM customers WHERE user_id=?", (u["id"],))
        out["customer"] = c
        if c:
            cid = c["id"]
            out["stats"] = {
                "active_subscriptions": q1("SELECT COUNT(*) n FROM subscriptions WHERE customer_id=? AND status='active'", (cid,))["n"],
                "total_subscriptions": q1("SELECT COUNT(*) n FROM subscriptions WHERE customer_id=?", (cid,))["n"],
                "open_invoices": q1("SELECT COUNT(*) n FROM invoices WHERE customer_id=? AND status='confirmed'", (cid,))["n"],
                "balance_due": q1("SELECT COALESCE(SUM(total-amount_paid),0) n FROM invoices WHERE customer_id=? AND status='confirmed'", (cid,))["n"],
                "total_paid": q1("SELECT COALESCE(SUM(amount_paid),0) n FROM invoices WHERE customer_id=? AND status IN('confirmed','paid')", (cid,))["n"],
            }
    else:
        out["stats"] = {
            "subscriptions_created": q1("SELECT COUNT(*) n FROM subscriptions WHERE created_by=?", (u["id"],))["n"],
            "payments_recorded": q1("SELECT COUNT(*) n FROM payments WHERE recorded_by=?", (u["id"],))["n"],
            "amount_recorded": q1("SELECT COALESCE(SUM(amount),0) n FROM payments WHERE recorded_by=?", (u["id"],))["n"],
        }
    return out


def update_account(user, data):
    v = Validator(data).text("name", max_len=80)
    if user["role"] == "customer":
        v.text("phone", False, 30).text("company", False, 120).text("address", False, 300)
    d = v.done()
    R.users.update(user["id"], {"name": d["name"]})
    if user["role"] == "customer":
        c = q1("SELECT id FROM customers WHERE user_id=?", (user["id"],))
        if c:
            R.customers.update(c["id"], {"name": d["name"], "phone": d["phone"], "company": d["company"], "address": d["address"]})
    return account(user)


def change_password(user, data):
    cur, new = (data or {}).get("current_password") or "", (data or {}).get("new_password")
    u = R.users.get(user["id"])
    errs = {}
    if not verify_password(u["password_hash"], cur):
        errs["current_password"] = "Current password is incorrect"
    err = password_error(new)
    if err:
        errs["new_password"] = err
    elif cur and new == cur:
        errs["new_password"] = "Choose a password you have not used just now"
    if errs:
        raise ApiError("Please fix the highlighted fields", 422, errs)
    R.users.update(u["id"], {"password_hash": hash_password(new)})
    return {"message": "Password changed."}


# ---------- public contact form ----------
TOPICS = ("general", "sales", "support", "billing", "security")


def contact(data):
    v = Validator(data).text("name", max_len=80).email("email").text("message", max_len=2000)
    topic = str((data or {}).get("topic") or "general").lower()
    d = v.done()
    if len(d["message"]) < 10:
        raise ApiError("Please fix the highlighted fields", 422, {"message": "Tell us a little more (at least 10 characters)"})
    d["topic"] = topic if topic in TOPICS else "general"
    R.contact_messages.insert(d)
    mailer.get_mailer().send(current_app.config["MAIL_FROM"], f"[Brightloop contact · {d['topic']}] from {d['name']}",
                             f"From: {d['name']} <{d['email']}>\nTopic: {d['topic']}\n\n{d['message']}\n")
    return {"message": "Thanks — your message has been received."}
