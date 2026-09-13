
# app/database/db.py

import os
from dotenv import load_dotenv 
from sqlmodel import SQLModel, create_engine  
from sqlalchemy import inspect, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
     # create_all does not add columns to an existing deployment.
    columns = inspect(engine).get_columns("tasks")
    if not any(column["name"] == "creator_id" for column in columns):
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE tasks ADD COLUMN creator_id INTEGER"))

    if not any(column["name"] == "completion_requested" for column in columns):
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE tasks ADD COLUMN completion_requested BOOLEAN NOT NULL DEFAULT 0")
            )