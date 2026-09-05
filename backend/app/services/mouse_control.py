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