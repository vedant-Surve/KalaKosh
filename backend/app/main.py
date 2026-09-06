import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine, SessionLocal
from .config import settings
from .routers import auth, public, admin, chat
from .seed import seed

# Create tables if they don't exist yet
Base.metadata.create_all(bind=engine)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="KalaKosh API",
    description="Cultural heritage preservation platform — Warli Art and beyond.",
    version="2.0.0",
)

@app.on_event("startup")
def on_startup():
    # Automatically ensure admin account and seed data exist
    try:
        seed()
    except Exception as e:
        print("Startup seed notice:", e)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://kalakosh-2.onrender.com",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.onrender\.com|.*\.vercel\.app|.*\.netlify\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded audio narration files
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

app.include_router(auth.router)
app.include_router(public.router)
app.include_router(admin.router)
app.include_router(chat.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "KalaKosh API", "version": "2.0.0"}

