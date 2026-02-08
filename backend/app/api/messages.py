from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.message import Message
from app.models.task import Task
from app.models.user import User
from app.schemas.message import MessageCreate

router = APIRouter(prefix="/tasks/{task_id}/messages", tags=["messages"])


@router.get("/")
def get_messages(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    messages = (
        db.query(Message)
        .filter(Message.task_id == task_id)
        .order_by(Message.created_at)
        .all()
    )

    return [
        {
            "id": m.id,
            "user": db.query(User).get(m.user_id).username,
            "content": m.content,
            "created_at": m.created_at,
        }
        for m in messages
    ]


@router.post("/", status_code=201)
def create_message(
    task_id: int,
    data: MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    message = Message(
        content=data.content,
        task_id=task_id,
        user_id=user.id,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return {"id": message.id}
