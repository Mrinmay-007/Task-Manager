
# app/schemas/schema.py
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel  
import datetime


class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class UserBase(SQLModel):
    name: str = Field(max_length=100)
    email: str = Field(unique=True, index=True, max_length=255)
    role: str = Field(default="user", max_length=50)
    disabled: bool = Field(default=False)


class TaskBase(SQLModel):
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: TaskStatus = Field(default=TaskStatus.pending)
    completion_requested: bool = Field(default=False)



class Token(SQLModel):
    access_token: str
    token_type: str


class TokenData(SQLModel):
    email: Optional[str] = None
    role: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(max_length=255)


class UserRead(UserBase):

    id: int
    created_at: datetime.datetime


class UserUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None


# ADDED: a separate, manager-only schema for changing someone's role.
# `role` is deliberately NOT on UserUpdate above — that endpoint (and
# /auth/register) must never let a client hand the server a role. This is
# the one legitimate, tightly-scoped path to promote/demote an account, and
# it's only ever reachable behind the require_manager dependency.
class UserRoleUpdate(SQLModel):
    role: str  # "user" or "manager"


# --- Task I/O schemas -------------------------------------------------


class TaskCreate(TaskBase):
    assignee_id: Optional[int] = None



class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    assignee_id: Optional[int] = None



class TaskRead(TaskBase):
    id: int
    user_id: int
    creator_id: Optional[int] = None
    created_at: datetime.datetime
