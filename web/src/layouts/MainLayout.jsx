import { useCallback, useEffect, useState } from 'react';
import Mouse from '../features/mouse/Mouse.jsx';
import Keyboard from '../features/keyboard/Keyboard.jsx';
import Voice from '../features/voice/Voice.jsx';
import Controller from '../features/controller/Controller.jsx';
import './MainLayout.css';

export default function MainLayout({ api }) {
    const [view, setView] = useState('workspace');
    const [feedback, setFeedback] = useState({ message: 'Ready', result: '' });
    const report = useCallback((message, result = '') => setFeedback({ message, result }), []);

    useEffect(() => {
        document.body.classList.toggle('controller-mode', view === 'controller');
        return () => document.body.classList.remove('controller-mode');
    }, [view]);

    function selectView(next) {
        setView(next);
        report('Ready');
    }

    return (
        <main>
            <h1 className="brand">CORTEXT</h1>
            <p className="tagline">Your phone, at the cursor.</p>
            <div className="controls">
                <nav className="mode-switch" aria-label="Input workspace">
                    {[['workspace', 'Mouse + Keyboard'], ['voice', 'Voice'], ['controller', 'Controller']].map(([id, label]) => (
                        <button key={id} type="button" className={`mode-button ${view === id ? 'active' : ''}`}
                            aria-pressed={view === id} onClick={() => selectView(id)}>
                            <span className="button-label">{label}</span>
                        </button>
                    ))}
                </nav>
                {/* Keep the text draft and sensitivity when switching views. */}
                <div className="input-workspace" hidden={view !== 'workspace'}>
                    <Mouse api={api} report={report} active={view === 'workspace'} />
                    <Keyboard api={api} report={report} />
                </div>
                {view === 'voice' && <Voice api={api} report={report} />}
                {view === 'controller' && <Controller api={api} report={report} />}
                <p id="status" role="status" aria-live="polite">{feedback.message}</p>
                <pre id="result">{feedback.result}</pre>
            </div>
        </main>
    );
}
