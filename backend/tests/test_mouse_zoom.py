import unittest
from unittest.mock import Mock, call, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import controller, mouse
from app.services import mouse_control


class MouseZoomTests(unittest.TestCase):
    def test_shortcut_zoom_sends_ctrl_plus_and_minus_without_wheel_input(self):
        for steps, key in [(2, '+'), (-2, '-')]:
            with patch.object(mouse_control, 'pyautogui', Mock()) as hardware:
                mouse_control.zoom_by(steps, 'shortcuts')
                self.assertEqual(hardware.mock_calls, [call.hotkey('ctrl', key, _pause=False)] * 2)

    def test_invalid_zoom_method_does_not_touch_hardware(self):
        with patch.object(mouse_control, 'pyautogui', Mock()) as hardware:
            with self.assertRaises(ValueError):
                mouse_control.zoom_by(1, 'unknown')
            self.assertEqual(hardware.mock_calls, [])

    def test_zoom_orders_ctrl_wheel_and_release_for_both_directions(self):
        for steps in (2, -2):
            with patch.object(mouse_control, 'pyautogui', Mock()) as hardware:
                mouse_control.zoom_by(steps)
                self.assertEqual(hardware.mock_calls, [call.keyDown('ctrl', _pause=False),
                    call.scroll(steps, _pause=False), call.keyUp('ctrl', _pause=False)])

    def test_ctrl_is_released_even_if_scroll_fails(self):
        with patch.object(mouse_control, 'pyautogui', Mock()) as hardware:
            hardware.scroll.side_effect = RuntimeError('failed')
            with self.assertRaises(RuntimeError):
                mouse_control.zoom_by(1)
            hardware.keyUp.assert_called_once_with('ctrl', _pause=False)

    def test_invalid_and_zero_steps_do_not_touch_hardware(self):
        with patch.object(mouse_control, 'pyautogui', Mock()) as hardware:
            for steps in (None, '2', True, 1.5, 21, -21, float('nan'), float('inf')):
                with self.assertRaises(ValueError):
                    mouse_control.zoom_by(steps)
            mouse_control.zoom_by(0)
            self.assertEqual(hardware.mock_calls, [])

    def test_socket_and_authenticated_http_route_deliver_zoom(self):
        app = FastAPI()
        app.include_router(controller.router)
        app.include_router(mouse.router)
        with patch.object(controller, 'SESSION_TOKEN', 'test'), \
                patch.object(mouse, 'SESSION_TOKEN', 'test'), \
                patch.object(mouse_control, 'zoom_by') as zoom:
            client = TestClient(app)
            with client.websocket_connect('/controller/ws?token=test') as socket:
                socket.receive_json()
                socket.send_json({'type': 'mouse.zoom', 'steps': 2})
                socket.send_json({'type': 'unknown'})
                self.assertEqual(socket.receive_json()['type'], 'error')
            zoom.assert_called_once_with(2, 'wheel')
            self.assertEqual(client.post('/mouse/zoom', data={'token': 'test', 'steps': -1, 'method': 'shortcuts'}).status_code, 200)
            self.assertEqual(client.post('/mouse/zoom', data={'token': 'wrong', 'steps': 1}).status_code, 401)
            self.assertEqual(zoom.call_args_list, [call(2, 'wheel'), call(-1, 'shortcuts')])
