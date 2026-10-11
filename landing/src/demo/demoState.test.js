import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDemoInput, initialDemoState } from './demoState.js';
import { createDemoApi } from './createDemoApi.js';

test('real keyboard API calls reach the laptop simulation', async () => {
  let state = initialDemoState();
  const api = createDemoApi((event) => {
    state = applyDemoInput(state, event);
  });
  await api.sendKeyboardText('Hello');
  api.sendLiveKeyboardInput({ delete: 2, text: 'p!' });
  assert.equal(state.text, 'Help!');
  await api.sendKeyboardKey('space');
  await api.sendKeyboardKey('enter');
  assert.equal(state.text, 'Help! \n');
});

test('select all, replace, and backspace update the virtual note', () => {
  let state = { ...initialDemoState(), text: 'Old note' };
  state = applyDemoInput(state, { type: 'keyboard.shortcut', shortcut: 'ctrl+a' });
  state = applyDemoInput(state, { type: 'keyboard.input', text: 'New' });
  state = applyDemoInput(state, { type: 'keyboard.key', key: 'backspace' });
  assert.equal(state.text, 'Ne');
});

test('cursor movement stays inside the laptop and rejects invalid values', () => {
  const state = applyDemoInput(initialDemoState(), { type: 'mouse.move', dx: 10000, dy: -10000 });
  assert.equal(state.x, 98);
  assert.equal(state.y, 2);
  assert.equal(applyDemoInput(state, { type: 'mouse.move', dx: NaN, dy: 1 }), state);
});

test('left click hits a virtual toolbar button and right click opens its menu', () => {
  let state = { ...initialDemoState(), x: 60, text: 'Clear me' };
  state = applyDemoInput(state, { type: 'mouse.click', button: 'left' });
  assert.equal(state.text, '');
  assert.equal(state.feedback, 'Note cleared');
  state = applyDemoInput(state, { type: 'mouse.click', button: 'right' });
  assert.equal(state.menu, true);
  state = applyDemoInput(state, { type: 'keyboard.key', key: 'esc' });
  assert.equal(state.menu, false);
});

test('zoom and scroll remain within useful demo bounds', () => {
  let state = applyDemoInput(initialDemoState(), { type: 'mouse.zoom', steps: 999 });
  assert.equal(state.zoom, 1.8);
  state = applyDemoInput(state, { type: 'mouse.scroll', dy: 10000 });
  assert.equal(state.scroll, 4000);
});

test('demo transport reports a connected keyboard and virtual gamepad', () => {
  const api = createDemoApi(() => {});
  let connected = false;
  let message;
  api.onInputConnection((value) => {
    connected = value;
  });
  api.onControllerMessage((value) => {
    message = value;
  });
  api.sendControllerEvent({ type: 'gamepad.connect' });
  assert.equal(connected, true);
  assert.equal(message.type, 'gamepad.status');
});
