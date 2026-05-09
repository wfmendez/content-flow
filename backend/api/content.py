from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import ContentDraft, Trend, PublishJob, ChannelEnum, StatusEnum

router = APIRouter(prefix="/content", tags=["content"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class TrendSnippet(BaseModel):
    id: int
    title: str
    source: Optional[str]

    class Config:
        from_attributes = True


class PublishJobOut(BaseModel):
    id: int
    channel: str
    status: str
    published_at: Optional[datetime]
    error: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ContentDraftOut(BaseModel):
    id: int
    trend_id: int
    channel: str
    title: Optional[str]
    body: str
    status: str
    created_at: datetime
    updated_at: datetime
    trend: Optional[TrendSnippet]
    publish_jobs: List[PublishJobOut] = []

    class Config:
        from_attributes = True


class ContentDraftUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None


class ContentStats(BaseModel):
    total: int
    pending: int
    approved: int
    rejected: int
    published: int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ContentDraftOut])
def list_drafts(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    channel: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(ContentDraft)
        .options(joinedload(ContentDraft.trend), joinedload(ContentDraft.publish_jobs))
        .order_by(desc(ContentDraft.created_at))
    )
    if status:
        query = query.filter(ContentDraft.status == status)
    if channel:
        query = query.filter(ContentDraft.channel == channel)
    return query.offset(skip).limit(limit).all()


@router.get("/stats", response_model=ContentStats)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(ContentDraft).count()
    return ContentStats(
        total=total,
        pending=db.query(ContentDraft).filter(ContentDraft.status == StatusEnum.pending).count(),
        approved=db.query(ContentDraft).filter(ContentDraft.status == StatusEnum.approved).count(),
        rejected=db.query(ContentDraft).filter(ContentDraft.status == StatusEnum.rejected).count(),
        published=db.query(ContentDraft).filter(ContentDraft.status == StatusEnum.published).count(),
    )


@router.get("/{draft_id}", response_model=ContentDraftOut)
def get_draft(draft_id: int, db: Session = Depends(get_db)):
    draft = (
        db.query(ContentDraft)
        .options(joinedload(ContentDraft.trend), joinedload(ContentDraft.publish_jobs))
        .filter(ContentDraft.id == draft_id)
        .first()
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


@router.post("/generate/{trend_id}", status_code=202)
def generate_content(trend_id: int, db: Session = Depends(get_db)):
    """Genera borradores para todos los canales configurados a partir de un trend."""
    trend = db.query(Trend).filter(Trend.id == trend_id).first()
    if not trend:
        raise HTTPException(status_code=404, detail="Trend not found")

    from workers.tasks import generate_content_task
    generate_content_task.delay(trend_id)
    return {"message": f"Content generation queued for trend {trend_id}"}


@router.patch("/{draft_id}", response_model=ContentDraftOut)
def update_draft(draft_id: int, data: ContentDraftUpdate, db: Session = Depends(get_db)):
    draft = db.query(ContentDraft).filter(ContentDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if data.title is not None:
        draft.title = data.title
    if data.body is not None:
        draft.body = data.body
    draft.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(draft)
    return draft


@router.post("/{draft_id}/approve", response_model=ContentDraftOut)
def approve_draft(draft_id: int, db: Session = Depends(get_db)):
    draft = db.query(ContentDraft).filter(ContentDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.status not in (StatusEnum.pending, StatusEnum.rejected):
        raise HTTPException(status_code=400, detail=f"Cannot approve draft with status '{draft.status}'")
    draft.status = StatusEnum.approved
    draft.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(draft)
    return draft


@router.post("/{draft_id}/reject", response_model=ContentDraftOut)
def reject_draft(draft_id: int, db: Session = Depends(get_db)):
    draft = db.query(ContentDraft).filter(ContentDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    draft.status = StatusEnum.rejected
    draft.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(draft)
    return draft


@router.post("/{draft_id}/publish", status_code=202)
def publish_draft(draft_id: int, db: Session = Depends(get_db)):
    """Envía a publicar un borrador aprobado."""
    draft = db.query(ContentDraft).filter(ContentDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.status != StatusEnum.approved:
        raise HTTPException(status_code=400, detail="Only approved drafts can be published")

    from workers.tasks import publish_content_task
    publish_content_task.delay(draft_id)
    return {"message": f"Publish queued for draft {draft_id}"}


@router.delete("/{draft_id}", status_code=204)
def delete_draft(draft_id: int, db: Session = Depends(get_db)):
    draft = db.query(ContentDraft).filter(ContentDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    db.delete(draft)
    db.commit()
