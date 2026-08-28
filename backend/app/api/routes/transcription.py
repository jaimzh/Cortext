from pathlib import Path


from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.transcription import TranscriptionResponse
from app.services.copy_n_paste import insert_text
from app.services.transcription import transcribe_audio

router = APIRouter()


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    file: UploadFile = File(...),
    paste: bool = Form(True),
):
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
