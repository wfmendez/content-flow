# ⚡ Content-Flow

**AI-powered content automation pipeline.** Monitors tech trends from RSS feeds and Reddit, scores them with Gemini AI, generates adapted content for LinkedIn, blogs, and newsletters — then waits for your approval before publishing.

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Celery](https://img.shields.io/badge/Celery-5.4-37814A?style=flat&logo=celery&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-4285F4?style=flat&logo=google&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

---

## How it works

```
RSS Feeds ──┐                          ┌─► LinkedIn post
Reddit  ────┼──► AI Scoring ──► Queue ─┼─► Blog article
            │   (Gemini 1.5)           └─► Newsletter HTML
            │
            └──► Human approval dashboard ──► Publish
```

1. **Monitor** — fetches articles from RSS feeds (TechCrunch, HN, Dev.to) and Reddit subreddits on a configurable schedule
2. **Score** — sends all articles in a single Gemini API call, gets relevance scores 1–10; filters out low-signal content
3. **Generate** — for each high-scoring trend, produces channel-specific drafts (tone, format, and length adapted per platform)
4. **Review** — a React dashboard lets you read, approve, reject, or edit each draft before anything goes live
5. **Publish** — approved content is dispatched to the configured channels automatically

---

## Dashboard

| Dashboard | Trends | Content Review |
|:---------:|:------:|:--------------:|
| Stats, pipeline flow, quick actions | Trend cards with AI relevance scores | Expandable drafts with approve / reject / publish |

> Dark mode by default. Light mode toggle included.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| **API** | FastAPI + SQLAlchemy (sync) + PostgreSQL |
| **Task queue** | Celery 5 + Redis (broker & result backend) |
| **Scheduler** | Celery Beat — periodic trend monitoring |
| **AI** | Google Gemini 1.5 Flash (free tier: 1,500 RPM) |
| **AI fallback** | Groq + Llama 3.3 70B (14,400 req/day free) |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Infra** | Docker Compose (6 services) |

---

## Quick start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A free [Gemini API key](https://aistudio.google.com/app/apikey) (takes ~1 minute)

### 1 · Clone and configure

```bash
git clone https://github.com/wfmendez/content-flow.git
cd content-flow
cp .env.example .env
```

Open `.env` and add your Gemini key:

```env
GEMINI_API_KEY=your_key_here
```

### 2 · Start everything

```bash
docker-compose up --build
```

This starts 6 containers: PostgreSQL, Redis, FastAPI backend, Celery worker, Celery Beat scheduler, and the React frontend.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API docs | http://localhost:8000/docs |

### 3 · Fetch your first trends

Open the dashboard and click **"Buscar tendencias"** — or hit the API directly:

```bash
curl -X POST http://localhost:8000/api/trends/fetch
```

The worker will pull articles, score them with Gemini, and generate drafts for each channel. Check the **Tendencias** and **Contenido** pages.

---

## Free tier strategy

Running entirely on free AI tiers requires a few techniques — all implemented:

| Problem | Solution |
|---------|----------|
| Gemini free tier: 15 RPM (gemini-2.0-flash) | Switched to **gemini-1.5-flash** (1,500 RPM) |
| 30 articles × 1 API call each = rate limit | **Batch scoring**: 1 prompt → N scores |
| Burst of generation tasks | `--concurrency=2` + 5s sleep between channels |
| Transient 429 errors | Exponential backoff (10s → 20s → 40s) |
| Gemini fully down | Fallback to **Groq + Llama 3.3 70B** |

---

## Project structure

```
content-flow/
├── backend/
│   ├── api/              # FastAPI routers (trends, content)
│   ├── generators/       # AI prompt templates per channel
│   │   ├── base.py       # Gemini client + batch scoring + Groq fallback
│   │   ├── linkedin.py
│   │   ├── blog.py
│   │   └── newsletter.py
│   ├── sources/          # RSS and Reddit fetchers
│   ├── publishers/       # LinkedIn and newsletter publishers
│   ├── workers/          # Celery app, tasks, beat schedule
│   ├── models/           # SQLAlchemy models (Trend, ContentDraft, PublishJob)
│   ├── config.py         # Pydantic settings
│   └── main.py           # FastAPI app entrypoint
├── frontend/
│   └── src/
│       ├── pages/        # Dashboard, TrendsPage, ContentPage
│       ├── App.jsx       # Sidebar + dark mode toggle
│       └── api/          # Axios client
├── docker-compose.yml
└── .env.example
```

---

## Configuration

All settings are in `.env`. Key options:

```env
# AI
GEMINI_API_KEY=            # Required — get free at aistudio.google.com
GROQ_API_KEY=              # Optional fallback — get free at console.groq.com

# Sources
RSS_FEEDS=https://techcrunch.com/feed/,https://hnrss.org/frontpage,https://dev.to/feed
REDDIT_SUBREDDITS=artificial,MachineLearning,startups,technology

# Channels to generate content for
CONTENT_CHANNELS=linkedin,blog,newsletter

# Pipeline thresholds
MONITOR_INTERVAL_HOURS=6   # How often to check for new trends
MAX_TRENDS_PER_RUN=10      # Max articles to process per cycle
MIN_RELEVANCE_SCORE=6      # AI score threshold (1–10) to generate content

# Publishing (optional)
LINKEDIN_ACCESS_TOKEN=
SMTP_USER=                 # For newsletter delivery
```

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/trends/fetch` | Trigger trend monitoring now |
| `GET` | `/api/trends/` | List all trends |
| `GET` | `/api/trends/stats` | Pipeline stats |
| `POST` | `/api/content/generate/{trend_id}` | Generate drafts for a trend |
| `GET` | `/api/content/` | List all drafts |
| `PATCH` | `/api/content/{id}/approve` | Approve a draft |
| `PATCH` | `/api/content/{id}/reject` | Reject a draft |
| `POST` | `/api/content/{id}/publish` | Publish an approved draft |

Full interactive docs at **http://localhost:8000/docs**

---

## Roadmap

- [ ] Alembic migrations (replace `init_db()`)
- [ ] Twitter / X publisher
- [ ] Webhook triggers (bypass Beat scheduler)
- [ ] Analytics dashboard (content performance)
- [ ] Multi-user support with auth

---

## License

MIT — use it, fork it, build on it.
