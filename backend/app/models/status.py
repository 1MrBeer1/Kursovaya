from sqlalchemy import Column, Integer, String

from app.db.base import Base


class Status(Base):
    __tablename__ = "statuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    order_index = Column(Integer, nullable=False)
