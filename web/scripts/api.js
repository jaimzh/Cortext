const API_URL = `${window.location.origin}/transcribe`;
const KEYBOARD_URL = `${window.location.origin}/keyboard/type`;
const KEYBOARD_KEY_URL = `${window.location.origin}/keyboard/key`;
const KEYBOARD_SHORTCUT_URL = `${window.location.origin}/keyboard/shortcut`;
const MODELS_URL = `${window.location.origin}/models`;
const MOUSE_MOVE_URL = `${window.location.origin}/mouse/move`;
const MOUSE_CLICK_URL = `${window.location.origin}/mouse/click`;
const MOUSE_BUTTON_URL = `${window.location.origin}/mouse/button`;
const MOUSE_SCROLL_URL = `${window.location.origin}/mouse/scroll`;

function createTokenForm(token) {
    const formData = new FormData();
    formData.append("token", token);
    return formData;
}

export function createApi(token) {
    return {
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
            const formData = createTokenForm(token);
            formData.append("dx", dx);
            formData.append("dy", dy);

            await fetch(MOUSE_MOVE_URL, { method: "POST", body: formData });
        },

        async sendMouseScroll(dx, dy) {
            const formData = createTokenForm(token);
            formData.append("dx", dx);
            formData.append("dy", dy);

            await fetch(MOUSE_SCROLL_URL, { method: "POST", body: formData });
        },

        async sendMouseClick(button, clicks = 1) {
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
            const formData = createTokenForm(token);
            formData.append("action", action);
            formData.append("button", button);

            await fetch(MOUSE_BUTTON_URL, { method: "POST", body: formData });
        },
    };
}
