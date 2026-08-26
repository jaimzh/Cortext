from fastapi import APIRouter, File, UploadFile

from app.services.transcription import transcribe_audio

router = APIRouter()


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    text = transcribe_audio(audio_bytes)
    
    return {
    "message": "Audio transcribed",
    "text": text,
}