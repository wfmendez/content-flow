import logging
from datetime import datetime

from workers.celery_app import celery_app
from database import SessionLocal
from models import Trend, ContentDraft, DraftVersion, PublishJob, UserSettings, SourceEnum, ChannelEnum, StatusEnum
from config import settings as settings_config

logger = logging.getLogger(__name__)


# ── Task 1: Monitorear tendencias ─────────────────────────────────────────────

@celery_app.task(name="workers.tasks.monitor_trends_task", bind=True, max_retries=3)
def monitor_trends_task(self):
    """
    1. Obtiene artículos de RSS y Reddit
    2. Evalúa relevancia con Gemini
    3. Guarda los que superan MIN_RELEVANCE_SCORE en la BD
    """
    logger.info("[Task] Iniciando monitoreo de tendencias...")
    db = SessionLocal()

    try:
        from sources.rss import fetch_rss_trends
        from sources.reddit import fetch_reddit_trends
        from generators.base import score_trends_batch

        all_items = []
        all_items.extend(fetch_rss_trends())
        all_items.extend(fetch_reddit_trends())

        # Filtrar duplicados antes de llamar a la IA
        new_items = []
        skipped_duplicate = 0
        for item in all_items:
            if item.get("url"):
                exists = db.query(Trend).filter(Trend.url == item["url"]).first()
                if exists:
                    skipped_duplicate += 1
                    continue
            new_items.append(item)

        saved = 0
        skipped_low_score = 0

        if new_items:
            # UNA sola llamada a Gemini para puntuar todos los artículos
            logger.info(f"[Task] Puntuando {len(new_items)} artículos en batch...")
            scores = score_trends_batch(new_items)

            for item, relevance in zip(new_items, scores):
                if relevance < settings_config.MIN_RELEVANCE_SCORE:
                    skipped_low_score += 1
                    logger.debug(f"[Task] Descartado (score {relevance}): {item['title'][:60]}")
                    continue

                trend = Trend(
                    title=item["title"],
                    summary=item.get("summary", ""),
                    url=item.get("url", ""),
                    source=SourceEnum(item["source"]),
                    subreddit=item.get("subreddit"),
                    score=item.get("score", 0),
                    relevance_score=relevance,
                )
                db.add(trend)
                db.flush()
                saved += 1
                # Encolar generación de contenido automáticamente
                generate_content_task.delay(trend.id)

        db.commit()
        result = {
            "saved": saved,
            "skipped_low_score": skipped_low_score,
            "skipped_duplicate": skipped_duplicate,
            "total_fetched": len(all_items),
        }
        logger.info(f"[Task] Monitor completado: {result}")
        return result

    except Exception as exc:
        db.rollback()
        logger.error(f"[Task] Error en monitor_trends_task: {exc}")
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


# ── Task 2: Generar contenido ─────────────────────────────────────────────────

@celery_app.task(name="workers.tasks.generate_content_task", bind=True, max_retries=2)
def generate_content_task(self, trend_id: int):
    """
    Para un trend dado, genera un borrador por cada canal configurado
    (linkedin, blog, newsletter) usando Gemini.
    """
    logger.info(f"[Task] Generando contenido para trend_id={trend_id}")
    db = SessionLocal()

    try:
        trend = db.query(Trend).filter(Trend.id == trend_id).first()
        if not trend:
            logger.warning(f"[Task] Trend {trend_id} no encontrado.")
            return

        # Solo saltar si ya tiene borradores generados (evita duplicar contenido real)
        existing_drafts = db.query(ContentDraft).filter(ContentDraft.trend_id == trend_id).count()
        if existing_drafts > 0:
            logger.info(f"[Task] Trend {trend_id} ya tiene {existing_drafts} borradores.")
            return

        from generators.linkedin import generate_linkedin_post
        from generators.blog import generate_blog_post
        from generators.newsletter import generate_newsletter_item

        # ── Read brand voice settings from DB ────────────────────────────────
        brand = db.query(UserSettings).filter(
            UserSettings.user_email == settings_config.DEMO_EMAIL
        ).first()
        brand_name = brand.brand_name if brand else ""
        tone = brand.brand_tone if brand else "profesional"
        audience = brand.target_audience if brand else ""
        logger.info(f"[Task] Brand voice: '{brand_name}' / '{tone}' for trend {trend_id}")

        generators = {
            ChannelEnum.linkedin: generate_linkedin_post,
            ChannelEnum.blog: generate_blog_post,
            ChannelEnum.newsletter: generate_newsletter_item,
        }

        import time
        channels_generated = []
        for i, channel_str in enumerate(settings_config.content_channels_list):
            # Pausa entre canales para respetar el rate limit del free tier
            if i > 0:
                time.sleep(5)
            try:
                channel = ChannelEnum(channel_str)
                generator_fn = generators[channel]

                result = generator_fn(
                    title=trend.title,
                    summary=trend.summary or "",
                    url=trend.url or "",
                    brand_name=brand_name,
                    tone=tone,
                    audience=audience,
                )

                draft = ContentDraft(
                    trend_id=trend.id,
                    channel=channel,
                    title=result.get("title", "")[:500],
                    body=result["body"],
                    status=StatusEnum.pending,
                    # AI transparency metadata
                    ai_model=result.get("ai_model"),
                    prompt_used=result.get("prompt_used"),
                    tokens_input=result.get("tokens_input"),
                    tokens_output=result.get("tokens_output"),
                    generation_cost_usd=result.get("generation_cost_usd"),
                )
                db.add(draft)
                db.flush()  # get draft.id
                # Save version 1 — original AI-generated snapshot
                v1 = DraftVersion(
                    draft_id=draft.id,
                    title=draft.title,
                    body=draft.body,
                    version_number=1,
                    note="Generado por IA",
                )
                db.add(v1)
                channels_generated.append(channel_str)
                logger.info(f"[Task] Borrador generado: {channel_str} para trend {trend_id}")

            except Exception as e:
                logger.error(f"[Task] Error generando {channel_str} para trend {trend_id}: {e}")

        trend.processed = True
        db.commit()

        return {"trend_id": trend_id, "channels": channels_generated}

    except Exception as exc:
        db.rollback()
        logger.error(f"[Task] Error en generate_content_task: {exc}")
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()


# ── Task 3: Publicar contenido ────────────────────────────────────────────────

@celery_app.task(name="workers.tasks.publish_content_task", bind=True, max_retries=2)
def publish_content_task(self, draft_id: int):
    """
    Publica un borrador aprobado en su canal correspondiente
    y registra el resultado en PublishJob.
    """
    logger.info(f"[Task] Publicando draft_id={draft_id}")
    db = SessionLocal()

    try:
        draft = db.query(ContentDraft).filter(ContentDraft.id == draft_id).first()
        if not draft:
            logger.warning(f"[Task] Draft {draft_id} no encontrado.")
            return

        if draft.status != StatusEnum.approved:
            logger.warning(f"[Task] Draft {draft_id} no está aprobado (status={draft.status}).")
            return

        job = PublishJob(
            draft_id=draft.id,
            channel=draft.channel,
            status="running",
        )
        db.add(job)
        db.flush()

        try:
            result = _publish_draft(draft)
            job.status = "success"
            job.published_at = datetime.utcnow()
            draft.status = StatusEnum.published
            draft.updated_at = datetime.utcnow()
            logger.info(f"[Task] Publicado con éxito: {result}")

        except Exception as pub_error:
            job.status = "failed"
            job.error = str(pub_error)
            logger.error(f"[Task] Error publicando draft {draft_id}: {pub_error}")

        db.commit()
        return {"draft_id": draft_id, "job_status": job.status}

    except Exception as exc:
        db.rollback()
        logger.error(f"[Task] Error en publish_content_task: {exc}")
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


def _publish_draft(draft: ContentDraft) -> dict:
    """Despacha al publisher correcto según el canal del borrador."""
    if draft.channel == ChannelEnum.linkedin:
        from publishers.linkedin import publish_to_linkedin
        return publish_to_linkedin(title=draft.title or "", body=draft.body)

    elif draft.channel == ChannelEnum.newsletter:
        from publishers.newsletter import publish_newsletter
        return publish_newsletter(title=draft.title or "", body=draft.body)

    elif draft.channel == ChannelEnum.blog:
        # Blog: guardar el markdown en disco/CMS (stub extensible)
        _save_blog_post(draft)
        return {"status": "saved_to_disk"}

    raise ValueError(f"Canal no soportado: {draft.channel}")


def _save_blog_post(draft: ContentDraft):
    """Guarda el post de blog como archivo Markdown (stub para CMS externo)."""
    import os, re
    slug = re.sub(r"[^a-z0-9]+", "-", (draft.title or f"post-{draft.id}").lower()).strip("-")
    output_dir = "/app/blog_posts"
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, f"{slug}.md")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(draft.body)
    logger.info(f"[Blog] Post guardado en {filepath}")


# ── Task 4: Auto-publicar aprobados ───────────────────────────────────────────

@celery_app.task(name="workers.tasks.auto_publish_approved_task")
def auto_publish_approved_task():
    """
    Revisa borradores con status=approved y los encola para publicar.
    Corre cada 30 min vía Celery Beat.
    """
    db = SessionLocal()
    try:
        approved = (
            db.query(ContentDraft)
            .filter(ContentDraft.status == StatusEnum.approved)
            .all()
        )
        for draft in approved:
            publish_content_task.delay(draft.id)
            logger.info(f"[Beat] Auto-publicando draft {draft.id} ({draft.channel})")
        return {"queued": len(approved)}
    finally:
        db.close()
