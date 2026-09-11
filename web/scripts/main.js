import { createApi } from "./api.js";
import { initKeyboard } from "./features/keyboard.js";
import { initTrackpad } from "./features/trackpad.js";
import { initVoice } from "./features/voice.js";
import { initModes } from "./ui/modes.js";

const params = new URLSearchParams(window.location.search);
const token = params.get("token") || "";
const api = createApi(token);

const elements = {
    keyboardModeButton: document.getElementById("keyboardModeButton"),
    voiceModeButton: document.getElementById("voiceModeButton"),
    trackpadModeButton: document.getElementById("trackpadModeButton"),
    keyboardPanel: document.getElementById("keyboardPanel"),
    voicePanel: document.getElementById("voicePanel"),
    trackpadPanel: document.getElementById("trackpadPanel"),
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
