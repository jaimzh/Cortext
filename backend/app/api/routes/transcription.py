from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.services.transcription import transcribe_audio
from app.schemas.transcription import TranscriptionResponse

router = APIRouter()


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix or ".webm"
    audio_bytes = await file.read()
    text = transcribe_audio(audio_bytes, suffix)
    
    return {
    "message": "Audio transcribed",
    "text": text,
}