
from pathlib import Path
import secrets


BACKEND_ROOT = Path(__file__).resolve().parents[2]
SESSION_TOKEN_PATH = BACKEND_ROOT / ".session_token"


def get_session_token() -> str:
    if SESSION_TOKEN_PATH.exists():
        return SESSION_TOKEN_PATH.read_text(encoding="utf-8").strip()

    token = secrets.token_urlsafe(32)
    SESSION_TOKEN_PATH.write_text(token, encoding="utf-8")
    return token


SESSION_TOKEN = get_session_token()
