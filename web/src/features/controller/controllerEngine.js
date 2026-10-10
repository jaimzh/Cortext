export function initController(elements, api) {
    const events = new AbortController();
    let disposed = false;
    function listen(target, type, handler, options = {}) {
        target.addEventListener(type, handler, { ...options, signal: events.signal });
    }
    const {
        controllerPanel,
        controllerFullscreenButton,
        controllerButtons,
        controllerSticks,
        statusText,
    } = elements;

    const activePointers = new Map();
    const activeControls = new Set();

    function setControllerFullscreen(active) {
        if (disposed) return;
        document.body.classList.toggle("controller-fullscreen", active);
        controllerFullscreenButton.setAttribute("aria-pressed", String(active));
        const label = active ? 'Exit fullscreen' : 'Enter fullscreen';
        controllerFullscreenButton.setAttribute('aria-label', label);
        controllerFullscreenButton.setAttribute('title', label);
    }

    async function toggleControllerFullscreen() {
        const shouldEnter = !document.body.classList.contains("controller-fullscreen");

        if (shouldEnter) {
            try {
                if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (error) {
                // Some mobile browsers reject fullscreen; keep the in-app layout.
            }

            setControllerFullscreen(true);
        } else {
            try {
                if (document.fullscreenElement && document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            } catch (error) {
                // Keep UI responsive even if the browser rejects exitFullscreen.
            }

            setControllerFullscreen(false);
        }
    }

    listen(document, "fullscreenchange", () => {
        if (!document.fullscreenElement) {
            setControllerFullscreen(false);
        }
    });

    listen(controllerFullscreenButton, "click", toggleControllerFullscreen);

    const removeMessage = api.onControllerMessage?.((message) => {
        if (message.type === "gamepad.status") {
            statusText.textContent = message.message || "Native Xbox controller ready";
        } else if (message.type === "error") {
            statusText.textContent = message.message || "Controller error";
        }
    });

    const removeOpen = api.onControllerOpen?.(() => {
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
        const keyboardKey = button.dataset.keyboardKey;
        const controlId = keyboardKey ? `key:${keyboardKey}` : gamepadButton ? `button:${gamepadButton}` : `trigger:${trigger}`;

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
        } else if (keyboardKey) {
            api.sendKeyboardKey(keyboardKey).catch(error => {
                if (!disposed) statusText.textContent = `Key press failed: ${error.message}`;
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
        // Map screen coordinates back into the controller's rotated surface.
        const angle = Number(getComputedStyle(stick).getPropertyValue('--controller-rotation')) * Math.PI / 180;
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const rawX = (dx * Math.cos(angle) + dy * Math.sin(angle)) / radius;
        const rawY = (dx * Math.sin(angle) - dy * Math.cos(angle)) / radius;
        const distance = Math.hypot(rawX, rawY);
        const scale = distance > 1 ? 1 / distance : 1;

        updateStick(stick, rawX * scale, rawY * scale);
    }

    controllerButtons.forEach((button) => {
        listen(button, "pointerdown", (event) => {
            event.preventDefault();

            try {
                button.setPointerCapture(event.pointerId);
            } catch (error) {
                // Pointer capture is best-effort on mobile browsers.
            }

            pressControl(button, event.pointerId);
        });

        listen(button, "pointerup", (event) => {
            event.preventDefault();
            releaseControl(event.pointerId);
        });

        listen(button, "pointercancel", (event) => {
            releaseControl(event.pointerId);
        });

        listen(button, "contextmenu", (event) => {
            event.preventDefault();
        });
    });

    controllerSticks.forEach((stick) => {
        listen(stick, "pointerdown", (event) => {
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

        listen(stick, "pointermove", (event) => {
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

        listen(stick, "pointerup", (event) => {
            event.preventDefault();
            releaseStick(event);
        });

        listen(stick, "pointercancel", releaseStick);
        listen(stick, "contextmenu", (event) => {
            event.preventDefault();
        });
    });

    listen(window, "blur", releaseAll);
    listen(document, "visibilitychange", () => {
        if (document.hidden) {
            releaseAll();
        } else {
            sendGamepadEvent({ type: "gamepad.connect" });
        }
    });

    sendGamepadEvent({ type: "gamepad.connect" });

    listen(controllerPanel, "touchstart", (event) => event.preventDefault(), { passive: false });
    listen(controllerPanel, "touchmove", (event) => event.preventDefault(), { passive: false });

    ["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
        listen(controllerPanel, eventName, (event) => event.preventDefault());
    });

    return () => {
        releaseAll();
        events.abort();
        removeMessage?.();
        removeOpen?.();
        setControllerFullscreen(false);
        disposed = true;
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
}
