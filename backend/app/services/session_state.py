session_state = {
    "connected": False,
    "status": "waiting",
    "last_transcription": "",
    "last_error": "",
}


def mark_connected() -> None:
    session_state["connected"] = True
    session_state["status"] = "connected"


def mark_transcribing() -> None:
    session_state["status"] = "transcribing"


def mark_transcribed(text: str) -> None:
    session_state["status"] = "ready"
    session_state["last_transcription"] = text
    session_state["last_error"] = ""


def mark_error(message: str) -> None:
    session_state["status"] = "error"
    session_state["last_error"] = message


def get_session_state() -> dict:
    return session_state.copy()
