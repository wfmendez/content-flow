import httpx
import logging
from config import settings

logger = logging.getLogger(__name__)

LINKEDIN_API_URL = "https://api.linkedin.com/v2/ugcPosts"


def publish_to_linkedin(title: str, body: str) -> dict:
    """
    Publica un post en LinkedIn usando la UGC Posts API.
    Requiere: LINKEDIN_ACCESS_TOKEN y LINKEDIN_PERSON_URN en .env
    """
    if not settings.LINKEDIN_ACCESS_TOKEN or not settings.LINKEDIN_PERSON_URN:
        raise ValueError(
            "LinkedIn no configurado. Añade LINKEDIN_ACCESS_TOKEN y "
            "LINKEDIN_PERSON_URN en tu .env"
        )

    headers = {
        "Authorization": f"Bearer {settings.LINKEDIN_ACCESS_TOKEN}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }

    payload = {
        "author": settings.LINKEDIN_PERSON_URN,
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
