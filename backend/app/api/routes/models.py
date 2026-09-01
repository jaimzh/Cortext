from fastapi import APIRouter, HTTPException, Query

from app.config.config import SESSION_TOKEN
from app.services.transcription import ALLOWED_MODEL_NAMES, download_model, get_model_status


router = APIRouter()


@router.get("/models")
def list_models(token: str = Query(...)):
    if token != SESSION_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    return get_model_status()


@router.post("/models/download")
def download_transcription_model(model: str = Query(...), token: str = Query(...)):
    if token != SESSION_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    if model not in ALLOWED_MODEL_NAMES:
        raise HTTPException(status_code=400, detail="Unsupported transcription model.")

    download_model(model)

    return {
        "message": "Model ready",
        "model": model,
    }
