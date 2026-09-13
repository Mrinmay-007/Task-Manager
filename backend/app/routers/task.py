
# app/routers/task.py
from typing import Annotated, Optional

from fastapi import APIRouter, HTTPException, Query, Depends  
from sqlmodel import select  

from ..models.model import Task, User
from ..database.dependency import SessionDep
from ..schemas.schema import TaskCreate, TaskUpdate, TaskRead, TaskStatus
from ..auth.authentication import get_current_active_user, require_manager

router = APIRouter(
    prefix="/tasks",  
    tags=["Task"],
)

CurrentUser = Annotated[User, Depends(get_current_active_user)]


def _get_visible_task_or_error(session: SessionDep, task_id: int, current_user: User) -> Task:

    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    # if task.user_id != current_user.id and current_user.role != "manager":
    if current_user.role == "manager":
        visible = task.creator_id == current_user.id or (
            task.creator_id is None and task.user_id == current_user.id
        )
    else:
        visible = task.user_id == current_user.id
    if not visible:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return task

def _is_personal_task(task: Task) -> bool:
    return task.creator_id == task.user_id
# --- CREATE -------------------------------------------------------------
# CHANGED: task creation is now manager-only. Employees can no longer create
# their own tasks — every task in the system is created and assigned by a
# manager (to themselves or to an employee); employees only move a task
# through Start -> Finish, they never originate one.
@router.post("/", response_model=TaskRead, status_code=201)
def create_task(
    task_in: TaskCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(require_manager)],
):
    payload = task_in.dict(exclude={"assignee_id", "completion_requested"})

    # current_user is guaranteed to be a manager here (require_manager), so
    # this just resolves who the task is for: themselves if no assignee_id
    # was given, or the specified employee otherwise.
    assignee_id = task_in.assignee_id or current_user.id
    if not session.get(User, assignee_id):
        raise HTTPException(status_code=404, detail="Assigned employee not found")
    task = Task(
        **payload,
        user_id=assignee_id,
        creator_id=current_user.id,
        completion_requested=False,
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
    # if current_user.role != "manager":
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
    # return _get_owned_task_or_error(session, task_id, current_user)
    return _get_visible_task_or_error(session, task_id, current_user)



# --- UPDATE -------------------------------------------------------------

@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, task_in: TaskUpdate, session: SessionDep, current_user: CurrentUser):  # type:ignore
    # existing_task = _get_owned_task_or_error(session, task_id, current_user)
    existing_task = _get_visible_task_or_error(session, task_id, current_user)

    updates = task_in.dict(exclude_unset=True)
    assignee_id = updates.pop("assignee_id", None)
    requested_completion = updates.pop("completion_requested", None)
    is_personal = _is_personal_task(existing_task)

    if current_user.role != "manager" and not is_personal:
        allowed_updates = set(updates)
        if assignee_id is not None or requested_completion is not None or allowed_updates - {"status"}:
            raise HTTPException(
                status_code=403,
                detail="Assigned tasks can only be moved to in progress or submitted for completion",
            )
        if updates.get("status") == TaskStatus.completed:
            raise HTTPException(
                status_code=403,
                detail="Request completion from your manager instead",
            )
        if updates.get("status") not in (None, TaskStatus.in_progress):
            raise HTTPException(
                status_code=403,
                detail="Assigned tasks can only be moved to in progress",
            )

    if current_user.role == "manager" and not is_personal and updates.get("status") == TaskStatus.completed:
        if not existing_task.completion_requested:
            raise HTTPException(status_code=400, detail="The employee must request completion first")
        existing_task.completion_requested = False
    
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


@router.post("/{task_id}/request-completion", response_model=TaskRead)
def request_completion(task_id: int, session: SessionDep, current_user: CurrentUser):
    task = _get_visible_task_or_error(session, task_id, current_user)
    if current_user.role == "manager" or _is_personal_task(task):
        raise HTTPException(status_code=400, detail="Personal tasks do not need manager approval")
    if task.status != TaskStatus.in_progress:
        raise HTTPException(status_code=400, detail="Only in-progress tasks can be submitted for completion")
    task.completion_requested = True
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

# --- DELETE ---------------------------------------------------------------

@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, session: SessionDep, current_user: CurrentUser):  # type:ignore
    task = _get_visible_task_or_error(session, task_id, current_user)

    # ADDED: now that only managers can create tasks, an employee should
    # never be able to delete a task their manager assigned — only the
    # manager (or the task's creator) can. This closes a gap that existed
    # even before today's change: delete_task had no is_personal check at
    # all, so an employee could delete an assigned task via the API even
    # though the UI hid the button.
    if current_user.role != "manager" and not _is_personal_task(task):
        raise HTTPException(status_code=403, detail="Only a manager can delete an assigned task")

    session.delete(task)
    session.commit()
    return None
