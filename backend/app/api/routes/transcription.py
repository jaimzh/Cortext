from pathlib import Path


from fastapi import APIRouter, File, UploadFile

from app.services.transcription import transcribe_audio
from app.schemas.transcription import TranscriptionResponse
from app.services.copy_n_paste import insert_text

router = APIRouter()


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix or ".webm"
    audio_bytes = await file.read()
    text = transcribe_audio(audio_bytes, suffix)
    insert_text(text)
    
    return {
    "message": "Audio transcribed",
    "text": text,
}