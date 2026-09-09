const LONG_PRESS_MS = 850;
const DOUBLE_TAP_MS = 260;
const TAP_MOVE_THRESHOLD = 12;
const DRAG_MOVE_THRESHOLD = 8;
const SCROLL_STEP_FACTOR = 0.3;

export function initTrackpad(elements, api) {
    const {
        trackpadPad,
        sensitivitySlider,
        sensitivityValue,
        statusText,
    } = elements;

    const pointerMap = new Map();
    let pendingDelta = { x: 0, y: 0 };
    let pendingScroll = { x: 0, y: 0 };
    let previousPointerCount = 0;
    let longPressTimer = null;
    let pendingTapTimer = null;
    let longPressed = false;
    let tapMoved = false;
    let scrolledSincePress = false;
    let doubleTapArmed = false;
    let secondTapActive = false;
    let dragActive = false;
    let moveLoopStarted = false;
    let scrollLoopStarted = false;

    async function sendMouseMove(dx, dy) {
        try {
            await api.sendMouseMove(dx, dy);
        } catch (error) {
            // Movement is fire-and-forget; a network stall just drops a frame.
        }
    }

    async function sendMouseScroll(dx, dy) {
        try {
            await api.sendMouseScroll(dx, dy);
        } catch (error) {
            // Fire-and-forget.
        }
    }

    async function sendMouseClick(button, label, clicks = 1) {
        try {
            const data = await api.sendMouseClick(button, clicks);
            statusText.textContent = data.message || `${label} clicked`;
        } catch (error) {
            statusText.textContent = "Click failed.";
        }
    }

    async function sendMouseButton(action, button) {
        try {
            await api.sendMouseButton(action, button);
        } catch (error) {
            // Fire-and-forget.
        }
    }

    function startMoveLoop() {
        if (moveLoopStarted) {
            return;
        }

        moveLoopStarted = true;

        (async () => {
            while (true) {
                const dx = Math.trunc(pendingDelta.x);
                const dy = Math.trunc(pendingDelta.y);

                if (dx !== 0 || dy !== 0) {
                    pendingDelta.x -= dx;
                    pendingDelta.y -= dy;
                    await sendMouseMove(dx, dy);
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 8));
                }
            }
        })();
    }

    function startScrollLoop() {
        if (scrollLoopStarted) {
            return;
        }

        scrollLoopStarted = true;

        (async () => {
            while (true) {
                const dx = Math.trunc(pendingScroll.x);
                const dy = Math.trunc(pendingScroll.y);

                if (dx !== 0 || dy !== 0) {
                    pendingScroll.x -= dx;
                    pendingScroll.y -= dy;
                    await sendMouseScroll(dx, dy);
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 16));
                }
            }
        })();
    }

    function clearLongPress() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }

    function cancelPendingTap() {
        if (pendingTapTimer) {
            clearTimeout(pendingTapTimer);
            pendingTapTimer = null;
        }

        doubleTapArmed = false;
    }

    function reAnchorPointers() {
        for (const pointer of pointerMap.values()) {
            pointer.px = pointer.x;
            pointer.py = pointer.y;
        }
    }

    function queueSingleTap() {
        cancelPendingTap();
        doubleTapArmed = true;

        pendingTapTimer = setTimeout(() => {
            doubleTapArmed = false;
            pendingTapTimer = null;
            sendMouseClick("left", "Left");
            statusText.textContent = "Left-click";
        }, DOUBLE_TAP_MS);
    }

    function startDrag() {
        dragActive = true;
        secondTapActive = false;
        trackpadPad.classList.add("dragging");
        sendMouseButton("down", "left");
        statusText.textContent = "Dragging";
    }

    function endDrag() {
        if (!dragActive) {
            return;
        }

        dragActive = false;
        trackpadPad.classList.remove("dragging");
        sendMouseButton("up", "left");
    }

    trackpadPad.addEventListener("pointerdown", (event) => {
        event.preventDefault();

        try {
            trackpadPad.setPointerCapture(event.pointerId);
        } catch (error) {
            // Some browsers reject pointer capture for touch; keep going.
        }

        pointerMap.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
            px: event.clientX,
            py: event.clientY,
        });

        startMoveLoop();
        startScrollLoop();

        const count = pointerMap.size;
        previousPointerCount = count;
        trackpadPad.classList.add("active");

        if (count === 1) {
            scrolledSincePress = false;
            longPressed = false;
            tapMoved = false;

            if (doubleTapArmed) {
                cancelPendingTap();
                secondTapActive = true;
            } else {
                longPressTimer = setTimeout(() => {
                    if (
                        pointerMap.size === 1 &&
                        !longPressed &&
                        !tapMoved &&
                        !secondTapActive &&
                        !dragActive
                    ) {
                        longPressed = true;
                        sendMouseClick("right", "Right");
                        statusText.textContent = "Right-click";
                    }
                }, LONG_PRESS_MS);
            }
        } else {
            scrolledSincePress = true;
            clearLongPress();
            cancelPendingTap();
            secondTapActive = false;

            if (dragActive) {
                endDrag();
            }
        }
    });

    trackpadPad.addEventListener("pointermove", (event) => {
        event.preventDefault();
        const pointer = pointerMap.get(event.pointerId);

        if (!pointer) {
            return;
        }

        const x = event.clientX;
        const y = event.clientY;
        const dx = x - pointer.px;
        const dy = y - pointer.py;
        const wasScroll = previousPointerCount === 2;
        const isScroll = pointerMap.size === 2;

        pointer.px = x;
        pointer.py = y;
        pointer.x = x;
        pointer.y = y;

        if (wasScroll && !isScroll) {
            reAnchorPointers();
            previousPointerCount = pointerMap.size;
            return;
        }

        if (isScroll) {
            clearLongPress();
            cancelPendingTap();
            secondTapActive = false;
            scrolledSincePress = true;

            if (dragActive) {
                endDrag();
            }

            const sensitivity = Number(sensitivitySlider.value);
            pendingScroll.y += dy * SCROLL_STEP_FACTOR * sensitivity;
            pendingScroll.x += dx * SCROLL_STEP_FACTOR * sensitivity;
            previousPointerCount = pointerMap.size;
            return;
        }

        if (pointerMap.size === 1) {
            if (secondTapActive) {
                if (Math.abs(dx) + Math.abs(dy) > DRAG_MOVE_THRESHOLD) {
                    startDrag();
                }
            } else {
                if (!dragActive && Math.abs(dx) + Math.abs(dy) > TAP_MOVE_THRESHOLD) {
                    tapMoved = true;
                    clearLongPress();
                }

                if (!secondTapActive) {
                    const sensitivity = Number(sensitivitySlider.value);
                    pendingDelta.x += dx * sensitivity;
                    pendingDelta.y += dy * sensitivity;
                }
            }

            previousPointerCount = pointerMap.size;
        }
    });

    function handlePointerEnd(event, cancelled) {
        const wasScroll = pointerMap.size === 2;
        pointerMap.delete(event.pointerId);

        if (wasScroll && pointerMap.size === 1) {
            reAnchorPointers();
            previousPointerCount = pointerMap.size;
            return;
        }

        if (pointerMap.size === 0) {
            clearLongPress();
            trackpadPad.classList.remove("active");

            if (dragActive) {
                endDrag();
            } else if (secondTapActive) {
                secondTapActive = false;

                if (!cancelled) {
                    sendMouseClick("left", "Left", 2);
                    statusText.textContent = "Double-click";
                }
            } else if (!cancelled && !longPressed && !tapMoved && !scrolledSincePress) {
                queueSingleTap();
            }
        }

        previousPointerCount = pointerMap.size;
    }

    trackpadPad.addEventListener("pointerup", (event) => {
        event.preventDefault();
        handlePointerEnd(event, false);
    });

    trackpadPad.addEventListener("pointercancel", (event) => {
        handlePointerEnd(event, true);
    });

    trackpadPad.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });

    trackpadPad.addEventListener("touchstart", (event) => event.preventDefault(), { passive: false });
    trackpadPad.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

    document.querySelectorAll("[data-click]").forEach((button) => {
        button.addEventListener("click", () => {
            const label = button.querySelector(".button-label").textContent.trim();
            sendMouseClick(button.dataset.click, label);
        });
    });

    sensitivitySlider.addEventListener("input", () => {
        sensitivityValue.textContent = `${sensitivitySlider.value}x`;
    });
}
