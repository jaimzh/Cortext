export function initKeyboard(elements, api) {
    const {
        keyboardText,
        sendTextButton,
        sendTextLabel,
        quickSendButton,
        moreKeysButton,
        moreKeysLabel,
        advancedShortcuts,
        shortcutButtons,
        advancedShortcutButtons,
        statusText,
        resultText,
    } = elements;

    async function sendKeyboardText() {
        const text = keyboardText.value;

        if (!text.trim()) {
            statusText.textContent = "Type something first.";
            return;
        }

        sendTextButton.disabled = true;
        sendTextLabel.textContent = "Sending...";
        statusText.textContent = "Sending text...";

        try {
            const data = await api.sendKeyboardText(text);
            statusText.textContent = data.message || "Text inserted";
            resultText.textContent = text;
            keyboardText.value = "";
        } catch (error) {
            statusText.textContent = "Something went wrong.";
            resultText.textContent = error.message;
        } finally {
            sendTextButton.disabled = false;
            sendTextLabel.textContent = "Send Text";
        }
    }

    async function sendKeyboardKey(button) {
        const key = button.dataset.key;

        button.disabled = true;
        statusText.textContent = `Pressing ${key}...`;

        try {
            const data = await api.sendKeyboardKey(key);
            statusText.textContent = data.message || "Key pressed";
            resultText.textContent = key;
        } catch (error) {
            statusText.textContent = "Something went wrong.";
            resultText.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    }

    async function sendKeyboardShortcut(button) {
        const shortcut = button.dataset.shortcut;

        button.disabled = true;
        statusText.textContent = `Pressing ${shortcut.replaceAll("_", "+")}...`;

        try {
            const data = await api.sendKeyboardShortcut(shortcut);
            statusText.textContent = data.message || "Shortcut pressed";
            resultText.textContent = shortcut;
        } catch (error) {
            statusText.textContent = "Something went wrong.";
            resultText.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    }

    function toggleMoreKeys() {
        const isOpen = advancedShortcuts.hidden;

        advancedShortcuts.hidden = !isOpen;
        moreKeysButton.setAttribute("aria-expanded", String(isOpen));
        moreKeysLabel.textContent = isOpen ? "Hide keys" : "More keys";
    }

    sendTextButton.addEventListener("click", sendKeyboardText);
    quickSendButton.addEventListener("click", sendKeyboardText);
    shortcutButtons.forEach((button) => {
        button.addEventListener("click", () => sendKeyboardKey(button));
    });
    advancedShortcutButtons.forEach((button) => {
        button.addEventListener("click", () => sendKeyboardShortcut(button));
    });
    moreKeysButton.addEventListener("click", toggleMoreKeys);
}
