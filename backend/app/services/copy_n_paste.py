
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


def press_shortcut(shortcut: str):
    keys = ALLOWED_SHORTCUTS.get(shortcut)

    if keys is None:
        raise ValueError(f"Unsupported shortcut: {shortcut}")

    pyautogui.hotkey(*keys)
