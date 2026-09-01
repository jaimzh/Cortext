from fastapi import APIRouter, HTTPException, Query

from app.config.config import SESSION_TOKEN
from app.services.session_state import get_session_state


router = APIRouter()


@router.get("/session/status")
def session_status(token: str = Query(...)):
    if token != SESSION_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    return get_session_state()
