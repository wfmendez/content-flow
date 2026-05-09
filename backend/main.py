import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import init_db
from api.trends import router as trends_router
from api.content import router as content_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Arranque: crear tablas (reintenta hasta 5 veces para esperar a que
    # PostgreSQL esté listo en Railway/Docker antes de crashear)
    import time
    for attempt in range(5):
        try:
            init_db()
            logger.info("[DB] Tablas inicializadas correctamente.")
            break
        except Exception as e:
            if attempt < 4:
                wait = 3 * (attempt + 1)
                logger.warning(f"[DB] No disponible (intento {attempt+1}/5). Reintentando en {wait}s... {e}")
                time.sleep(wait)
            else:
                logger.error(f"[DB] No se pudo conectar tras 5 intentos: {e}")
                raise
    yield
    # Cierre: (nada por ahora)


app = FastAPI(
    title="Content-Flow API",
    description="Pipeline de automatización de contenido con IA",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(trends_router, prefix="/api")
app.include_router(content_router, prefix="/api")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/", tags=["system"])
def root():
    return {
        "name": "Content-Flow API",
        "docs": "/docs",
        "health": "/health",
    }
