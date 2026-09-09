export function initModes(elements) {
    const {
        keyboardModeButton,
        voiceModeButton,
        trackpadModeButton,
        keyboardPanel,
        voicePanel,
        trackpadPanel,
        statusText,
        resultText,
    } = elements;

    function setMode(mode) {
        const keyboardActive = mode === "keyboard";
        const voiceActive = mode === "voice";

        keyboardPanel.hidden = !keyboardActive;
        voicePanel.hidden = !voiceActive;
        trackpadPanel.hidden = mode !== "trackpad";
        keyboardModeButton.classList.toggle("active", keyboardActive);
        voiceModeButton.classList.toggle("active", voiceActive);
        trackpadModeButton.classList.toggle("active", mode === "trackpad");
        statusText.textContent = "Ready";
        resultText.textContent = "";
    }

    keyboardModeButton.addEventListener("click", () => setMode("keyboard"));
    voiceModeButton.addEventListener("click", () => setMode("voice"));
    trackpadModeButton.addEventListener("click", () => setMode("trackpad"));

    return { setMode };
}
