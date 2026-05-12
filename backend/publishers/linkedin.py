import httpx
import logging
from config import settings

logger = logging.getLogger(__name__)

LINKEDIN_API_URL = "https://api.linkedin.com/v2/ugcPosts"


def _get_linkedin_credentials() -> tuple[str, str]:
    """
    Returns (access_token, person_urn).
    Priority: DB (OAuth flow) → .env (legacy static token).
    """
    # Try DB-stored OAuth token first
    try:
        from database import SessionLocal
        from models import UserSettings
        db = SessionLocal()
        try:
            s = db.query(UserSettings).filter(
                UserSettings.user_email == settings.DEMO_EMAIL
            ).first()
            if s and s.linkedin_access_token and s.linkedin_person_urn:
                return s.linkedin_access_token, s.linkedin_person_urn
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"[LinkedIn] Could not read DB credentials: {e}")

    # Fall back to static .env token
    return settings.LINKEDIN_ACCESS_TOKEN, settings.LINKEDIN_PERSON_URN


def publish_to_linkedin(title: str, body: str) -> dict:
    """
    Publica un post en LinkedIn usando la UGC Posts API.
    Usa el token de OAuth (DB) o el token estático de .env como fallback.
    """
    access_token, person_urn = _get_linkedin_credentials()

    if not access_token or not person_urn:
        raise ValueError(
            "LinkedIn no configurado. Conecta tu cuenta en Settings → LinkedIn "
            "o añade LINKEDIN_ACCESS_TOKEN y LINKEDIN_PERSON_URN en .env"
        )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }

    payload = {
        "author": person_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": body
                },
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        },
    }

    with httpx.Client(timeout=30) as client:
        response = client.post(LINKEDIN_API_URL, headers=headers, json=payload)
        response.raise_for_status()

    post_id = response.headers.get("x-restli-id", "unknown")
    logger.info(f"[LinkedIn] Post publicado: {post_id}")

    return {
        "post_id": post_id,
        "url": f"https://www.linkedin.com/feed/update/{post_id}/",
    }
