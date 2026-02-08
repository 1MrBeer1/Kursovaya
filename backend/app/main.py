
from fastapi import FastAPI

from app.db.session import engine
from app.db.base import Base
from app.models import user, status, task, message
from app.api.auth import router as auth_router
from app.api.tasks import router as tasks_router
from app.api.statuses import router as statuses_router
from app.api.messages import router as messages_router

app = FastAPI(
    title="Task Manager API",
    version="1.0.0"
)

app.include_router(tasks_router)
app.include_router(statuses_router)
app.include_router(auth_router)
app.include_router(messages_router)

Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"status": "ok"}


from app.db.session import SessionLocal
from app.models.status import Status

@app.on_event("startup")
def seed_statuses():
    db = SessionLocal()

    if db.query(Status).count() == 0:
        statuses = [
            Status(name="сделать", order_index=1),
            Status(name="в работе", order_index=2),
            Status(name="на проверке", order_index=3),
            Status(name="готово", order_index=4),
        ]

        db.add_all(statuses)
        db.commit()

    db.close()

