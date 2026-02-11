from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.db.session import engine, SessionLocal
from app.db.base import Base

from app.models import user, status, task, message  # noqa: F401
from app.models.status import Status

from app.api.auth import router as auth_router
from app.api.tasks import router as tasks_router
from app.api.users import router as users_router
from app.api.statuses import router as statuses_router
from app.api.messages import router as messages_router


app = FastAPI(title="Task Manager API", version="1.0.0")

# =========================
# CORS (обязательно)
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # JWT передаётся в заголовке Authorization, куки не нужны
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
app.include_router(users_router)

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
            db.add_all(
                [
                    Status(name="сделать", order_index=1),
                    Status(name="в работе", order_index=2),
                    Status(name="на проверке", order_index=3),
                    Status(name="готово", order_index=4),
                ]
            )
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
def ensure_task_assignee_column():
    """Adds tasks.assignee_id when migrating existing SQLite DB without Alembic."""
    db = SessionLocal()
    try:
        columns = [row[1] for row in db.execute(text("PRAGMA table_info(tasks);")).all()]
        if "assignee_id" not in columns:
            db.execute(text("ALTER TABLE tasks ADD COLUMN assignee_id INTEGER REFERENCES users(id);"))
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
def ensure_user_password_plain_column():
    """Adds users.password_plain for displaying plaintext (per requirements)."""
    db = SessionLocal()
    try:
        columns = [row[1] for row in db.execute(text("PRAGMA table_info(users);")).all()]
        if "password_plain" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN password_plain TEXT;"))
            db.commit()
    finally:
        db.close()
