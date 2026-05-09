from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import Trend, SourceEnum

router = APIRouter(prefix="/trends", tags=["trends"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class TrendOut(BaseModel):
    id: int
    title: str
    summary: Optional[str]
    url: Optional[str]
    source: Optional[str]
    subreddit: Optional[str]
    score: int
    relevance_score: int
    processed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TrendStats(BaseModel):
    total: int
    processed: int
    pending: int
    by_source: dict


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[TrendOut])
def list_trends(
    skip: int = 0,
    limit: int = 50,
    processed: Optional[bool] = None,
    source: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Trend).order_by(desc(Trend.created_at))
    if processed is not None:
        query = query.filter(Trend.processed == processed)
    if source:
        query = query.filter(Trend.source == source)
    return query.offset(skip).limit(limit).all()


@router.get("/stats", response_model=TrendStats)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Trend).count()
    processed = db.query(Trend).filter(Trend.processed == True).count()
    by_source = {}
    for src in SourceEnum:
        count = db.query(Trend).filter(Trend.source == src).count()
        if count:
            by_source[src.value] = count
    return TrendStats(total=total, processed=processed, pending=total - processed, by_source=by_source)


@router.get("/{trend_id}", response_model=TrendOut)
def get_trend(trend_id: int, db: Session = Depends(get_db)):
    trend = db.query(Trend).filter(Trend.id == trend_id).first()
    if not trend:
        raise HTTPException(status_code=404, detail="Trend not found")
    return trend


@router.post("/fetch", status_code=202)
def trigger_fetch():
    """Dispara manualmente el monitoreo de tendencias."""
    from workers.tasks import monitor_trends_task
    monitor_trends_task.delay()
    return {"message": "Trend fetch queued"}


@router.delete("/{trend_id}", status_code=204)
def delete_trend(trend_id: int, db: Session = Depends(get_db)):
    trend = db.query(Trend).filter(Trend.id == trend_id).first()
    if not trend:
        raise HTTPException(status_code=404, detail="Trend not found")
    db.delete(trend)
    db.commit()
