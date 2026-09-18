export function initController(elements, api) {
    const {
        controllerPanel,
        controllerButtons,
        controllerSticks,
        statusText,
    } = elements;

    const activePointers = new Map();
    const activeControls = new Set();

    api.onControllerMessage?.((message) => {
        if (message.type === "gamepad.status") {
            statusText.textContent = message.message || "Native Xbox controller ready";
        } else if (message.type === "error") {
            statusText.textContent = message.message || "Controller error";
        }
    });

    api.onControllerOpen?.(() => {
        sendGamepadEvent({ type: "gamepad.connect" });
    });

    function sendGamepadEvent(event) {
        const sent = api.sendControllerEvent({
            ...event,
        });

        if (!sent) {
            statusText.textContent = "Controller reconnecting...";
        }
    }

    function pressControl(button, pointerId) {
        const gamepadButton = button.dataset.gamepadButton;
        const trigger = button.dataset.gamepadTrigger;
        const controlId = gamepadButton ? `button:${gamepadButton}` : `trigger:${trigger}`;

        if (activeControls.has(controlId)) {
            return;
        }

        activePointers.set(pointerId, { button, gamepadButton, trigger, controlId });
        activeControls.add(controlId);
        button.classList.add("pressed");

        if (gamepadButton) {
            sendGamepadEvent({
                type: "gamepad.button",
                action: "down",
                button: gamepadButton,
            });
        } else if (trigger) {
            sendGamepadEvent({
                type: "gamepad.trigger",
                side: trigger,
                value: 1,
            });
        }

        statusText.textContent = "Controller";
    }

    function releaseControl(pointerId) {
        const control = activePointers.get(pointerId);

        if (!control) {
            return;
        }

        activePointers.delete(pointerId);
        activeControls.delete(control.controlId);
        control.button.classList.remove("pressed");

        if (control.gamepadButton) {
            sendGamepadEvent({
                type: "gamepad.button",
                action: "up",
                button: control.gamepadButton,
            });
        } else if (control.trigger) {
            sendGamepadEvent({
                type: "gamepad.trigger",
                side: control.trigger,
                value: 0,
            });
        }
    }

    function releaseAll() {
        activePointers.forEach((control) => {
            if (control.gamepadButton) {
                sendGamepadEvent({
                    type: "gamepad.button",
                    action: "up",
                    button: control.gamepadButton,
                });
            } else if (control.trigger) {
                sendGamepadEvent({
                    type: "gamepad.trigger",
                    side: control.trigger,
                    value: 0,
                });
            }
        });

        controllerSticks.forEach((stick) => {
            updateStick(stick, 0, 0);
        });

        activePointers.clear();
        activeControls.clear();
        controllerButtons.forEach((button) => button.classList.remove("pressed"));
    }

    function updateStick(stick, x, y) {
        const knob = stick.querySelector(".stick-knob");

        if (knob) {
            knob.style.transform = `translate(calc(-50% + ${x * 34}px), calc(-50% + ${-y * 34}px))`;
        }

        sendGamepadEvent({
            type: "gamepad.stick",
            side: stick.dataset.gamepadStick,
            x,
            y,
        });
    }

    function moveStick(stick, event) {
        const rect = stick.getBoundingClientRect();
        const radius = Math.min(rect.width, rect.height) / 2;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const rawX = (event.clientX - centerX) / radius;
        const rawY = (centerY - event.clientY) / radius;
        const distance = Math.hypot(rawX, rawY);
        const scale = distance > 1 ? 1 / distance : 1;

        updateStick(stick, rawX * scale, rawY * scale);
    }

    controllerButtons.forEach((button) => {
        button.addEventListener("pointerdown", (event) => {
            event.preventDefault();

            try {
                button.setPointerCapture(event.pointerId);
            } catch (error) {
                // Pointer capture is best-effort on mobile browsers.
            }

            pressControl(button, event.pointerId);
        });

        button.addEventListener("pointerup", (event) => {
            event.preventDefault();
            releaseControl(event.pointerId);
        });

        button.addEventListener("pointercancel", (event) => {
            releaseControl(event.pointerId);
        });

        button.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
    });

    controllerSticks.forEach((stick) => {
        stick.addEventListener("pointerdown", (event) => {
            event.preventDefault();

            try {
                stick.setPointerCapture(event.pointerId);
            } catch (error) {
                // Pointer capture is best-effort on mobile browsers.
            }

            activePointers.set(event.pointerId, { stick });
            stick.classList.add("pressed");
            moveStick(stick, event);
            statusText.textContent = "Controller";
        });

        stick.addEventListener("pointermove", (event) => {
            event.preventDefault();

            const control = activePointers.get(event.pointerId);

            if (!control?.stick) {
                return;
            }

            moveStick(stick, event);
        });

        function releaseStick(event) {
            const control = activePointers.get(event.pointerId);

            if (!control?.stick) {
                return;
            }

            activePointers.delete(event.pointerId);
            stick.classList.remove("pressed");
            updateStick(stick, 0, 0);
        }

        stick.addEventListener("pointerup", (event) => {
            event.preventDefault();
            releaseStick(event);
        });

        stick.addEventListener("pointercancel", releaseStick);
        stick.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
    });

    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            releaseAll();
        } else {
            sendGamepadEvent({ type: "gamepad.connect" });
        }
    });

    sendGamepadEvent({ type: "gamepad.connect" });

    controllerPanel.addEventListener("touchstart", (event) => event.preventDefault(), { passive: false });
    controllerPanel.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

    ["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
        controllerPanel.addEventListener(eventName, (event) => event.preventDefault());
    });
}
