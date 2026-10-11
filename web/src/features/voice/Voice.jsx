import { useState } from 'react';
import { useVoice } from './useVoice.js';
import './Voice.css';

export default function Voice({ api, report }) {
    const voice = useVoice(api, report);
    const recording = voice.phase === 'recording';
    const busy = voice.phase !== 'idle';
    const [returnBusy, setReturnBusy] = useState(false);

    async function pressReturn() {
        if (returnBusy) return;
        setReturnBusy(true);
        try {
            await api.sendKeyboardKey('enter');
            report('Return pressed');
        } catch (error) {
            report('Key press failed.', error.message);
        } finally {
            setReturnBusy(false);
        }
    }
    return (
        <section id="voicePanel" className="panel voice-panel" aria-label="Voice">
            <div className="voice-actions">
            <button type="button" className={`voice-record-button ${recording ? 'recording' : ''}`}
                disabled={(!recording && busy) || !voice.model} onClick={voice.toggleRecording}>
                <span className="button-label">{recording ? 'Stop Recording' : busy ? 'Please wait...' : 'Start Recording'}</span>
            </button>
            <button type="button" className="voice-return-button" aria-label="Return" title="Return (Enter)"
                disabled={returnBusy} aria-busy={returnBusy} onClick={pressReturn}>
                <span aria-hidden="true">↵</span>
            </button>
            </div>
            <label><input type="checkbox" checked={voice.paste} disabled={busy}
                onChange={event => voice.setPaste(event.target.checked)} />Paste after transcription</label>
            <label className="field">
                <span>Transcription model</span>
                <span className="select-wrap">
                    <select value={voice.model} disabled={busy} onChange={event => voice.setModel(event.target.value)}>
                        {!voice.model && <option value="">No installed models</option>}
                        {voice.models.map(item => <option key={item.name} value={item.name} disabled={!item.installed}>
                            {item.label} - {item.installed ? item.description : 'download from TUI'}
                        </option>)}
                    </select>
                </span>
            </label>
            <textarea className="voice-transcript" aria-label="Voice transcript" readOnly value={voice.transcript}
                placeholder={voice.phase === 'uploading' ? 'Transcribing…' : 'Your transcribed text will appear here.'} />
        </section>
    );
}
