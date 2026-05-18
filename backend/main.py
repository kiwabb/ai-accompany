from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, AsyncSessionLocal
from . import models  # 确保导入模型，以便Base.metadata知道它们
from . import crud
from .routers import sessions, users, topics, diagnostics, countdowns, documents, achievements, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时：创建数据库表 + 成就目录首次种子
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        await crud.seed_achievements_if_empty(session)
    yield
    # 关闭时：可以在这里添加清理逻辑


app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(auth.router, prefix="/api/auth")
app.include_router(users.router)
app.include_router(topics.router, prefix="/api/topics", tags=["topics"])
app.include_router(countdowns.router)
app.include_router(diagnostics.router)
app.include_router(documents.router)
app.include_router(achievements.router)


@app.get("/")
async def read_root():
    return {"message": "Hello from AI Accompany Backend. Visit http://localhost:5173 for the frontend."}


@app.get("/hello")
async def read_hello():
    return {"message": "Hello from FastAPI backend!"}
