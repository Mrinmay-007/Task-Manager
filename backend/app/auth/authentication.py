# app/auth/authentication.py

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated

from dotenv import load_dotenv  
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from jwt.exceptions import InvalidTokenError
import jwt

from pwdlib import PasswordHash

from ..models.model import User
from ..database.dependency import SessionDep
from sqlmodel import select

load_dotenv()

# --- Config -----------------------------------------------------------

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not set. Add it to your .env file (see .env.example)."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

password_hash = PasswordHash.recommended()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# --- Password hashing ---------------------------------------------------
def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


# --- Authentication -------------------------------------------------------
def authenticate_user(session: SessionDep, username: str, password: str) -> Optional[User]:
    """Look up a user by email and verify their password.

    NOTE: `session` must be a real SQLModel Session instance obtained via
    FastAPI dependency injection in the calling route — see the FIX note in
    routers/auth.py about the old code passing the *type* `SessionDep`
    instead of an actual session.
    """
    user = session.exec(select(User).where(User.email == username)).first()
    if not user or not verify_password(password, user.password):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# --- Dependencies -----------------------------------------------------------
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: SessionDep,  
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    user = session.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_role(*allowed_roles: str):


    def role_checker(
        current_user: Annotated[User, Depends(get_current_active_user)],
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return current_user

    return role_checker


# Convenience dependency for "manager-only" endpoints.
require_manager = require_role("manager")
