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


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    status_id: Optional[int] = None
    assignee_id: Optional[int] = None
