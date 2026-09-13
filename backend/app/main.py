
# from fastapi import FastAPI  
# from .routers import user, task, auth

# from .database.db import create_db_and_tables
# from .middleware import LoggingMiddleware  # FIX: wire up the logging middleware



# app = FastAPI(title="Employee Task Manager API")

# app.add_middleware(LoggingMiddleware)  # FIX: previously no middleware was registered at all


# @app.on_event("startup")
# def on_startup():
#     create_db_and_tables()

# print("🟢🟢")
# @app.get("/")
# def greet():
#     return "Welcome To Task Manager"


# app.include_router(auth.router)
# app.include_router(user.router)
# app.include_router(task.router)



import os
from fastapi import FastAPI  # type:ignore
from fastapi.middleware.cors import CORSMiddleware  # ADDED: needed so the Vite React frontend (different origin/port) can call this API
from .routers import user, task, auth
from .database.db import create_db_and_tables
from .middleware import LoggingMiddleware  # FIX: wire up the logging middleware

# FIX: removed `from app import auth` — it was a dead import that only
# existed to be immediately shadowed by `from .routers import user, task,
# auth` on the next line, which is confusing to read for no benefit.

app = FastAPI(title="Employee Task Manager API")

app.add_middleware(LoggingMiddleware)  # FIX: previously no middleware was registered at all

# ADDED: CORS so the React (Vite) frontend, served from its own origin
# (default http://localhost:5173), is allowed to call this API and send the
# Authorization header. Configure via CORS_ORIGINS in .env for other setups.
_configured_origins = os.getenv("CORS_ORIGINS", "").split(",")
_origins = [
    origin.strip()
    for origin in (
        _configured_origins
        + ["http://localhost:5173", "http://127.0.0.1:5173"]
    )
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(_origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def greet():
    return "Welcome To Task Manager"


app.include_router(auth.router)
app.include_router(user.router)
app.include_router(task.router)
