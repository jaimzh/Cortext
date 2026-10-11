const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function initialDemoState() {
  return { x: 28, y: 18, text: '', selected: false, zoom: 1, scroll: 0, clicks: 0, menu: false, feedback: 'Try Left to open a note, or type from the keyboard.', gamepad: null };
}

export function applyDemoInput(state, event) {
  if (!event || typeof event.type !== 'string') return state;
  switch (event.type) {
    case 'demo.clear-note':
      return { ...state, text: '', selected: false, scroll: 0, menu: false, feedback: 'New note opened. Try typing below.' };
    case 'mouse.move':
      if (!Number.isFinite(event.dx) || !Number.isFinite(event.dy)) return state;
      return { ...state, x: clamp(state.x + event.dx / 6, 2, 98), y: clamp(state.y + event.dy / 3.6, 2, 98) };
    case 'mouse.scroll':
      return Number.isFinite(event.dy) ? { ...state, scroll: clamp(state.scroll + event.dy, 0, 4000), feedback: 'Scrolled the note' } : state;
    case 'mouse.zoom':
      return Number.isFinite(event.steps) ? { ...state, zoom: clamp(state.zoom + event.steps * .1, .6, 1.8), feedback: event.steps > 0 ? 'Zoomed in' : 'Zoomed out' } : state;
    case 'mouse.button':
      return { ...state, feedback: `${event.button} mouse button ${event.action}` };
    case 'mouse.click': {
      if (event.button === 'right') return { ...state, menu: !state.menu, clicks: state.clicks + 1, feedback: 'Right-click menu' };
      const toolbar = state.y >= 10 && state.y <= 27;
      const clear = toolbar && state.x >= 50 && state.x <= 83;
      const open = toolbar && state.x >= 7 && state.x <= 43;
      return { ...state, menu: false, clicks: state.clicks + 1, ...(clear || open ? { text: '', selected: false, scroll: 0 } : {}), feedback: clear ? 'Note cleared' : open ? 'New note opened. Try typing below.' : 'Clicked the note' };
    }
    case 'keyboard.input': {
      const deletion = Number.isInteger(event.delete) ? clamp(event.delete, 0, state.text.length) : 0;
      const text = typeof event.text === 'string' ? event.text : '';
      const previous = state.selected ? '' : state.text.slice(0, state.text.length - deletion);
      return { ...state, text: (previous + text).slice(-4000), selected: false, feedback: 'Text received from your phone' };
    }
    case 'keyboard.key': {
      const key = String(event.key).toLowerCase();
      const characters = { enter: '\n', space: ' ', tab: '    ' };
      if (key in characters) return applyDemoInput(state, { type: 'keyboard.input', text: characters[key] });
      if (key === 'backspace' || key === 'back') return applyDemoInput(state, { type: 'keyboard.input', delete: state.selected ? state.text.length : 1 });
      return { ...state, menu: key === 'escape' || key === 'esc' ? false : state.menu, feedback: `${event.key} pressed` };
    }
    case 'keyboard.shortcut':
      if (event.shortcut === 'ctrl+a') return { ...state, selected: true, feedback: 'Selected the note text' };
      return { ...state, feedback: `${event.shortcut} shortcut received` };
    default:
      if (event.type.startsWith('gamepad.')) return { ...state, gamepad: event, feedback: event.type === 'gamepad.connect' ? 'Demo controller ready' : `Controller: ${event.button || event.side || 'input'}${event.action ? ` ${event.action}` : ''}` };
      return state;
  }
}
