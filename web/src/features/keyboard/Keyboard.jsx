import { useRef, useState } from 'react';
import KeyboardShortcuts from './KeyboardShortcuts.jsx';
import './Keyboard.css';

export default function Keyboard({ api, report }) {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const sending = useRef(false);

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

    return (
        <section id="keyboardPanel" className="panel" aria-label="Keyboard">
            <div className="keyboard-input-wrap">
                <textarea id="keyboardText" aria-label="Text to send" value={text} onChange={event => setText(event.target.value)}
                    placeholder="Type here, then send it to your computer." />
                <button className="quick-send-button" type="button" aria-label="Send text" aria-busy={busy} disabled={busy} onClick={sendText}>
                    <span className="button-label">↵</span>
                </button>
            </div>
            <KeyboardShortcuts onPress={press} />
        </section>
    );
}
