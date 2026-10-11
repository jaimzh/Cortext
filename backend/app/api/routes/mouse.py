from fastapi import APIRouter, Form, HTTPException

from app.config.config import SESSION_TOKEN
from app.services import mouse_control


router = APIRouter()


@router.post("/mouse/zoom")
def mouse_zoom(steps: int = Form(...), token: str = Form(...), method: str = Form('wheel')):
    _require_token(token)
    try:
        mouse_control.zoom_by(steps, method)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Zoom could not be sent.") from error
    return {"message": "Zoomed"}


def _require_token(token: str):
    if token != SESSION_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid session token.")


@router.post("/mouse/move")
def mouse_move(
    dx: float = Form(...),
    dy: float = Form(...),
    token: str = Form(...),
):
    _require_token(token)

    try:
        mouse_control.move_by(dx, dy)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Cursor could not be moved.",
        ) from error

    return {
        "message": "Cursor moved",
    }


@router.post("/mouse/click")
def mouse_click(
    token: str = Form(...),
    button: str = Form("left"),
    clicks: int = Form(1),
):
    _require_token(token)

    if clicks < 1 or clicks > 3:
        raise HTTPException(status_code=400, detail="Clicks must be between 1 and 3.")

    try:
        mouse_control.click_button(button, clicks)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail="Unsupported mouse button.",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Click could not be sent.",
        ) from error

    return {
        "message": "Clicked",
        "button": button,
        "clicks": clicks,
    }


@router.post("/mouse/button")
def mouse_button(
    token: str = Form(...),
    action: str = Form("down"),
    button: str = Form("left"),
):
    _require_token(token)

    try:
        if action == "down":
            mouse_control.button_down(button)
        elif action == "up":
            mouse_control.button_up(button)
        else:
            raise ValueError(f"Unsupported action: {action}")
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail="Unsupported mouse action or button.",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Mouse button state could not be changed.",
        ) from error

    return {
        "message": "Mouse button changed",
        "button": button,
        "state": action,
    }


@router.post("/mouse/scroll")
def mouse_scroll(
    dx: float = Form(...),
    dy: float = Form(...),
    token: str = Form(...),
):
    _require_token(token)

    try:
        mouse_control.scroll_by(dx, dy)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Scroll could not be sent.",
        ) from error

    return {
        "message": "Scrolled",
    }
