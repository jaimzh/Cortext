from pathlib import Path


from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.transcription import TranscriptionResponse
from app.services.copy_n_paste import insert_text
from app.services.transcription import transcribe_audio
from app.config.config import SESSION_TOKEN


router = APIRouter()


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    file: UploadFile = File(...),
    paste: bool = Form(True),
    token: str = Form(...),
):
    
    if token != SESSION_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid session token.")


    suffix = Path(file.filename or "").suffix or ".webm"
    audio_bytes = await file.read()

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio file received.")

    try:
        text = transcribe_audio(audio_bytes, suffix)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Audio transcription failed.",
        ) from exc

    if paste:
        try:
            insert_text(text)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail="Text was transcribed, but paste failed.",
            ) from exc
    
    return {
        "message": "Audio transcribed",
        "text": text,
    }
