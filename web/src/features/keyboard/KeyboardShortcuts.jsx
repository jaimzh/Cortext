import { useId, useState } from 'react';
import './Keyboard.css';

const keys = [
  ['tab', 'Tab'],
  ['esc', 'Esc'],
  ['enter', 'Enter'],
  ['backspace', 'Back'],
  ['left', '\u2190'],
  ['up', '\u2191'],
  ['down', '\u2193'],
  ['right', '\u2192'],
];
const desktop = [
  ['ctrl_win_left', 'Desk \u2190'],
  ['win_tab', 'Win+Tab'],
  ['ctrl_win_right', 'Desk \u2192'],
];
const advanced = [
  ['ctrl_a', 'Ctrl+A'],
  ['ctrl_z', 'Ctrl+Z'],
  ['shift_enter', 'Shift+Enter'],
  ['ctrl_s', 'Ctrl+S'],
  ['ctrl_c', 'Ctrl+C'],
  ['ctrl_v', 'Ctrl+V'],
];

export default function KeyboardShortcuts({
  onPress,
  onSpace = () => onPress('space', false),
  disabled = false,
}) {
  const [moreKeys, setMoreKeys] = useState(false);
  const advancedId = useId();
  function buttons(items, shortcut = false) {
    return items.map(([value, label]) => (
      <button
        key={value}
        className="shortcut-button"
        type="button"
        disabled={disabled}
        onClick={() => onPress(value, shortcut)}
      >
        <span className="button-label">{label}</span>
      </button>
    ));
  }
  return (
    <>
      <div className="shortcut-bar" aria-label="Keyboard shortcuts">
        {buttons(keys)}
      </div>
      <div className="shortcut-bar desktop-shortcuts" aria-label="Desktop shortcuts">
        {buttons(desktop, true)}
      </div>
      <button
        className="more-keys-toggle"
        type="button"
        aria-expanded={moreKeys}
        aria-controls={advancedId}
        onClick={() => setMoreKeys((value) => !value)}
      >
        <span className="button-label">{moreKeys ? 'Hide keys' : 'More keys'}</span>
      </button>
      <div
        id={advancedId}
        className="shortcut-bar advanced-shortcuts"
        aria-label="Advanced keyboard shortcuts"
        hidden={!moreKeys}
      >
        {buttons(advanced, true)}
        <button className="shortcut-button" type="button" disabled={disabled} onClick={onSpace}>
          <span className="button-label">Space</span>
        </button>
        <button
          className="shortcut-button"
          type="button"
          disabled={disabled}
          title="Open Windows Start menu"
          onClick={() => onPress('win', false)}
        >
          <span className="button-label">Win</span>
        </button>
      </div>
    </>
  );
}
