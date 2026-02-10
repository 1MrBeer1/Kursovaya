from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import PasswordChange, UserUpdate
from app.core.security import hash_password

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
            # показываем то, что есть: сначала plaintext (если сохранён), иначе hash
            item["password"] = u.password_plain or u.password_hash or ""
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


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role not in ("admin", "ceo"):
        raise HTTPException(status_code=403, detail="Only admin/ceo can change users")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.username:
        if db.query(User).filter(User.username == data.username, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="Username already exists")
        user.username = data.username

    if data.role:
        role = data.role.lower()
        if role not in ("admin", "ceo", "manager", "employee"):
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = role

    if data.password:
        user.password_hash = hash_password(data.password)
        user.password_plain = data.password

    db.commit()
    return {"status": "ok"}
