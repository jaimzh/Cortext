from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.api.routes.qr import router as qr_router
from app.api.routes.transcription import router as transcription_router


WEB_INDEX = Path(__file__).resolve().parents[2] / "web" / "index.html"

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
def web_app():
    return FileResponse(WEB_INDEX)
