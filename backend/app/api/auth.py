from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import UserCreate, Token
from app.core.security import hash_password, verify_password, create_access_token

ALLOWED_ROLES = {"admin", "ceo", "manager", "employee"}

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("admin", "ceo"):
        raise HTTPException(status_code=403, detail="Only admin/ceo can register users")

    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    role = (data.role or "employee").lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        password_plain=data.password,
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "role": user.role
    }


@router.post("/login", response_model=Token)
def login(data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token({
        "sub": user.username,
        "role": user.role
    })

    return {"access_token": token}
