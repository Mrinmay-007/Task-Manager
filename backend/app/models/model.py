# app/models/model.py

from datetime import datetime, timezone
from typing import List, Optional
from sqlmodel import Field, Relationship  
from ..schemas.schema import TaskStatus, UserBase, TaskBase


class User(UserBase, table=True):  
    __tablename__ = "users"  

    id: Optional[int] = Field(default=None, primary_key=True)
    password: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    tasks: List["Task"] = Relationship(
        back_populates="owner",
        cascade_delete=True,
        sa_relationship_kwargs={"foreign_keys": "Task.user_id"},
    )


class Task(TaskBase, table=True):  
    __tablename__ = "tasks"  

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False, ondelete="CASCADE")
    creator_id: Optional[int] = Field(default=None, foreign_key="users.id", ondelete="SET NULL")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    owner: Optional[User] = Relationship(
        back_populates="tasks",
        sa_relationship_kwargs={"foreign_keys": "Task.user_id"},
    )
