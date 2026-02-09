from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine, SessionLocal
from app.db.base import Base

from app.models import user, status, task, message
from app.models.status import Status

from app.api.auth import router as auth_router
from app.api.tasks import router as tasks_router
from app.api.statuses import router as statuses_router
from app.api.messages import router as messages_router


app = FastAPI(
    title="Task Manager API",
    version="1.0.0"
)

# =========================
# CORS (ОБЯЗАТЕЛЬНО)
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # если вдруг Vite
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Роутеры
# =========================
app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(statuses_router)
app.include_router(messages_router)

# =========================
# База данных
# =========================
Base.metadata.create_all(bind=engine)

# =========================
# Healthcheck
# =========================
@app.get("/")
def root():
    return {"status": "ok"}

# =========================
# Сидинг статусов
# =========================
@app.on_event("startup")
def seed_statuses():
    db = SessionLocal()
    try:
        if db.query(Status).count() == 0:
            db.add_all([
                Status(name="сделать", order_index=1),
                Status(name="в работе", order_index=2),
                Status(name="на проверке", order_index=3),
                Status(name="готово", order_index=4),
            ])
            db.commit()
    finally:
        db.close()
