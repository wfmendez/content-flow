import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from database import Base


class SourceEnum(str, enum.Enum):
    rss = "rss"
    reddit = "reddit"
    twitter = "twitter"


class ChannelEnum(str, enum.Enum):
    linkedin = "linkedin"
    blog = "blog"
    newsletter = "newsletter"


class StatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    published = "published"


class Trend(Base):
    __tablename__ = "trends"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    summary = Column(Text)
    url = Column(String(1000))
    source = Column(SAEnum(SourceEnum))
    subreddit = Column(String(100))
    score = Column(Integer, default=0)
    relevance_score = Column(Integer, default=0)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    drafts = relationship("ContentDraft", back_populates="trend", cascade="all, delete-orphan")


class ContentDraft(Base):
    __tablename__ = "content_drafts"

    id = Column(Integer, primary_key=True, index=True)
    trend_id = Column(Integer, ForeignKey("trends.id"), nullable=False)
    channel = Column(SAEnum(ChannelEnum), nullable=False)
    title = Column(String(500))
    body = Column(Text, nullable=False)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # AI generation metadata — for transparency panel in UI
    ai_model = Column(String(100))            # e.g. "gemini-1.5-flash"
    prompt_used = Column(Text)                # full prompt sent to the model
    tokens_input = Column(Integer)            # estimated input token count
    tokens_output = Column(Integer)           # estimated output token count
    generation_cost_usd = Column(Float)       # calculated cost in USD

    trend = relationship("Trend", back_populates="drafts")
    publish_jobs = relationship("PublishJob", back_populates="draft", cascade="all, delete-orphan")


class PublishJob(Base):
    __tablename__ = "publish_jobs"

    id = Column(Integer, primary_key=True, index=True)
    draft_id = Column(Integer, ForeignKey("content_drafts.id"), nullable=False)
    channel = Column(SAEnum(ChannelEnum), nullable=False)
    status = Column(String(50), default="queued")
    published_at = Column(DateTime)
    error = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    draft = relationship("ContentDraft", back_populates="publish_jobs")
