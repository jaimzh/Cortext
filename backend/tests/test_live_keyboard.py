import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import controller
from app.services import copy_n_paste


class LiveKeyboardTests(unittest.TestCase):
    def test_windows_start_key_presses_windows_once(self):
        with patch.object(copy_n_paste.pyautogui, 'press') as press:
            controller.handle_controller_event({'type': 'keyboard.key', 'key': 'win'})
        press.assert_called_once_with('win')

    def test_edit_preserves_spaces_and_orders_backspace_before_typing(self):
        with patch.object(copy_n_paste.pyautogui, 'press') as press, \
                patch.object(copy_n_paste.pyautogui, 'write') as write:
            copy_n_paste.apply_keyboard_input(2, ' hi\n')
        press.assert_called_once_with('backspace', presses=2, interval=0, _pause=False)
        write.assert_called_once_with(' hi\n', interval=0, _pause=False)

    def test_unicode_composition_uses_clipboard_without_added_space(self):
        with patch.object(copy_n_paste.pyperclip, 'copy') as copy, \
                patch.object(copy_n_paste.pyautogui, 'hotkey') as hotkey, \
                patch.object(copy_n_paste.time, 'sleep'):
            copy_n_paste.apply_keyboard_input(0, '你好')
        copy.assert_called_once_with('你好')
        hotkey.assert_called_once_with('ctrl', 'v', _pause=False)

    def test_invalid_edits_never_send_input(self):
        with patch.object(copy_n_paste.pyautogui, 'press') as press, \
                patch.object(copy_n_paste.pyautogui, 'write') as write:
            for count, text in [(-1, 'a'), (True, 'a'), (10001, 'a'), (0, None), (0, 'a' * 10001)]:
                with self.assertRaises(ValueError):
                    copy_n_paste.apply_keyboard_input(count, text)
        press.assert_not_called()
        write.assert_not_called()

    def test_shared_socket_types_without_initializing_gamepad(self):
        app = FastAPI()
        app.include_router(controller.router)
        with patch.object(controller, 'SESSION_TOKEN', 'test'), \
                patch.object(controller.virtual_xbox, 'connect') as connect, \
                patch.object(controller, 'apply_keyboard_input') as apply, \
                patch.object(controller, 'press_key') as key:
            with TestClient(app).websocket_connect('/controller/ws?token=test') as socket:
                self.assertEqual(socket.receive_json()['type'], 'input.status')
                socket.send_json({'type': 'keyboard.input', 'delete': 1, 'text': 'a '})
                socket.send_json({'type': 'keyboard.key', 'key': 'enter'})
                # A handled error provides a barrier for preceding ordered events.
                socket.send_json({'type': 'unknown'})
                self.assertEqual(socket.receive_json()['type'], 'error')
            connect.assert_not_called()
            apply.assert_called_once_with(1, 'a ')
            key.assert_called_once_with('enter')


if __name__ == '__main__':
    unittest.main()
