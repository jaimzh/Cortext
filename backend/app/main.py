from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes.controller import router as controller_router
from app.api.routes.keyboard import router as keyboard_router
from app.api.routes.models import router as models_router
from app.api.routes.mouse import router as mouse_router
from app.api.routes.qr import router as qr_router
from app.api.routes.session import router as session_router
from app.api.routes.transcription import router as transcription_router
from app.config.config import SESSION_TOKEN
from app.services.session_state import mark_connected


WEB_ROOT = Path(__file__).resolve().parents[2] / "web" / "dist"
WEB_INDEX = WEB_ROOT / "index.html"

app = FastAPI(
    title="Cortext Backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcription_router)
app.include_router(qr_router)
app.include_router(session_router)
app.include_router(models_router)
app.include_router(controller_router)
app.include_router(keyboard_router)
app.include_router(mouse_router)

app.mount(
    "/app/assets",
    StaticFiles(directory=WEB_ROOT / "assets", check_dir=False),
    name="web-assets",
)

@app.get("/")
def root():
    return {
        "message": "Cortext backend is running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }


@app.get("/app")
@app.get("/app/")
def web_app(token: str = ""):
    if not WEB_INDEX.is_file():
        raise HTTPException(
            status_code=503,
            detail="Frontend build missing. Run npm install and npm run build in web/.",
        )
    if token == SESSION_TOKEN:
        mark_connected()

    return FileResponse(WEB_INDEX)
