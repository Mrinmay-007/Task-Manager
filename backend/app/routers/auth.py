
# app/routers/auth.py

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status  
from fastapi.security import OAuth2PasswordRequestForm  
from sqlmodel import select  

from ..database.dependency import SessionDep
from ..models.model import User
from ..auth.authentication import (
    authenticate_user,
    create_access_token,
    hash_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from ..schemas.schema import Token, UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["Auth"])


# --- Register -----------------------------------------------------------

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, session: SessionDep):  # type: ignore
    email = user_in.email.strip().lower()
    existing = session.exec(select(User).where(User.email == email)).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(
        name=user_in.name,
        email=email,  #  normalize email to lowercase
        password=hash_password(user_in.password),  #  hash before storing
        # role="user",
        role=user_in.role.lower(),

    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


# --- Login ----------------------------------------------------------------

@router.post("/login", response_model=Token)
def login(
    session: SessionDep,  
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = authenticate_user(session, form_data.username.strip().lower(), form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},  #  embed role in the token payload
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token, token_type="bearer")


# Kept as an alias so FastAPI's interactive docs (which POST to the
# `tokenUrl` configured on OAuth2PasswordBearer) and any OAuth2-conformant
# client both work, without duplicating logic.
@router.post("/token", response_model=Token, include_in_schema=False)
def login_alias(
    session: SessionDep,  
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    return login(session, form_data)
