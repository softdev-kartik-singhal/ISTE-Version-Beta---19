"""FastAPI entry point. Run: uvicorn app.main:app --reload"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import connect, init_db
from app.routers import ask, goals, insights, overview, statements, transactions, trust


@asynccontextmanager
async def lifespan(app):
    with connect() as conn:
        init_db(conn)  # create tables on first start
    yield


app = FastAPI(title="SmartGullak API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],  # Vite dev server
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(statements.router)
app.include_router(transactions.router)
app.include_router(insights.router)
app.include_router(ask.router)
app.include_router(overview.router)
app.include_router(goals.router)
app.include_router(trust.router)
