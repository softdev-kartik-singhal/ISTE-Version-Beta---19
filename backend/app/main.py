"""FastAPI entry point. Run: uvicorn app.main:app --reload"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db import connect, init_db
from app.services.auth import AuthError
from app.services.card import CardError
from app.routers import account, ask, card, cash, goals, insights, overview, statements, suggestions, transactions, trust


@asynccontextmanager
async def lifespan(app):
    with connect() as conn:
        init_db(conn)  # create tables on first start
    yield


app = FastAPI(title="SmartGullak API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],  # Vite dev server
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(account.router)
app.include_router(card.router)
app.include_router(cash.router)
app.include_router(statements.router)
app.include_router(transactions.router)
app.include_router(insights.router)
app.include_router(ask.router)
app.include_router(overview.router)
app.include_router(goals.router)
app.include_router(suggestions.router)
app.include_router(trust.router)


@app.exception_handler(AuthError)
def auth_error(_, e: AuthError):
    return JSONResponse({"detail": {"reason": e.reason}}, status_code=e.status)


@app.exception_handler(CardError)
def card_error(_, e: CardError):
    return JSONResponse({"detail": {"reason": e.reason, "code": e.code}}, status_code=e.status)
