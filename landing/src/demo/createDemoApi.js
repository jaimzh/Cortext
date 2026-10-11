export function createDemoApi(emit) {
  const messages = new Set();
  const send = event => { emit(event); return true; };
  const result = event => { send(event); return Promise.resolve({ message: 'Demo input received' }); };

  return {
    connectInputSocket() {},
    onInputConnection(listener) { listener(true); return () => {}; },
    onControllerMessage(listener) { messages.add(listener); return () => messages.delete(listener); },
    onControllerOpen(listener) { listener(); return () => {}; },
    sendControllerEvent(event) {
      if (event.type === 'gamepad.connect') {
        messages.forEach(listener => listener({ type: 'gamepad.status', message: 'Demo controller ready' }));
      }
      return send(event);
    },
    sendLiveKeyboardInput(edit) { return send({ type: 'keyboard.input', ...edit }); },
    sendLiveKeyboardKey(key) { return send({ type: 'keyboard.key', key }); },
    sendLiveKeyboardShortcut(shortcut) { return send({ type: 'keyboard.shortcut', shortcut }); },
    sendKeyboardText(text) { return result({ type: 'keyboard.input', text }); },
    sendKeyboardKey(key) { return result({ type: 'keyboard.key', key }); },
    sendKeyboardShortcut(shortcut) { return result({ type: 'keyboard.shortcut', shortcut }); },
    sendMouseMove(dx, dy) { return result({ type: 'mouse.move', dx, dy }); },
    sendMouseScroll(dx, dy) { return result({ type: 'mouse.scroll', dx, dy }); },
    sendMouseZoom(steps) { return result({ type: 'mouse.zoom', steps }); },
    sendMouseClick(button, clicks = 1) { return result({ type: 'mouse.click', button, clicks }); },
    sendMouseButton(action, button) { return result({ type: 'mouse.button', action, button }); },
    // A public showcase has no transcription models or recording backend.
    async loadModels() { return { models: [], default_model: '' }; },
    async uploadAudio() { throw new Error('Voice transcription needs the local Cortext backend.'); },
    dispose() { messages.clear(); },
  };
}
