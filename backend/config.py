from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://contentflow:contentflow@localhost:5432/contentflow"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # Reddit
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    REDDIT_USER_AGENT: str = "ContentFlow/1.0"

    # LinkedIn
    LINKEDIN_ACCESS_TOKEN: str = ""
    LINKEDIN_PERSON_URN: str = ""

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    NEWSLETTER_FROM: str = ""
    NEWSLETTER_TO: str = ""

    # RSS
    RSS_FEEDS: str = "https://techcrunch.com/feed/,https://hnrss.org/frontpage,https://dev.to/feed"

    # Reddit subreddits
    REDDIT_SUBREDDITS: str = "artificial,MachineLearning,startups,technology"

    # Content
    CONTENT_CHANNELS: str = "linkedin,blog,newsletter"
    MONITOR_INTERVAL_HOURS: int = 6
    MAX_TRENDS_PER_RUN: int = 10
    MIN_RELEVANCE_SCORE: int = 6

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "change_this_in_production"
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def rss_feeds_list(self) -> List[str]:
        return [f.strip() for f in self.RSS_FEEDS.split(",") if f.strip()]

    @property
    def reddit_subreddits_list(self) -> List[str]:
        return [s.strip() for s in self.REDDIT_SUBREDDITS.split(",") if s.strip()]

    @property
    def content_channels_list(self) -> List[str]:
        return [c.strip() for c in self.CONTENT_CHANNELS.split(",") if c.strip()]

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def newsletter_recipients_list(self) -> List[str]:
        return [r.strip() for r in self.NEWSLETTER_TO.split(",") if r.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
