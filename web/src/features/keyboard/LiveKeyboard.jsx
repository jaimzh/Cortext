import { useEffect, useRef, useState } from 'react';
import { TrashIcon } from '@phosphor-icons/react';
import { keyboardEdit } from './liveKeyboardInput.js';
import KeyboardShortcuts from './KeyboardShortcuts.jsx';
import './LiveKeyboard.css';

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
    const stopConnection = api.onInputConnection((value) => {
      available.current = value;
      setConnected(value);
      if (!value) clearBuffer();
    });
    const stopMessages = api.onControllerMessage((message) => {
      if (
        message.type === 'error' &&
        ['keyboard.input', 'keyboard.key', 'keyboard.shortcut'].includes(message.source)
      ) {
        setFailed(true);
        report('Live keyboard error.', message.message);
      }
    });
    api.connectInputSocket();
    return () => {
      stopConnection();
      stopMessages();
    };
  }, [api, report]);

  function update(next) {
    if (!available.current || failed) return;
    const edit = keyboardEdit(committed.current, next);
    if (!edit.delete && !edit.text) {
      setText(next);
      return;
    }
    if (edit.delete > 10000 || edit.text.length > 10000) {
      report(
        'Live keyboard error.',
        'This edit is too large. Paste it using the regular keyboard.',
      );
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

  function press(key, shortcut = false) {
    if (!available.current || failed) return;
    if (!(shortcut ? api.sendLiveKeyboardShortcut(key) : api.sendLiveKeyboardKey(key))) {
      report('Live keyboard error.', 'Connection lost. Reconnect before typing.');
      return;
    }
    // Special keys can move the computer's caret; start a fresh local buffer.
    clearBuffer();
  }

  return (
    <section className="panel live-keyboard-panel" aria-label="Live keyboard">
      <div className="live-keyboard-toolbar">
        <span
          role="status"
          className={`live-keyboard-status ${connected && !failed ? 'connected' : ''}`}
        >
          {failed ? 'Clear to retry' : connected ? 'Live typing' : 'Disconnected'}
        </span>
        <button
          type="button"
          className="live-keyboard-clear"
          aria-label="Clear typing buffer"
          title="Clear the local typing buffer"
          onClick={clearBuffer}
        >
          <TrashIcon size={18} aria-hidden="true" />
        </button>
      </div>
      <textarea
        aria-label="Live keyboard input"
        value={text}
        disabled={!connected || failed}
        placeholder={
          connected ? 'Type here to send instantly.' : 'Connect to your computer to type.'
        }
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        // Phone keyboards can compose an entire word. Stream each input
        // value and reconcile replacements instead of waiting for commit.
        onInput={(event) => update(event.currentTarget.value)}
        onChange={(event) => update(event.target.value)}
        onCompositionEnd={(event) => update(event.currentTarget.value)}
      />
      <KeyboardShortcuts
        onPress={press}
        onSpace={() => update(committed.current + ' ')}
        disabled={!connected || failed}
      />
    </section>
  );
}
