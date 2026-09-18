from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.config.config import SESSION_TOKEN
from app.services import mouse_control
from app.services.copy_n_paste import insert_text, key_down, key_up, press_key, press_shortcut
from app.services.session_state import mark_connected
from app.services.virtual_gamepad import virtual_xbox


router = APIRouter()


def _number(value, fallback: float = 0) -> float:
    if value is None:
        return fallback

    return float(value)


def _text(value, fallback: str = "") -> str:
    if value is None:
        return fallback

    return str(value)


def handle_controller_event(event: dict):
    if not isinstance(event, dict):
        raise ValueError("Controller event must be an object.")

    event_type = _text(event.get("type"))

    if event_type == "mouse.move":
        mouse_control.move_by(
            _number(event.get("dx")),
            _number(event.get("dy")),
        )
        return

    if event_type == "mouse.scroll":
        mouse_control.scroll_by(
            _number(event.get("dx")),
            _number(event.get("dy")),
        )
        return

    if event_type == "mouse.click":
        clicks = int(_number(event.get("clicks"), 1))

        if clicks < 1 or clicks > 3:
            raise ValueError("Clicks must be between 1 and 3.")

        mouse_control.click_button(
            _text(event.get("button"), "left"),
            clicks,
        )
        return

    if event_type == "mouse.button":
        action = _text(event.get("action"), "down")
        button = _text(event.get("button"), "left")

        if action == "down":
            mouse_control.button_down(button)
            return

        if action == "up":
            mouse_control.button_up(button)
            return

        raise ValueError(f"Unsupported mouse button action: {action}")

    if event_type == "keyboard.type":
        insert_text(_text(event.get("text")), add_space=False)
        return

    if event_type == "keyboard.key":
        press_key(_text(event.get("key")))
        return

    if event_type == "keyboard.button":
        action = _text(event.get("action"), "down")
        key = _text(event.get("key"))

        if action == "down":
            key_down(key)
            return

        if action == "up":
            key_up(key)
            return

        raise ValueError(f"Unsupported keyboard button action: {action}")

    if event_type == "keyboard.shortcut":
        press_shortcut(_text(event.get("shortcut")))
        return

    if event_type == "gamepad.connect":
        virtual_xbox.connect()
        return {
            "type": "gamepad.status",
            "available": True,
            "message": "Native Xbox controller ready",
        }

    if event_type == "gamepad.button":
        action = _text(event.get("action"), "down")
        button = _text(event.get("button"))

        if action == "down":
            virtual_xbox.button(button, True)
            return

        if action == "up":
            virtual_xbox.button(button, False)
            return

        raise ValueError(f"Unsupported gamepad button action: {action}")

    if event_type == "gamepad.trigger":
        virtual_xbox.trigger(
            _text(event.get("side")),
            _number(event.get("value")),
        )
        return

    if event_type == "gamepad.stick":
        virtual_xbox.stick(
            _text(event.get("side")),
            _number(event.get("x")),
            _number(event.get("y")),
        )
        return

    if event_type == "gamepad.reset":
        virtual_xbox.reset()
        return

    raise ValueError(f"Unsupported controller event type: {event_type}")


@router.websocket("/controller/ws")
async def controller_ws(websocket: WebSocket, token: str = ""):
    if token != SESSION_TOKEN:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    mark_connected()

    try:
        virtual_xbox.connect()
        await websocket.send_json({
            "type": "gamepad.status",
            "available": True,
            "message": "Native Xbox controller ready",
        })
    except Exception as error:
        await websocket.send_json({
            "type": "error",
            "message": str(error),
        })

    try:
        while True:
            event = await websocket.receive_json()
            try:
                response = handle_controller_event(event)
                if response is not None:
                    await websocket.send_json(response)
            except Exception as error:
                await websocket.send_json({
                    "type": "error",
                    "message": str(error),
                })
    except WebSocketDisconnect:
        return
