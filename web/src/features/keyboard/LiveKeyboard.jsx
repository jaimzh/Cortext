import { useEffect, useRef, useState } from 'react';
import { EraserIcon } from '@phosphor-icons/react';
import { keyboardEdit } from './liveKeyboardInput.js';
import './LiveKeyboard.css';

const keys = [['tab', 'Tab'], ['esc', 'Esc'], ['enter', 'Enter'], ['backspace', 'Back'],
    ['left', '←'], ['up', '↑'], ['down', '↓'], ['right', '→']];

export default function LiveKeyboard({ api, report }) {
    const [connected, setConnected] = useState(false);
    const [text, setText] = useState('');
    const [failed, setFailed] = useState(false);
    const committed = useRef('');
    const available = useRef(false);

    function clearBuffer() {
        committed.current = '';
        setText('');
        setFailed(false);
    }

    useEffect(() => {
        const stopConnection = api.onInputConnection(value => {
            available.current = value;
            setConnected(value);
            if (!value) clearBuffer();
        });
        const stopMessages = api.onControllerMessage(message => {
            if (message.type === 'error' && message.source === 'keyboard.input') {
                setFailed(true);
                report('Live keyboard error.', message.message);
            }
        });
        api.connectInputSocket();
        return () => { stopConnection(); stopMessages(); };
    }, [api, report]);

    function update(next) {
        if (!available.current || failed) return;
        const edit = keyboardEdit(committed.current, next);
        if (!edit.delete && !edit.text) { setText(next); return; }
        if (edit.delete > 10000 || edit.text.length > 10000) {
            report('Live keyboard error.', 'This edit is too large. Paste it using the regular keyboard.');
            setText(committed.current);
            return;
        }
        if (!api.sendLiveKeyboardInput(edit)) {
            report('Live keyboard error.', 'Connection lost. Reconnect before typing.');
            clearBuffer();
            return;
        }
        committed.current = next;
        setText(next);
    }

    function press(key) {
        if (!available.current || failed) return;
        if (!api.sendLiveKeyboardKey(key)) {
            report('Live keyboard error.', 'Connection lost. Reconnect before typing.');
            return;
        }
        // Special keys can move the computer's caret; start a fresh local buffer.
        clearBuffer();
    }

    return <section className="panel live-keyboard-panel" aria-label="Live keyboard">
        <div className="live-keyboard-toolbar">
            <span role="status" className={`live-keyboard-status ${connected && !failed ? 'connected' : ''}`}>
                {failed ? 'Clear to retry' : connected ? 'Live typing' : 'Disconnected'}
            </span>
            <button type="button" className="live-keyboard-clear" aria-label="Clear typing buffer"
                title="Clear the local typing buffer" onClick={clearBuffer}><EraserIcon size={18} aria-hidden="true" /></button>
        </div>
        <textarea aria-label="Live keyboard input" value={text} disabled={!connected || failed}
            placeholder={connected ? 'Type here to send instantly.' : 'Connect to your computer to type.'}
            autoCapitalize="off" autoComplete="off" spellCheck={false}
            // Phone keyboards can compose an entire word. Stream each input
            // value and reconcile replacements instead of waiting for commit.
            onInput={event => update(event.currentTarget.value)}
            onChange={event => update(event.target.value)}
            onCompositionEnd={event => update(event.currentTarget.value)} />
        <div className="shortcut-bar" aria-label="Live keyboard shortcuts">
            {keys.map(([key, label]) => <button key={key} type="button" className="shortcut-button"
                disabled={!connected || failed} onClick={() => press(key)}><span className="button-label">{label}</span></button>)}
        </div>
        <button type="button" className="shortcut-button live-space-button" disabled={!connected || failed}
            onClick={() => update(committed.current + ' ')}><span className="button-label">Space</span></button>
    </section>;
}
