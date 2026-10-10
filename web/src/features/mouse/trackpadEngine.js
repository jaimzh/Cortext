const DOUBLE_TAP_MS = 260;
const MIN_TAP_MS = 70;
const TAP_MOVE_THRESHOLD = 18;
const DRAG_MOVE_THRESHOLD = 8;
const SCROLL_STEP_FACTOR = 0.3;
const SCROLL_BAR_STEP_FACTOR = 1.35;
const SCROLL_BAR_EDGE_RATIO = 0.22;
const SCROLL_BAR_EDGE_MAX_SPEED = 7;
const POINTER_ACCELERATION_START = 0.25;
const POINTER_ACCELERATION_FACTOR = 1.4;
const POINTER_ACCELERATION_MAX_BOOST = 2.6;

export function initTrackpad(elements, api) {
    const events = new AbortController();
    let disposed = false;
    function listen(target, type, handler, options = {}) {
        target.addEventListener(type, handler, { ...options, signal: events.signal });
    }
    const {
        trackpadPad,
        trackpadScrollBar,
        sensitivitySlider,
        sensitivityValue,
        statusText,
    } = elements;

    const pointerMap = new Map();
    let pendingDelta = { x: 0, y: 0 };
    let pendingScroll = { x: 0, y: 0 };
    let previousPointerCount = 0;
    let pendingTapTimer = null;
    let tapMoved = false;
    let scrolledSincePress = false;
    let doubleTapArmed = false;
    let secondTapActive = false;
    let doubleClickArmed = false;
    let doubleClickTapActive = false;
    let dragActive = false;
    let moveLoopStarted = false;
    let scrollLoopStarted = false;
    let tapStartedAt = 0;
    let scrollBarPointerId = null;
    let scrollBarPreviousY = 0;
    let scrollBarEdgeVelocity = 0;
    let scrollBarEdgeLoopStarted = false;

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
            while (!disposed) {
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
            while (!disposed) {
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

    function startScrollBarEdgeLoop() {
        if (scrollBarEdgeLoopStarted) {
            return;
        }

        scrollBarEdgeLoopStarted = true;

        (async () => {
            while (!disposed) {
                if (scrollBarPointerId !== null && scrollBarEdgeVelocity !== 0) {
                    const sensitivity = Number(sensitivitySlider.value);
                    pendingScroll.y += scrollBarEdgeVelocity * sensitivity;
                    await new Promise((resolve) => setTimeout(resolve, 16));
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 40));
                }
            }
        })();
    }

    function cancelPendingTap() {
        if (pendingTapTimer) {
            clearTimeout(pendingTapTimer);
            pendingTapTimer = null;
        }

        doubleTapArmed = false;
        doubleClickArmed = false;
    }

    function reAnchorPointers(timestamp = performance.now()) {
        for (const pointer of pointerMap.values()) {
            pointer.px = pointer.x;
            pointer.py = pointer.y;
            pointer.pt = timestamp;
        }
    }

    function armTapClick() {
        cancelPendingTap();
        doubleTapArmed = true;

        pendingTapTimer = setTimeout(() => {
            doubleTapArmed = false;
            pendingTapTimer = null;
        }, DOUBLE_TAP_MS);
    }

    function armDoubleClickOrSendClick() {
        cancelPendingTap();
        doubleClickArmed = true;

        pendingTapTimer = setTimeout(() => {
            doubleClickArmed = false;
            pendingTapTimer = null;
            sendMouseClick("left", "Left");
            statusText.textContent = "Left-click";
        }, DOUBLE_TAP_MS);
    }

    function startDrag() {
        dragActive = true;
        secondTapActive = false;
        doubleClickTapActive = false;
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

    function updateScrollBarEdgeVelocity(clientY) {
        const rect = trackpadScrollBar.getBoundingClientRect();
        const edgeSize = rect.height * SCROLL_BAR_EDGE_RATIO;
        const offsetY = clientY - rect.top;

        if (offsetY < edgeSize) {
            const pressure = (edgeSize - offsetY) / edgeSize;
            scrollBarEdgeVelocity = -SCROLL_BAR_EDGE_MAX_SPEED * pressure;
        } else if (offsetY > rect.height - edgeSize) {
            const pressure = (offsetY - (rect.height - edgeSize)) / edgeSize;
            scrollBarEdgeVelocity = SCROLL_BAR_EDGE_MAX_SPEED * pressure;
        } else {
            scrollBarEdgeVelocity = 0;
        }
    }

    function getPointerAcceleration(dx, dy, elapsedMs) {
        const distance = Math.hypot(dx, dy);
        const speed = distance / Math.max(elapsedMs, 8);
        const boostedSpeed = Math.max(speed - POINTER_ACCELERATION_START, 0);
        return 1 + Math.min(
            boostedSpeed * POINTER_ACCELERATION_FACTOR,
            POINTER_ACCELERATION_MAX_BOOST,
        );
    }

    listen(trackpadPad, "pointerdown", (event) => {
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
            pt: event.timeStamp,
        });

        startMoveLoop();
        startScrollLoop();

        const count = pointerMap.size;
        previousPointerCount = count;
        trackpadPad.classList.add("active");

        if (count === 1) {
            scrolledSincePress = false;
            tapMoved = false;
            tapStartedAt = performance.now();

            if (doubleClickArmed) {
                cancelPendingTap();
                doubleClickTapActive = true;
            } else if (doubleTapArmed) {
                cancelPendingTap();
                secondTapActive = true;
            }
        } else {
            scrolledSincePress = true;
            cancelPendingTap();
            secondTapActive = false;
            doubleClickTapActive = false;

            if (dragActive) {
                endDrag();
            }
        }
    });

    listen(trackpadPad, "pointermove", (event) => {
        event.preventDefault();
        const pointer = pointerMap.get(event.pointerId);

        if (!pointer) {
            return;
        }

        const x = event.clientX;
        const y = event.clientY;
        const dx = x - pointer.px;
        const dy = y - pointer.py;
        const elapsedMs = event.timeStamp - pointer.pt;
        const wasScroll = previousPointerCount === 2;
        const isScroll = pointerMap.size === 2;

        pointer.px = x;
        pointer.py = y;
        pointer.pt = event.timeStamp;
        pointer.x = x;
        pointer.y = y;

        if (wasScroll && !isScroll) {
            reAnchorPointers(event.timeStamp);
            previousPointerCount = pointerMap.size;
            return;
        }

        if (isScroll) {
            cancelPendingTap();
            secondTapActive = false;
            doubleClickTapActive = false;
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
            } else if (doubleClickTapActive) {
                if (Math.abs(dx) + Math.abs(dy) > TAP_MOVE_THRESHOLD) {
                    tapMoved = true;
                }
            } else {
                if (!dragActive && Math.abs(dx) + Math.abs(dy) > TAP_MOVE_THRESHOLD) {
                    tapMoved = true;
                }

                if (!secondTapActive) {
                    const sensitivity = Number(sensitivitySlider.value);
                    const acceleration = getPointerAcceleration(dx, dy, elapsedMs);
                    pendingDelta.x += dx * sensitivity * acceleration;
                    pendingDelta.y += dy * sensitivity * acceleration;
                }
            }

            previousPointerCount = pointerMap.size;
        }
    });

    function handlePointerEnd(event, cancelled) {
        const wasScroll = pointerMap.size === 2;
        pointerMap.delete(event.pointerId);

        if (wasScroll && pointerMap.size === 1) {
            reAnchorPointers(event.timeStamp);
            previousPointerCount = pointerMap.size;
            return;
        }

        if (pointerMap.size === 0) {
            trackpadPad.classList.remove("active");

            if (dragActive) {
                endDrag();
            } else if (doubleClickTapActive) {
                doubleClickTapActive = false;

                if (
                    !cancelled &&
                    !tapMoved &&
                    performance.now() - tapStartedAt >= MIN_TAP_MS
                ) {
                    sendMouseClick("left", "Left", 2);
                    statusText.textContent = "Double-click";
                }
            } else if (secondTapActive) {
                secondTapActive = false;

                if (
                    !cancelled &&
                    !tapMoved &&
                    performance.now() - tapStartedAt >= MIN_TAP_MS
                ) {
                    armDoubleClickOrSendClick();
                }
            } else if (
                !cancelled &&
                !tapMoved &&
                !scrolledSincePress &&
                performance.now() - tapStartedAt >= MIN_TAP_MS
            ) {
                armTapClick();
            }
        }

        previousPointerCount = pointerMap.size;
    }

    listen(trackpadPad, "pointerup", (event) => {
        event.preventDefault();
        handlePointerEnd(event, false);
    });

    listen(trackpadPad, "pointercancel", (event) => {
        handlePointerEnd(event, true);
    });

    listen(trackpadPad, "contextmenu", (event) => {
        event.preventDefault();
    });

    listen(trackpadPad, "touchstart", (event) => event.preventDefault(), { passive: false });
    listen(trackpadPad, "touchmove", (event) => event.preventDefault(), { passive: false });

    if (trackpadScrollBar) {
        listen(trackpadScrollBar, "pointerdown", (event) => {
            event.preventDefault();

            if (scrollBarPointerId !== null) {
                return;
            }

            try {
                trackpadScrollBar.setPointerCapture(event.pointerId);
            } catch (error) {
                // Some browsers reject pointer capture for touch; keep going.
            }

            startScrollLoop();
            startScrollBarEdgeLoop();

            scrollBarPointerId = event.pointerId;
            scrollBarPreviousY = event.clientY;
            updateScrollBarEdgeVelocity(event.clientY);
            trackpadScrollBar.classList.add("active");
            statusText.textContent = "Scrolling";
        });

        listen(trackpadScrollBar, "pointermove", (event) => {
            event.preventDefault();

            if (event.pointerId !== scrollBarPointerId) {
                return;
            }

            const dy = event.clientY - scrollBarPreviousY;
            const sensitivity = Number(sensitivitySlider.value);
            pendingScroll.y += dy * SCROLL_BAR_STEP_FACTOR * sensitivity;
            scrollBarPreviousY = event.clientY;
            updateScrollBarEdgeVelocity(event.clientY);
        });

        function endScrollBar(event) {
            if (event.pointerId !== scrollBarPointerId) {
                return;
            }

            scrollBarPointerId = null;
            scrollBarEdgeVelocity = 0;
            trackpadScrollBar.classList.remove("active");
        }

        listen(trackpadScrollBar, "pointerup", (event) => {
            event.preventDefault();
            endScrollBar(event);
        });

        listen(trackpadScrollBar, "pointercancel", endScrollBar);
        listen(trackpadScrollBar, "contextmenu", (event) => {
            event.preventDefault();
        });
        listen(trackpadScrollBar, "touchstart", (event) => event.preventDefault(), { passive: false });
        listen(trackpadScrollBar, "touchmove", (event) => event.preventDefault(), { passive: false });
    }

    elements.mouseButtons.forEach((button) => {
        listen(button, "click", () => {
            const label = button.querySelector(".button-label").textContent.trim();
            sendMouseClick(button.dataset.click, label);
        });
    });

    listen(sensitivitySlider, "input", () => {
        sensitivityValue.textContent = `${sensitivitySlider.value}x`;
    });

    return () => {
        disposed = true;
        events.abort();
        cancelPendingTap();
        endDrag();
        pointerMap.clear();
        trackpadPad.classList.remove('active', 'dragging');
        trackpadScrollBar.classList.remove('active');
    };
}
