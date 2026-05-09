import feedparser
import logging
from datetime import datetime
from typing import List, Dict, Any

from config import settings

logger = logging.getLogger(__name__)


def fetch_rss_trends() -> List[Dict[str, Any]]:
    """
    Lee todos los feeds RSS configurados y devuelve una lista de artículos
    normalizados como candidatos a trend.
    """
    results = []
    feeds = settings.rss_feeds_list

    for feed_url in feeds:
        try:
            feed = feedparser.parse(feed_url)
            feed_title = feed.feed.get("title", feed_url)
            logger.info(f"[RSS] Fetching '{feed_title}' — {len(feed.entries)} entries")

            for entry in feed.entries[:settings.MAX_TRENDS_PER_RUN]:
                summary = (
                    entry.get("summary", "")
                    or entry.get("description", "")
                    or ""
                )
                # Limpiar HTML básico
                summary = _strip_html(summary)[:500]

                results.append({
                    "title": entry.get("title", "No title")[:500],
                    "summary": summary,
                    "url": entry.get("link", ""),
                    "source": "rss",
                    "score": 0,
                })
        except Exception as e:
            logger.error(f"[RSS] Error fetching {feed_url}: {e}")

    logger.info(f"[RSS] Total articles fetched: {len(results)}")
    return results


def _strip_html(text: str) -> str:
    """Elimina etiquetas HTML básicas del texto."""
    import re
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean
