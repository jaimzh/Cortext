import os
import tempfile

from faster_whisper import WhisperModel
from huggingface_hub import scan_cache_dir


DEFAULT_MODEL_NAME = "base"
MODEL_OPTIONS = [
    {"name": "tiny", "label": "Tiny", "description": "fastest"},
    {"name": "base", "label": "Base", "description": "balanced"},
    {"name": "small", "label": "Small", "description": "more accurate"},
    {"name": "medium", "label": "Medium", "description": "slowest"},
]
ALLOWED_MODEL_NAMES = {model["name"] for model in MODEL_OPTIONS}
MODEL_REPOS = {
    model_name: f"Systran/faster-whisper-{model_name}"
    for model_name in ALLOWED_MODEL_NAMES
}
models = {}


def get_model(model_name: str) -> WhisperModel:
    if model_name not in ALLOWED_MODEL_NAMES:
        raise ValueError(f"Unsupported model: {model_name}")

    if model_name not in models:
        models[model_name] = WhisperModel(model_name, device="cpu", compute_type="int8")

    return models[model_name]


def download_model(model_name: str) -> None:
    get_model(model_name)


def get_installed_model_names() -> set[str]:
    installed = set(models)

    try:
        cache_info = scan_cache_dir()
    except Exception:
        return installed

    cached_repo_ids = {repo.repo_id for repo in cache_info.repos}

    for model_name, repo_id in MODEL_REPOS.items():
        if repo_id in cached_repo_ids:
            installed.add(model_name)

    return installed


def get_model_status() -> dict:
    installed = get_installed_model_names()

    return {
        "default": DEFAULT_MODEL_NAME,
        "models": [
            {
                **model,
                "installed": model["name"] in installed,
            }
            for model in MODEL_OPTIONS
        ],
    }


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

