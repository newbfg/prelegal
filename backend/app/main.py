from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .config import STATIC_DIR
from .db import init_db
from .routers import auth, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Prelegal API", lifespan=lifespan)

app.include_router(health.router)
app.include_router(auth.router)

# Mounted last and at "/" so it only catches requests the API routers above
# didn't claim. Guarded by is_dir() so `uv run` works before a frontend build exists.
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
