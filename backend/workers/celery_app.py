from celery import Celery
from celery.schedules import crontab
from config import settings

celery_app = Celery(
    "contentflow",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_queue="celery",
    broker_connection_retry_on_startup=True,
)

# ── Programación periódica (Beat) ─────────────────────────────────────────────
celery_app.conf.beat_schedule = {
    # Monitoreo de tendencias cada N horas (configurable en .env)
    "monitor-trends": {
        "task": "workers.tasks.monitor_trends_task",
        "schedule": crontab(minute=0, hour=f"*/{settings.MONITOR_INTERVAL_HOURS}"),
    },
    # Auto-publicar borradores aprobados cada 30 minutos
    "auto-publish-approved": {
        "task": "workers.tasks.auto_publish_approved_task",
        "schedule": crontab(minute="*/30"),
    },
}
