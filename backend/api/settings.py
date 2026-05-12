"""
User settings API — persists brand voice, channel config, and ROI params to DB.
Settings are read by the AI generators to personalise every draft.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db
from models import UserSettings
from auth import get_current_user, UserOut

router = APIRouter(prefix="/settings", tags=["settings"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserSettingsIn(BaseModel):
    brand_name: str = "Mi Empresa"
    brand_tone: str = "profesional"
    target_audience: str = "Profesionales de tecnología y startups en LATAM"
    topics: str = "Inteligencia Artificial,SaaS,Marketing Digital,Startups,Productividad"
    active_channels: str = "linkedin,blog,newsletter"
    posts_per_week: int = 3
    minutes_per_post: int = 45
    webhook_url: str = ""


class UserSettingsOut(UserSettingsIn):
    linkedin_connected: bool = False
    linkedin_person_urn: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=UserSettingsOut)
def get_settings(
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(UserSettings).filter(UserSettings.user_email == current_user.email).first()
    if not s:
        return UserSettingsOut()
    return UserSettingsOut(
        brand_name=s.brand_name,
        brand_tone=s.brand_tone,
        target_audience=s.target_audience,
        topics=s.topics,
        active_channels=s.active_channels,
        posts_per_week=s.posts_per_week,
        minutes_per_post=s.minutes_per_post,
        webhook_url=s.webhook_url or "",
        linkedin_connected=bool(s.linkedin_access_token),
        linkedin_person_urn=s.linkedin_person_urn,
        updated_at=s.updated_at,
    )


@router.put("/", response_model=UserSettingsOut)
def save_settings(
    data: UserSettingsIn,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(UserSettings).filter(UserSettings.user_email == current_user.email).first()
    if not s:
        s = UserSettings(user_email=current_user.email)
        db.add(s)

    s.brand_name = data.brand_name
    s.brand_tone = data.brand_tone
    s.target_audience = data.target_audience
    s.topics = data.topics
    s.active_channels = data.active_channels
    s.posts_per_week = data.posts_per_week
    s.minutes_per_post = data.minutes_per_post
    s.webhook_url = data.webhook_url
    s.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(s)

    return UserSettingsOut(
        brand_name=s.brand_name,
        brand_tone=s.brand_tone,
        target_audience=s.target_audience,
        topics=s.topics,
        active_channels=s.active_channels,
        posts_per_week=s.posts_per_week,
        minutes_per_post=s.minutes_per_post,
        webhook_url=s.webhook_url or "",
        linkedin_connected=bool(s.linkedin_access_token),
        linkedin_person_urn=s.linkedin_person_urn,
        updated_at=s.updated_at,
    )


@router.delete("/linkedin", status_code=204)
def disconnect_linkedin(
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revokes stored LinkedIn OAuth tokens."""
    s = db.query(UserSettings).filter(UserSettings.user_email == current_user.email).first()
    if s:
        s.linkedin_access_token = None
        s.linkedin_person_urn = None
        db.commit()
