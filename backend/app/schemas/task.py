from typing import Optional
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    short_description: str
    description: str
    status_id: int
    assignee_id: Optional[int] = None



class TaskShort(BaseModel):
    id: int
    title: str
    short_description: str
    status: str


class TaskStatusUpdate(BaseModel):
    status: str
