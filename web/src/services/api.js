const API_URL = `${window.location.origin}/transcribe`;
const KEYBOARD_URL = `${window.location.origin}/keyboard/type`;
const KEYBOARD_KEY_URL = `${window.location.origin}/keyboard/key`;
const KEYBOARD_SHORTCUT_URL = `${window.location.origin}/keyboard/shortcut`;
const MODELS_URL = `${window.location.origin}/models`;
const MOUSE_MOVE_URL = `${window.location.origin}/mouse/move`;
const MOUSE_CLICK_URL = `${window.location.origin}/mouse/click`;
const MOUSE_BUTTON_URL = `${window.location.origin}/mouse/button`;
const MOUSE_SCROLL_URL = `${window.location.origin}/mouse/scroll`;
const CONTROLLER_WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/controller/ws`;
const SOCKET_RECONNECT_MS = 800;

function createTokenForm(token) {
    const formData = new FormData();
    formData.append("token", token);
    return formData;
}

export function createApi(token) {
    let disposed = false;
    let controllerSocket = null;
    let reconnectTimer = null;
    const controllerMessageListeners = new Set();
    const controllerOpenListeners = new Set();
    const inputConnectionListeners = new Set();

    function notifyInputConnection(connected) {
        inputConnectionListeners.forEach(listener => listener(connected));
    }

    function connectControllerSocket() {
        if (disposed || !token || controllerSocket?.readyState === WebSocket.OPEN || controllerSocket?.readyState === WebSocket.CONNECTING) {
            return;
        }

        const socket = new WebSocket(`${CONTROLLER_WS_URL}?token=${encodeURIComponent(token)}`);
        controllerSocket = socket;
        notifyInputConnection(false);

        controllerSocket.addEventListener("open", () => {
            if (disposed || controllerSocket !== socket) return;
            notifyInputConnection(true);
            controllerOpenListeners.forEach((listener) => listener());
        });

        controllerSocket.addEventListener("close", event => {
            if (controllerSocket !== socket) return;
            controllerSocket = null;
            notifyInputConnection(false);

            if (!disposed && event.code !== 1008 && !reconnectTimer) {
                reconnectTimer = setTimeout(() => {
                    reconnectTimer = null;
                    connectControllerSocket();
                }, SOCKET_RECONNECT_MS);
            }
        });

        controllerSocket.addEventListener("error", () => {
            socket.close();
        });

        controllerSocket.addEventListener("message", (event) => {
            let data = null;

            try {
                data = JSON.parse(event.data);
            } catch (error) {
                return;
            }

            controllerMessageListeners.forEach((listener) => listener(data));
        });
    }

    function sendControllerEventOverSocket(event) {
        if (disposed) return false;
        connectControllerSocket();

        if (controllerSocket?.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            controllerSocket.send(JSON.stringify(event));
            return true;
        } catch (error) {
            controllerSocket?.close();
            return false;
        }
    }

    return {
        dispose() {
            disposed = true;
            clearTimeout(reconnectTimer);
            controllerMessageListeners.clear();
            controllerOpenListeners.clear();
            inputConnectionListeners.clear();
            controllerSocket?.close();
        },
        sendControllerEvent(event) {
            return sendControllerEventOverSocket(event);
        },

        connectInputSocket: connectControllerSocket,
        onInputConnection(listener) {
            inputConnectionListeners.add(listener);
            listener(controllerSocket?.readyState === WebSocket.OPEN);
            return () => inputConnectionListeners.delete(listener);
        },
        sendLiveKeyboardInput(edit) {
            return sendControllerEventOverSocket({ type: 'keyboard.input', ...edit });
        },
        sendLiveKeyboardKey(key) {
            return sendControllerEventOverSocket({ type: 'keyboard.key', key });
        },

        onControllerMessage(listener) {
            controllerMessageListeners.add(listener);
            return () => controllerMessageListeners.delete(listener);
        },

        onControllerOpen(listener) {
            controllerOpenListeners.add(listener);
            return () => controllerOpenListeners.delete(listener);
        },

        async loadModels() {
            if (!token) {
                return null;
            }

            const response = await fetch(`${MODELS_URL}?token=${encodeURIComponent(token)}`);

            if (!response.ok) {
                return null;
            }

            return response.json();
        },

        async uploadAudio(audioBlob, { paste, model }) {
            const formData = createTokenForm(token);
            const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
            formData.append("file", audioBlob, `recording.${extension}`);
            formData.append("paste", paste ? "true" : "false");
            formData.append("model", model);

            const response = await fetch(API_URL, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed with status ${response.status}`);
            }

            return response.json();
        },

        async sendKeyboardText(text) {
            const formData = createTokenForm(token);
            formData.append("text", text);

            const response = await fetch(KEYBOARD_URL, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Keyboard failed with status ${response.status}`);
            }

            return response.json();
        },

        async sendKeyboardKey(key) {
            if (sendControllerEventOverSocket({ type: "keyboard.key", key })) {
                return { message: "Key pressed", key };
            }

            const formData = createTokenForm(token);
            formData.append("key", key);

            const response = await fetch(KEYBOARD_KEY_URL, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Keyboard shortcut failed with status ${response.status}`);
            }

            return response.json();
        },

        async sendKeyboardShortcut(shortcut) {
            if (sendControllerEventOverSocket({ type: "keyboard.shortcut", shortcut })) {
                return { message: "Shortcut pressed", shortcut };
            }

            const formData = createTokenForm(token);
            formData.append("shortcut", shortcut);

            const response = await fetch(KEYBOARD_SHORTCUT_URL, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Keyboard shortcut failed with status ${response.status}`);
            }

            return response.json();
        },

        async sendMouseMove(dx, dy) {
            if (sendControllerEventOverSocket({ type: "mouse.move", dx, dy })) {
                return;
            }

            const formData = createTokenForm(token);
            formData.append("dx", dx);
            formData.append("dy", dy);

            await fetch(MOUSE_MOVE_URL, { method: "POST", body: formData });
        },

        async sendMouseScroll(dx, dy) {
            if (sendControllerEventOverSocket({ type: "mouse.scroll", dx, dy })) {
                return;
            }

            const formData = createTokenForm(token);
            formData.append("dx", dx);
            formData.append("dy", dy);

            await fetch(MOUSE_SCROLL_URL, { method: "POST", body: formData });
        },

        async sendMouseClick(button, clicks = 1) {
            if (sendControllerEventOverSocket({ type: "mouse.click", button, clicks })) {
                return {
                    message: "Clicked",
                    button,
                    clicks,
                };
            }

            const formData = createTokenForm(token);
            formData.append("button", button);
            formData.append("clicks", clicks);

            const response = await fetch(MOUSE_CLICK_URL, { method: "POST", body: formData });

            if (!response.ok) {
                throw new Error(`Mouse click failed with status ${response.status}`);
            }

            return response.json();
        },

        async sendMouseButton(action, button) {
            if (sendControllerEventOverSocket({ type: "mouse.button", action, button })) {
                return;
            }

            const formData = createTokenForm(token);
            formData.append("action", action);
            formData.append("button", button);

            await fetch(MOUSE_BUTTON_URL, { method: "POST", body: formData });
        },
    };
}
