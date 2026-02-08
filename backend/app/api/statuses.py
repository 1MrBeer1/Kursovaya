from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.status import Status

router = APIRouter(prefix="/statuses", tags=["statuses"])


@router.get("/")
def get_statuses(db: Session = Depends(get_db)):
    return db.query(Status).order_by(Status.order_index).all()
