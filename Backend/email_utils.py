# email_utils.py
import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv()

def build_verification_url(email: str, token: str) -> str:
    base = os.getenv("BACKEND_BASE_URL", "http://localhost:8080")
    query = urlencode({"token": token, "email": email})
    return f"{base}/api/auth/verify-email?{query}"

async def send_verification_email(to_email: str, token: str, display_name: str = "User"):
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")
    email_from = os.getenv("EMAIL_FROM", email_user)

    if not email_user or not email_pass:
        print("⚠️ Gmail SMTP not configured (EMAIL_USER/EMAIL_PASS missing). Skipping email send.")
        return

    verify_url = build_verification_url(to_email, token)

    msg = MIMEMultipart("alternative")
    msg["From"] = email_from
    msg["To"] = to_email
    msg["Subject"] = "Verify your email - LLM Email AutoWriter"

    text_part = f"""Hi {display_name},\n\nPlease verify your email by clicking the link below:\n{verify_url}\n\nIf you didn't sign up, ignore this message."""

    html_part = f"""\
<html>
  <body style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#0f172a;">
    <h2>Verify your email</h2>
    <p>Hi {display_name},</p>
    <p>Please verify your email by clicking the button below:</p>
    <p>
      <a href="{verify_url}" style="background:#2563eb;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">
        Verify Email
      </a>
    </p>
    <p>Or copy this link into your browser:</p>
    <p><a href="{verify_url}">{verify_url}</a></p>
    <hr/>
    <small>If you didn't request this, you can ignore this email.</small>
  </body>
</html>
"""

    msg.attach(MIMEText(text_part, "plain"))
    msg.attach(MIMEText(html_part, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=email_user,
            password=email_pass,
            timeout=20,
        )
        print(f"📧 Sent verification email to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send verification email to {to_email}: {e}")
