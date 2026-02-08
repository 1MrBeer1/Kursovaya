from pydantic import BaseModel
from datetime import datetime


class MessageCreate(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: int
    user: str
    content: str
    created_at: datetime
