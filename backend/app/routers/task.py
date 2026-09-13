
# app/routers/task.py
from typing import Annotated, Optional

from fastapi import APIRouter, HTTPException, Query, Depends  
from sqlmodel import select  

from ..models.model import Task, User
from ..database.dependency import SessionDep
from ..schemas.schema import TaskCreate, TaskUpdate, TaskRead, TaskStatus
from ..auth.authentication import get_current_active_user

router = APIRouter(
    prefix="/tasks",  
    tags=["Task"],
)

CurrentUser = Annotated[User, Depends(get_current_active_user)]


def _get_visible_task_or_error(session: SessionDep, task_id: int, current_user: User) -> Task:
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role == "manager":
        visible = task.creator_id == current_user.id or (
            task.creator_id is None and task.user_id == current_user.id
        )
    else:
        visible = task.user_id == current_user.id
    if not visible:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return task


# --- CREATE -------------------------------------------------------------

@router.post("/", response_model=TaskRead, status_code=201)
def create_task(task_in: TaskCreate, session: SessionDep, current_user: CurrentUser):  
    payload = task_in.dict(exclude={"assignee_id"})
    assignee_id = task_in.assignee_id
    if current_user.role != "manager" and assignee_id not in (None, current_user.id):
        raise HTTPException(status_code=403, detail="Only managers can assign tasks")
    assignee_id = assignee_id or current_user.id
    if not session.get(User, assignee_id):
        raise HTTPException(status_code=404, detail="Assigned employee not found")
    task = Task(
        **payload,
        user_id=assignee_id,
        creator_id=current_user.id,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


# --- READ -----------------------------------------------------------------

@router.get("/", response_model=list[TaskRead])
def get_tasks(
    session: SessionDep,  
    current_user: CurrentUser,
    status: Optional[TaskStatus] = Query(default=None),
):
    query = select(Task)
    if current_user.role == "manager":
        query = query.where(
            (Task.creator_id == current_user.id)
            | ((Task.creator_id.is_(None)) & (Task.user_id == current_user.id))
        )
    else:
        query = query.where(Task.user_id == current_user.id)
    if status is not None:
        query = query.where(Task.status == status)
    return session.exec(query).all()



@router.get("/{task_id}", response_model=TaskRead)
def read_task(task_id: int, session: SessionDep, current_user: CurrentUser):
    return _get_visible_task_or_error(session, task_id, current_user)


# --- UPDATE -------------------------------------------------------------

@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, task_in: TaskUpdate, session: SessionDep, current_user: CurrentUser):  # type:ignore
    existing_task = _get_visible_task_or_error(session, task_id, current_user)

    updates = task_in.dict(exclude_unset=True)
    assignee_id = updates.pop("assignee_id", None)
    if assignee_id is not None:
        if current_user.role != "manager":
            raise HTTPException(status_code=403, detail="Only managers can assign tasks")
        if not session.get(User, assignee_id):
            raise HTTPException(status_code=404, detail="Assigned employee not found")
        existing_task.user_id = assignee_id

    for key, value in updates.items():
        setattr(existing_task, key, value)

    session.add(existing_task)
    session.commit()
    session.refresh(existing_task)
    return existing_task


# --- DELETE ---------------------------------------------------------------

@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, session: SessionDep, current_user: CurrentUser):  # type:ignore
    task = _get_visible_task_or_error(session, task_id, current_user)
    session.delete(task)
    session.commit()
    return None
