class VirtualGamepadUnavailable(RuntimeError):
    pass


try:
    import vgamepad as vg
except ImportError:
    vg = None


BUTTONS = {
    "a": "XUSB_GAMEPAD_A",
    "b": "XUSB_GAMEPAD_B",
    "x": "XUSB_GAMEPAD_X",
    "y": "XUSB_GAMEPAD_Y",
    "dpad_up": "XUSB_GAMEPAD_DPAD_UP",
    "dpad_down": "XUSB_GAMEPAD_DPAD_DOWN",
    "dpad_left": "XUSB_GAMEPAD_DPAD_LEFT",
    "dpad_right": "XUSB_GAMEPAD_DPAD_RIGHT",
    "lb": "XUSB_GAMEPAD_LEFT_SHOULDER",
    "rb": "XUSB_GAMEPAD_RIGHT_SHOULDER",
    "back": "XUSB_GAMEPAD_BACK",
    "start": "XUSB_GAMEPAD_START",
    "left_stick": "XUSB_GAMEPAD_LEFT_THUMB",
    "right_stick": "XUSB_GAMEPAD_RIGHT_THUMB",
}


class VirtualXboxController:
    def __init__(self):
        self._gamepad = None

    @property
    def available(self) -> bool:
        return vg is not None

    def _require_gamepad(self):
        if vg is None:
            raise VirtualGamepadUnavailable(
                "Native Xbox controller support needs vgamepad and ViGEmBus installed."
            )

        if self._gamepad is None:
            self._gamepad = vg.VX360Gamepad()

        return self._gamepad

    def connect(self):
        self._require_gamepad()

    def _button(self, name: str):
        if vg is None:
            raise VirtualGamepadUnavailable(
                "Native Xbox controller support needs vgamepad and ViGEmBus installed."
            )

        button_name = BUTTONS.get(name)

        if button_name is None:
            raise ValueError(f"Unsupported gamepad button: {name}")

        return getattr(vg.XUSB_BUTTON, button_name)

    def button(self, name: str, pressed: bool):
        gamepad = self._require_gamepad()
        button = self._button(name)

        if pressed:
            gamepad.press_button(button=button)
        else:
            gamepad.release_button(button=button)

        gamepad.update()

    def trigger(self, side: str, value: float):
        gamepad = self._require_gamepad()
        normalized = max(0, min(float(value), 1))

        if side == "left":
            gamepad.left_trigger_float(value_float=normalized)
        elif side == "right":
            gamepad.right_trigger_float(value_float=normalized)
        else:
            raise ValueError(f"Unsupported gamepad trigger: {side}")

        gamepad.update()

    def stick(self, side: str, x: float, y: float):
        gamepad = self._require_gamepad()
        normalized_x = max(-1, min(float(x), 1))
        normalized_y = max(-1, min(float(y), 1))

        if side == "left":
            gamepad.left_joystick_float(
                x_value_float=normalized_x,
                y_value_float=normalized_y,
            )
        elif side == "right":
            gamepad.right_joystick_float(
                x_value_float=normalized_x,
                y_value_float=normalized_y,
            )
        else:
            raise ValueError(f"Unsupported gamepad stick: {side}")

        gamepad.update()

    def reset(self):
        if self._gamepad is None:
            return

        self._gamepad.reset()
        self._gamepad.update()


virtual_xbox = VirtualXboxController()
