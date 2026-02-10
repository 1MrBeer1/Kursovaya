from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    password_plain = Column(String, nullable=True)
    role = Column(String, nullable=False, default="employee")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
