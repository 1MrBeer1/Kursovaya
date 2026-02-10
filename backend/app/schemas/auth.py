from typing import Optional
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = Field(default="employee", description="Role for new user (admin/ceo/manager/employee)")


class PasswordChange(BaseModel):
    new_password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = Field(default=None, description="Role for user (admin/ceo/manager/employee)")
    password: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
