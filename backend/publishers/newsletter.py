import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import settings

logger = logging.getLogger(__name__)


def publish_newsletter(title: str, body: str) -> dict:
    """
    Envía un ítem de newsletter por email SMTP a los destinatarios configurados.
    Compatible con Gmail (usa App Password), Mailgun SMTP, SendGrid SMTP, etc.
    """
    recipients = settings.newsletter_recipients_list
    if not recipients:
        raise ValueError("NEWSLETTER_TO no tiene destinatarios configurados en .env")

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        raise ValueError("SMTP_USER / SMTP_PASSWORD no configurados en .env")

    html_body = _build_email_html(title, body)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"📬 {title}"
    msg["From"] = settings.NEWSLETTER_FROM or settings.SMTP_USER
    msg["To"] = ", ".join(recipients)

    msg.attach(MIMEText(_html_to_plain(body), "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, recipients, msg.as_string())

    logger.info(f"[Newsletter] Email enviado a {len(recipients)} destinatarios: '{title}'")

    return {
        "recipients": len(recipients),
        "subject": msg["Subject"],
    }


def _build_email_html(title: str, content: str) -> str:
    """Envuelve el contenido HTML en una plantilla de email limpia."""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
             background: #f9f9f9; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff;
              border-radius: 8px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,.08);">

    <div style="border-bottom: 3px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px;">
      <span style="font-size: 13px; color: #6366f1; font-weight: 600; text-transform: uppercase;
                   letter-spacing: 1px;">Content-Flow Newsletter</span>
    </div>

    {content}

    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;
                font-size: 12px; color: #9ca3af; text-align: center;">
      Generado automáticamente por Content-Flow · Para darse de baja, responde este email.
    </div>
  </div>
</body>
</html>"""


def _html_to_plain(html: str) -> str:
    """Versión texto plano básica del HTML para clientes que no renderizan HTML."""
    import re
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    text = re.sub(r"<li[^>]*>", "• ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
