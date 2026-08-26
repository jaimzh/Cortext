from fastapi import FastAPI
from app.api.routes.transcription import router as transcription_router




app = FastAPI(
    title="Cortext Backend",
    version="0.1.0",
)

app.include_router(transcription_router)

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
