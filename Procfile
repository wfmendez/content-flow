# Procfile — define los 3 procesos del backend para Railway
# Cada línea es un servicio separado en el dashboard de Railway.
# Todos usan el mismo Dockerfile (backend/) con distinto start command.

web:    uvicorn main:app --host 0.0.0.0 --port $PORT
worker: celery -A workers.celery_app worker --loglevel=info --concurrency=2
beat:   celery -A workers.celery_app beat --loglevel=info --scheduler celery.beat.PersistentScheduler
