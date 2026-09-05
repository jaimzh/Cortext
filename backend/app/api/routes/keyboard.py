from fastapi import APIRouter, Form, HTTPException

from app.config.config import SESSION_TOKEN
from app.services.copy_n_paste import insert_text, press_key, press_shortcut


router = APIRouter()


@router.post("/keyboard/type")
def type_text(
    text: str = Form(...),
    token: str = Form(...),
):
    if token != SESSION_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text received.")

    try:
        insert_text(text, add_space=False)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Text could not be inserted.",
        ) from error

    return {
        "message": "Text inserted",
    }


@router.post("/keyboard/key")
def press_keyboard_key(
    key: str = Form(...),
    token: str = Form(...),
):
    if token != SESSION_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    try:
        press_key(key)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail="Unsupported keyboard key.",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Key could not be pressed.",
        ) from error

    return {
        "message": "Key pressed",
        "key": key,
    }


@router.post("/keyboard/shortcut")
def press_keyboard_shortcut(
    shortcut: str = Form(...),
    token: str = Form(...),
):
    if token != SESSION_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    try:
        press_shortcut(shortcut)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail="Unsupported keyboard shortcut.",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Shortcut could not be pressed.",
        ) from error

    return {
        "message": "Shortcut pressed",
        "shortcut": shortcut,
    }
