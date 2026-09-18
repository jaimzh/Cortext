import { createApi } from "./api.js?v=controller-touch-lock-1";
import { initController } from "./features/controller.js?v=controller-touch-lock-1";
import { initKeyboard } from "./features/keyboard.js?v=controller-touch-lock-1";
import { initTrackpad } from "./features/trackpad.js?v=controller-touch-lock-1";
import { initVoice } from "./features/voice.js?v=controller-touch-lock-1";
import { initModes } from "./ui/modes.js?v=controller-touch-lock-1";

const params = new URLSearchParams(window.location.search);
const token = params.get("token") || "";
const api = createApi(token);

const elements = {
    keyboardModeButton: document.getElementById("keyboardModeButton"),
    voiceModeButton: document.getElementById("voiceModeButton"),
    trackpadModeButton: document.getElementById("trackpadModeButton"),
    controllerModeButton: document.getElementById("controllerModeButton"),
    keyboardPanel: document.getElementById("keyboardPanel"),
    voicePanel: document.getElementById("voicePanel"),
    trackpadPanel: document.getElementById("trackpadPanel"),
    controllerPanel: document.getElementById("controllerPanel"),
    trackpadPad: document.getElementById("trackpadPad"),
    trackpadScrollBar: document.getElementById("trackpadScrollBar"),
    sensitivitySlider: document.getElementById("sensitivitySlider"),
    sensitivityValue: document.getElementById("sensitivityValue"),
    keyboardText: document.getElementById("keyboardText"),
    sendTextButton: document.getElementById("sendTextButton"),
    sendTextLabel: document.getElementById("sendTextLabel"),
    quickSendButton: document.getElementById("quickSendButton"),
    moreKeysButton: document.getElementById("moreKeysButton"),
    moreKeysLabel: document.getElementById("moreKeysLabel"),
    advancedShortcuts: document.getElementById("advancedShortcuts"),
    shortcutButtons: document.querySelectorAll("[data-key]"),
    advancedShortcutButtons: document.querySelectorAll("[data-shortcut]"),
    controllerButtons: document.querySelectorAll("[data-gamepad-button], [data-gamepad-trigger]"),
    controllerSticks: document.querySelectorAll("[data-gamepad-stick]"),
    recordButton: document.getElementById("recordButton"),
    recordLabel: document.getElementById("recordLabel"),
    pasteToggle: document.getElementById("pasteToggle"),
    modelSelect: document.getElementById("modelSelect"),
    statusText: document.getElementById("status"),
    resultText: document.getElementById("result"),
};

initModes(elements);
initKeyboard(elements, api);
initVoice(elements, api);
initTrackpad(elements, api);
initController(elements, api);
