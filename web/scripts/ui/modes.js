export function initModes(elements) {
    const {
        keyboardModeButton,
        voiceModeButton,
        trackpadModeButton,
        controllerModeButton,
        keyboardPanel,
        voicePanel,
        trackpadPanel,
        controllerPanel,
        statusText,
        resultText,
    } = elements;

    function setMode(mode) {
        const keyboardActive = mode === "keyboard";
        const voiceActive = mode === "voice";
        const trackpadActive = mode === "trackpad";
        const controllerActive = mode === "controller";

        keyboardPanel.hidden = !keyboardActive;
        voicePanel.hidden = !voiceActive;
        trackpadPanel.hidden = !trackpadActive;
        controllerPanel.hidden = !controllerActive;
        keyboardModeButton.classList.toggle("active", keyboardActive);
        voiceModeButton.classList.toggle("active", voiceActive);
        trackpadModeButton.classList.toggle("active", trackpadActive);
        controllerModeButton.classList.toggle("active", controllerActive);
        statusText.textContent = "Ready";
        resultText.textContent = "";
    }

    keyboardModeButton.addEventListener("click", () => setMode("keyboard"));
    voiceModeButton.addEventListener("click", () => setMode("voice"));
    trackpadModeButton.addEventListener("click", () => setMode("trackpad"));
    controllerModeButton.addEventListener("click", () => setMode("controller"));

    return { setMode };
}
