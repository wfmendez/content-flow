import secrets
import urllib.parse
import httpx
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import authenticate_user, create_access_token, get_current_user, UserOut
from config import settings
from database import get_db
from models import UserSettings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_SCOPES = "openid profile email w_member_social"


# ── JWT auth ──────────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(user.email)
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserOut)
def me(current_user: UserOut = Depends(get_current_user)):
    return current_user


# ── LinkedIn OAuth 2.0 ────────────────────────────────────────────────────────

@router.get("/linkedin")
def linkedin_oauth_start():
    """Redirects the browser to LinkedIn's consent screen."""
    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(
            status_code=400,
            detail="LinkedIn OAuth not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env",
        )
    state = secrets.token_urlsafe(16)
    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "state": state,
        "scope": LINKEDIN_SCOPES,
    }
    return RedirectResponse(f"{LINKEDIN_AUTH_URL}?{urllib.parse.urlencode(params)}")


@router.get("/linkedin/callback")
def linkedin_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    """Exchanges auth code for tokens and stores them in UserSettings."""
    try:
        with httpx.Client(timeout=15) as client:
            # 1. Exchange code → access token
            token_resp = client.post(LINKEDIN_TOKEN_URL, data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
            }, headers={"Content-Type": "application/x-www-form-urlencoded"})
            token_resp.raise_for_status()
            access_token = token_resp.json()["access_token"]

            # 2. Get LinkedIn member profile (OpenID userinfo endpoint)
            me_resp = client.get("https://api.linkedin.com/v2/userinfo", headers={
                "Authorization": f"Bearer {access_token}",
            })
            me_resp.raise_for_status()
            person_id = me_resp.json().get("sub", "")
            person_urn = f"urn:li:person:{person_id}"

        # 3. Persist in UserSettings (upsert for demo user)
        s = db.query(UserSettings).filter(UserSettings.user_email == settings.DEMO_EMAIL).first()
        if not s:
            s = UserSettings(user_email=settings.DEMO_EMAIL)
            db.add(s)
        s.linkedin_access_token = access_token
        s.linkedin_person_urn = person_urn
        db.commit()

        logger.info(f"[LinkedIn OAuth] Conectado: {person_urn}")
        return RedirectResponse(f"{settings.FRONTEND_URL}/settings?linkedin=connected")

    except Exception as e:
        logger.error(f"[LinkedIn OAuth] Error: {e}")
        return RedirectResponse(f"{settings.FRONTEND_URL}/settings?linkedin=error")


@router.get("/linkedin/status")
def linkedin_status(db: Session = Depends(get_db)):
    """Returns whether a LinkedIn token is stored for the demo user."""
    s = db.query(UserSettings).filter(UserSettings.user_email == settings.DEMO_EMAIL).first()
    connected = bool(s and s.linkedin_access_token)
    return {
        "connected": connected,
        "person_urn": s.linkedin_person_urn if s else None,
        "configured": bool(settings.LINKEDIN_CLIENT_ID),
    }
