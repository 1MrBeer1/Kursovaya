from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.task import Task
from app.models.status import Status
from app.schemas.task import TaskCreate, TaskStatusUpdate
from app.models.user import User

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/")
def get_tasks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tasks = db.query(Task).all()

    return [
        {
            "id": t.id,
            "title": t.title,
            "short_description": t.short_description,
            "status": db.query(Status).get(t.status_id).name,
        }
        for t in tasks
    ]


@router.post("/", status_code=201)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in ("manager", "ceo", "admin"):
        raise HTTPException(status_code=403, detail="Access denied")

    # ✅ статус теперь берём из запроса
    status_obj = db.query(Status).filter(Status.id == data.status_id).first()
    if not status_obj:
        raise HTTPException(status_code=400, detail="Invalid status_id")

    task = Task(
        title=data.title,
        short_description=data.short_description,
        description=data.description,
        status_id=status_obj.id,
        created_by=user.id,   # ← ВОТ ЭТОГО НЕ ХВАТАЛО
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return {"id": task.id}



@router.patch("/{task_id}/status")
def update_task_status(
    task_id: int,
    data: TaskStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    status_obj = db.query(Status).filter(Status.name == data.status).first()
    if not status_obj:
        raise HTTPException(status_code=400, detail="Invalid status")

    task.status_id = status_obj.id
    db.commit()

    return {"status": "updated"}
