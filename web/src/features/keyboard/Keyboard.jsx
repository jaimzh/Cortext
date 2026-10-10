import { useRef, useState } from 'react';
import './Keyboard.css';

const keys = [['tab', 'Tab'], ['esc', 'Esc'], ['enter', 'Enter'], ['backspace', 'Back'],
    ['left', '←'], ['up', '↑'], ['down', '↓'], ['right', '→']];
const desktop = [['ctrl_win_left', 'Desk ←'], ['win_tab', 'Win+Tab'], ['ctrl_win_right', 'Desk →']];
const advanced = [['ctrl_a', 'Ctrl+A'], ['ctrl_z', 'Ctrl+Z'], ['shift_enter', 'Shift+Enter'],
    ['ctrl_s', 'Ctrl+S'], ['ctrl_c', 'Ctrl+C'], ['ctrl_v', 'Ctrl+V']];

export default function Keyboard({ api, report }) {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const sending = useRef(false);
    const [moreKeys, setMoreKeys] = useState(false);

    async function sendText() {
        if (sending.current) return;
        if (!text.trim()) return report('Type something first.');
        const submitted = text;
        sending.current = true;
        setBusy(true);
        report('Sending text...');
        try {
            const data = await api.sendKeyboardText(submitted);
            report(data.message || 'Text inserted', submitted);
            setText(current => current === submitted ? '' : current);
        } catch (error) {
            report('Something went wrong.', error.message);
        } finally {
            sending.current = false;
            setBusy(false);
        }
    }

    async function press(value, shortcut = false) {
        try {
            const data = await (shortcut ? api.sendKeyboardShortcut(value) : api.sendKeyboardKey(value));
            report(data.message || 'Key pressed', value);
        } catch (error) {
            report('Something went wrong.', error.message);
        }
    }

    function buttons(items, shortcut = false) {
        return items.map(([value, label]) => (
            <button key={value} className="shortcut-button" type="button" onClick={() => press(value, shortcut)}>
                <span className="button-label">{label}</span>
            </button>
        ));
    }

    return (
        <section id="keyboardPanel" className="panel" aria-label="Keyboard">
            <div className="keyboard-input-wrap">
                <textarea id="keyboardText" aria-label="Text to send" value={text} onChange={event => setText(event.target.value)}
                    placeholder="Type here, then send it to your computer." />
                <button className="quick-send-button" type="button" aria-label="Send text" disabled={busy} onClick={sendText}>
                    <span className="button-label">↵</span>
                </button>
            </div>
            <div className="shortcut-bar" aria-label="Keyboard shortcuts">{buttons(keys)}</div>
            <div className="shortcut-bar desktop-shortcuts" aria-label="Desktop shortcuts">{buttons(desktop, true)}</div>
            <button className="more-keys-toggle" type="button" aria-expanded={moreKeys}
                aria-controls="advancedShortcuts" onClick={() => setMoreKeys(!moreKeys)}>
                <span className="button-label">{moreKeys ? 'Hide keys' : 'More keys'}</span>
            </button>
            <div id="advancedShortcuts" className="shortcut-bar advanced-shortcuts" aria-label="Advanced keyboard shortcuts" hidden={!moreKeys}>
                {buttons(advanced, true)}
            </div>
            <button type="button" disabled={busy} onClick={sendText}>
                <span className="button-label">{busy ? 'Sending...' : 'Send Text'}</span>
            </button>
        </section>
    );
}
