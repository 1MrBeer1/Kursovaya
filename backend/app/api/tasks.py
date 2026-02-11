from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.task import Task
from app.models.status import Status
from app.schemas.task import TaskCreate, TaskStatusUpdate, TaskUpdate
from app.models.user import User

ROLE_RANK = {
    "employee": 0,
    "manager": 1,
    "ceo": 2,
    "admin": 3,
}


def _can_view_task(current_user: User, task: Task, db: Session) -> bool:
    # задачи без исполнителя видят все
    if task.assignee_id is None:
        return True

    # creator or assignee always can view
    if task.assignee_id == current_user.id or task.created_by == current_user.id:
        return True

    assignee = db.query(User).get(task.assignee_id) if task.assignee_id else None
    assignee_rank = ROLE_RANK.get(assignee.role, -1) if assignee else -1
    user_rank = ROLE_RANK.get(current_user.role, -1)

    # higher or equal level can view lower-level tasks
    return user_rank >= assignee_rank and assignee_rank != -1

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/")
def get_tasks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tasks = db.query(Task).all()

    result = []
    for t in tasks:
        if not _can_view_task(user, t, db):
            continue

        status_name = db.query(Status).get(t.status_id).name
        assignee = db.query(User).get(t.assignee_id) if t.assignee_id else None
        creator = db.query(User).get(t.created_by) if t.created_by else None

        is_mine = t.assignee_id == user.id or t.assignee_id is None
        assignee_rank = ROLE_RANK.get(assignee.role, -1) if assignee else -1
        user_rank = ROLE_RANK.get(user.role, -1)
        is_lower = assignee is not None and user_rank > assignee_rank and not is_mine

        result.append({
            "id": t.id,
            "title": t.title,
            "short_description": t.short_description,
            "status": status_name,
            "assignee": assignee.username if assignee else None,
            "assignee_id": assignee.id if assignee else None,
            "assignee_role": assignee.role if assignee else None,
            "created_by": creator.username if creator else None,
            "is_mine": is_mine,
            "is_lower": is_lower,
        })

    return result

@router.get("/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not _can_view_task(user, task, db):
        raise HTTPException(status_code=403, detail="Access denied")

    status_obj = db.query(Status).filter(Status.id == task.status_id).first()
    if not status_obj:
        raise HTTPException(status_code=500, detail="Task has invalid status_id")

    assignee = db.query(User).get(task.assignee_id) if task.assignee_id else None
    creator = db.query(User).get(task.created_by) if task.created_by else None

    return {
        "id": task.id,
        "title": task.title,
        "short_description": task.short_description,
        "description": task.description,
        "status": status_obj.name,
        "assignee": assignee.username if assignee else None,
        "assignee_id": assignee.id if assignee else None,
        "assignee_role": assignee.role if assignee else None,
        "created_by": creator.username if creator else None,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }

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

    assignee_id = None
    if data.assignee_id is not None:
        assignee = db.query(User).filter(User.id == data.assignee_id).first()
        if not assignee:
            raise HTTPException(status_code=400, detail="Invalid assignee_id")
        assignee_id = assignee.id

    task = Task(
        title=data.title,
        short_description=data.short_description,
        description=data.description,
        status_id=status_obj.id,
        created_by=user.id,   # ← ВОТ ЭТОГО НЕ ХВАТАЛО
        assignee_id=assignee_id,
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

    if not _can_view_task(user, task, db):
        raise HTTPException(status_code=403, detail="Access denied")

    status_obj = db.query(Status).filter(Status.name == data.status).first()
    if not status_obj:
        raise HTTPException(status_code=400, detail="Invalid status")

    task.status_id = status_obj.id
    db.commit()

    return {"status": "updated"}


@router.patch("/{task_id}")
def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in ("manager", "ceo", "admin"):
        raise HTTPException(status_code=403, detail="Access denied")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Проверка видимости для менеджеров/ниже
    if not _can_view_task(user, task, db):
        raise HTTPException(status_code=403, detail="Access denied")

    if data.status_id is not None:
        status_obj = db.query(Status).filter(Status.id == data.status_id).first()
        if not status_obj:
            raise HTTPException(status_code=400, detail="Invalid status_id")
        task.status_id = status_obj.id

    if data.assignee_id is not None:
        if data.assignee_id == 0:
            task.assignee_id = None
        else:
            assignee = db.query(User).filter(User.id == data.assignee_id).first()
            if not assignee:
                raise HTTPException(status_code=400, detail="Invalid assignee_id")
            task.assignee_id = assignee.id

    if data.title is not None:
        task.title = data.title
    if data.short_description is not None:
        task.short_description = data.short_description
    if data.description is not None:
        task.description = data.description

    db.commit()
    return {"status": "updated"}
