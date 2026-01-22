from contextlib import asynccontextmanager
from fastapi import FastAPI

from .database import Base, engine
from . import models  # 确保导入模型，以便Base.metadata知道它们
from .routers import sessions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时：创建数据库表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # 关闭时：可以在这里添加清理逻辑


app = FastAPI(lifespan=lifespan)

app.include_router(sessions.router)


@app.get("/hello")
async def read_root():
    return {"message": "Hello from FastAPI backend!"}
