
# app/routers/user.py
from typing import Annotated

from fastapi import APIRouter, HTTPException, Depends  
from sqlmodel import select  

from ..models.model import User
from ..database.dependency import SessionDep
from ..schemas.schema import UserRead, UserUpdate
from ..auth.authentication import get_current_active_user, require_manager

router = APIRouter(prefix="/user", tags=["Users"])


# --- READ -------------------------------------------------------------
@router.get("/me", response_model=UserRead)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    return current_user


@router.get("/", response_model=list[UserRead], dependencies=[Depends(require_manager)])
def read_users(session: SessionDep):  
    users = session.exec(select(User)).all()
    return users


@router.get("/{user_id}", response_model=UserRead, dependencies=[Depends(require_manager)])
def read_user(user_id: int, session: SessionDep):  # type:ignore
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# --- UPDATE -------------------------------------------------------------

@router.patch("/me", response_model=UserRead)
def update_my_profile(
    user_in: UserUpdate,
    session: SessionDep,  
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    for key, value in user_in.dict(exclude_unset=True).items():
        setattr(current_user, key, value)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.patch("/{user_id}", response_model=UserRead, dependencies=[Depends(require_manager)])
def update_user(user_id: int, user_in: UserUpdate, session: SessionDep):  
    existing_user = session.get(User, user_id)
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in user_in.dict(exclude_unset=True).items():
        setattr(existing_user, key, value)

    session.add(existing_user)
    session.commit()
    session.refresh(existing_user)
    return existing_user


# --- DELETE ---------------------------------------------------------------

@router.delete("/{user_id}", dependencies=[Depends(require_manager)])
def delete_user(user_id: int, session: SessionDep): 
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"ok": True}
