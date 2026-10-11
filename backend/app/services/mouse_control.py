import math

import pyautogui


pyautogui.PAUSE = 0
pyautogui.MINIMUM_DURATION = 0
pyautogui.FAILSAFE = False

BUTTONS = {
    "left": "left",
    "right": "right",
    "middle": "middle",
}


def _normalize_button(button: str) -> str:
    normalized = BUTTONS.get(button)

    if normalized is None:
        raise ValueError(f"Unsupported mouse button: {button}")

    return normalized


def move_by(dx: float, dy: float):
    pyautogui.moveRel(dx, dy, duration=0)


def click_button(button: str = "left", clicks: int = 1):
    pyautogui.click(button=_normalize_button(button), clicks=clicks)


def button_down(button: str = "left"):
    pyautogui.mouseDown(button=_normalize_button(button))


def button_up(button: str = "left"):
    pyautogui.mouseUp(button=_normalize_button(button))


def scroll_by(dx: float, dy: float):
    if dy:
        pyautogui.scroll(int(round(dy)))

    if dx:
        pyautogui.hscroll(int(round(dx)))


def zoom_by(steps, method='wheel'):
    if isinstance(steps, bool) or not isinstance(steps, (int, float)) or not math.isfinite(steps) \
            or steps != int(steps) or abs(steps) > 20:
        raise ValueError("Zoom steps must be an integer between -20 and 20.")
    if method not in ('wheel', 'shortcuts'):
        raise ValueError("Unsupported zoom method.")
    if not steps:
        return
    if method == 'shortcuts':
        for _ in range(abs(int(steps))):
            pyautogui.hotkey('ctrl', '+' if steps > 0 else '-', _pause=False)
        return
    # Each zoom event owns its modifier; disconnects cannot leave Ctrl held.
    try:
        pyautogui.keyDown('ctrl', _pause=False)
        pyautogui.scroll(int(steps), _pause=False)
    finally:
        pyautogui.keyUp('ctrl', _pause=False)
