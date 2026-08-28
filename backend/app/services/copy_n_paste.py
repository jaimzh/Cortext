
import time

import pyautogui
import pyperclip


def insert_text(text: str):
    if not text.strip():
        return

    pyperclip.copy(text + " ")
    time.sleep(0.05)
    pyautogui.hotkey("ctrl", "v")
