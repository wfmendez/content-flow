import praw
import logging
from typing import List, Dict, Any

from config import settings

logger = logging.getLogger(__name__)


def _get_reddit_client() -> praw.Reddit:
    return praw.Reddit(
        client_id=settings.REDDIT_CLIENT_ID,
        client_secret=settings.REDDIT_CLIENT_SECRET,
        user_agent=settings.REDDIT_USER_AGENT,
    )


def fetch_reddit_trends() -> List[Dict[str, Any]]:
    """
    Obtiene los posts más populares (hot) de los subreddits configurados
    y los devuelve normalizados como candidatos a trend.
    """
    if not settings.REDDIT_CLIENT_ID or not settings.REDDIT_CLIENT_SECRET:
        logger.warning("[Reddit] Credenciales no configuradas, saltando fuente Reddit.")
        return []

    results = []
    subreddits = settings.reddit_subreddits_list

    try:
        reddit = _get_reddit_client()

        for sub_name in subreddits:
            try:
                subreddit = reddit.subreddit(sub_name)
                logger.info(f"[Reddit] Fetching r/{sub_name}")

                for post in subreddit.hot(limit=settings.MAX_TRENDS_PER_RUN):
                    if post.stickied:
                        continue

                    summary = post.selftext[:500] if post.selftext else f"[Link] {post.url}"

                    results.append({
                        "title": post.title[:500],
                        "summary": summary,
                        "url": f"https://reddit.com{post.permalink}",
                        "source": "reddit",
                        "subreddit": sub_name,
                        "score": post.score,
                    })
            except Exception as e:
                logger.error(f"[Reddit] Error en r/{sub_name}: {e}")

    except Exception as e:
        logger.error(f"[Reddit] Error inicializando cliente: {e}")

    logger.info(f"[Reddit] Total posts fetched: {len(results)}")
    return results
