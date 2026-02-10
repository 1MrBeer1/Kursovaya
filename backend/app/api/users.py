from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    show_sensitive = user.role in ("admin", "ceo")

    users = db.query(User).order_by(User.username).all()
    result = []
    for u in users:
        item = {
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "created_at": u.created_at,
        }
        if show_sensitive:
            item["password"] = u.password_plain
        result.append(item)
    return result


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "created_at": user.created_at,
    }
