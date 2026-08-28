import os
import tempfile

from faster_whisper import WhisperModel


model = WhisperModel("base", device="cpu", compute_type="int8")


def transcribe_audio(audio_bytes: bytes, suffix: str = ".webm"):
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp.write(audio_bytes)
        temp_path = temp.name
        
    # Store uploaded audio briefly so Whisper can read it as a normal file.
    try:
        segments, _ = model.transcribe(temp_path, beam_size=1, language="en")
        
        text = ""
        for segment in segments:
            text += segment.text
    
        return text.strip()
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

