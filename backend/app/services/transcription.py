import os
import tempfile

from faster_whisper import WhisperModel


DEFAULT_MODEL_NAME = "base"
ALLOWED_MODEL_NAMES = {"tiny", "base", "small", "medium"}
models = {}


def get_model(model_name: str) -> WhisperModel:
    if model_name not in ALLOWED_MODEL_NAMES:
        model_name = DEFAULT_MODEL_NAME

    if model_name not in models:
        models[model_name] = WhisperModel(model_name, device="cpu", compute_type="int8")

    return models[model_name]


def transcribe_audio(
    audio_bytes: bytes,
    suffix: str = ".webm",
    model_name: str = DEFAULT_MODEL_NAME,
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp.write(audio_bytes)
        temp_path = temp.name
        
    # Store uploaded audio briefly so Whisper can read it as a normal file.
    try:
        model = get_model(model_name)
        segments, _ = model.transcribe(temp_path, beam_size=1, language="en")
        
        text = ""
        for segment in segments:
            text += segment.text
    
        return text.strip()
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

