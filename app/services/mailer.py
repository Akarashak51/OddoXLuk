"""Mail strategy: console (dev) or SMTP. Add new transports without touching callers (Open/Closed)."""
import os
import smtplib
from email.message import EmailMessage
from flask import current_app


class ConsoleMailer:
    def send(self, to, subject, body):
        path = os.path.join(os.path.dirname(current_app.config["DATABASE"]), "outbox.log")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(f"--- To: {to}\nSubject: {subject}\n{body}\n\n")
        print(f"[mail] to={to} subject={subject}")


class SmtpMailer:
    def send(self, to, subject, body):
        c = current_app.config
        msg = EmailMessage()
        msg["From"], msg["To"], msg["Subject"] = c["MAIL_FROM"], to, subject
        msg.set_content(body)
        with smtplib.SMTP(c["SMTP_HOST"], c["SMTP_PORT"], timeout=15) as s:
            s.starttls()
            if c["SMTP_USER"]:
                s.login(c["SMTP_USER"], c["SMTP_PASSWORD"])
            s.send_message(msg)


def get_mailer():
    mode = current_app.config["MAIL_MODE"].strip().lower()
    if mode == "console":
        return ConsoleMailer()
    if mode == "smtp":
        return SmtpMailer()
    raise RuntimeError("MAIL_MODE must be either 'console' or 'smtp'.")


def validate_mail_config(config):
    mode = str(config.get("MAIL_MODE", "console")).strip().lower()
    if mode not in ("console", "smtp"):
        raise RuntimeError("MAIL_MODE must be either 'console' or 'smtp'.")
    if mode == "smtp":
        missing = [name for name in ("SMTP_HOST", "MAIL_FROM", "FRONTEND_URL") if not str(config.get(name, "")).strip()]
        if missing:
            raise RuntimeError("SMTP mode requires: " + ", ".join(missing))
        sender = str(config["MAIL_FROM"]).strip().lower()
        if "@" not in sender or sender.endswith(".example"):
            raise RuntimeError("MAIL_FROM must be a real sender address accepted by your email provider.")
        if config.get("SMTP_USER") and not config.get("SMTP_PASSWORD"):
            raise RuntimeError("SMTP_PASSWORD is required when SMTP_USER is set.")


def is_console():
    return isinstance(get_mailer(), ConsoleMailer)
