from typing import Optional
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = Field(default="employee", description="Role for new user (admin/ceo/manager/employee)")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
