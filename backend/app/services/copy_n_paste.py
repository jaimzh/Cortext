
import time

import pyautogui
import pyperclip


ALLOWED_KEYS = {
    "enter": "enter",
    "tab": "tab",
    "esc": "esc",
    "backspace": "backspace",
    "space": "space",
    "up": "up",
    "down": "down",
    "left": "left",
    "right": "right",
}

ALLOWED_HELD_KEYS = {
    **ALLOWED_KEYS,
    "w": "w",
    "a": "a",
    "s": "s",
    "d": "d",
    "q": "q",
    "e": "e",
    "r": "r",
    "f": "f",
    "space": "space",
    "shift": "shift",
    "ctrl": "ctrl",
}

ALLOWED_SHORTCUTS = {
    "ctrl_a": ("ctrl", "a"),
    "ctrl_c": ("ctrl", "c"),
    "ctrl_v": ("ctrl", "v"),
    "ctrl_z": ("ctrl", "z"),
    "ctrl_s": ("ctrl", "s"),
    "shift_enter": ("shift", "enter"),
    "ctrl_win_left": ("ctrl", "win", "left"),
    "win_tab": ("win", "tab"),
    "ctrl_win_right": ("ctrl", "win", "right"),
}


def insert_text(text: str, add_space: bool = True):
    if not text.strip():
        return

    value = text + " " if add_space else text
    pyperclip.copy(value)
    time.sleep(0.05)
    pyautogui.hotkey("ctrl", "v")


def press_key(key: str):
    normalized_key = ALLOWED_KEYS.get(key)

    if normalized_key is None:
        raise ValueError(f"Unsupported key: {key}")

    pyautogui.press(normalized_key)


def apply_keyboard_input(delete_count: int, text: str):
    """Apply one ordered live edit without trimming spaces or adding a suffix."""
    if type(delete_count) is not int or not 0 <= delete_count <= 10000:
        raise ValueError("Live keyboard delete count must be between 0 and 10000.")
    if not isinstance(text, str) or len(text) > 10000:
        raise ValueError("Live keyboard text must be at most 10000 characters.")
    if delete_count:
        pyautogui.press("backspace", presses=delete_count, interval=0, _pause=False)
    if not text:
        return
    if all(32 <= ord(char) <= 126 or char in "\n\r\t" for char in text):
        pyautogui.write(text, interval=0, _pause=False)
    else:
        # Clipboard insertion supports composed and non-ASCII phone input.
        pyperclip.copy(text)
        time.sleep(0.05)
        pyautogui.hotkey("ctrl", "v", _pause=False)


def key_down(key: str):
    normalized_key = ALLOWED_HELD_KEYS.get(key)

    if normalized_key is None:
        raise ValueError(f"Unsupported key: {key}")

    pyautogui.keyDown(normalized_key)


def key_up(key: str):
    normalized_key = ALLOWED_HELD_KEYS.get(key)

    if normalized_key is None:
        raise ValueError(f"Unsupported key: {key}")

    pyautogui.keyUp(normalized_key)


def press_shortcut(shortcut: str):
    keys = ALLOWED_SHORTCUTS.get(shortcut)

    if keys is None:
        raise ValueError(f"Unsupported shortcut: {shortcut}")

    pyautogui.hotkey(*keys)
