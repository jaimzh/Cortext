import { useCallback, useEffect, useRef, useState } from 'react';
import Mouse from '../features/mouse/Mouse.jsx';
import Keyboard from '../features/keyboard/Keyboard.jsx';
import Voice from '../features/voice/Voice.jsx';
import Controller from '../features/controller/Controller.jsx';
import ControllerFullscreenButton from '../features/controller/ControllerFullscreenButton.jsx';
import InputRibbon from './InputRibbon.jsx';
import ResizableWorkspace from './ResizableWorkspace.jsx';
import AppNavbar from './AppNavbar.jsx';
import About from '../pages/About.jsx';
import './MainLayout.css';

export default function MainLayout({ api, showNavbar = false }) {
    const [view, setView] = useState('workspace');
    const [input, setInput] = useState('keyboard');
    const previousView = useRef('workspace');
    const logoRef = useRef(null);
    const fullscreenButtonRef = useRef(null);
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
            {showNavbar && <AppNavbar buttonRef={logoRef} onAbout={() => {
                if (view === 'about') return;
                previousView.current = view;
                selectView('about');
            }} />}
            <div className="controls">
                {view === 'about' && <About onBack={() => {
                    selectView(previousView.current);
                    logoRef.current.focus();
                }} />}
                <div className="workspace-toolbar" hidden={view === 'about'}>
                <nav className="mode-switch" aria-label="Input workspace">
                    {[['workspace', 'Mouse + Input'], ['controller', 'Controller']].map(([id, label]) => (
                        <button key={id} type="button" className={`mode-button ${view === id ? 'active' : ''}`}
                            aria-pressed={view === id} onClick={() => selectView(id)}>
                            <span className="button-label">{label}</span>
                        </button>
                    ))}
                </nav>
                {view === 'controller' && <ControllerFullscreenButton buttonRef={fullscreenButtonRef} />}
                </div>
                {/* Keep the text draft and sensitivity when switching views. */}
                <ResizableWorkspace active={view === 'workspace'}
                    mouse={<Mouse api={api} report={report} active={view === 'workspace'} />}>
                    <div className="workspace-input">
                        <InputRibbon selected={input} onSelect={next => { setInput(next); report('Ready'); }} />
                        <div id="keyboard-input-panel" role="tabpanel" aria-labelledby="keyboard-tab" hidden={input !== 'keyboard'}>
                            <Keyboard api={api} report={report} />
                        </div>
                        <div id="voice-input-panel" role="tabpanel" aria-labelledby="voice-tab" hidden={input !== 'voice'}>
                            {view === 'workspace' && input === 'voice' && <Voice api={api} report={report} />}
                        </div>
                    </div>
                </ResizableWorkspace>
                {view === 'controller' && <Controller api={api} report={report} fullscreenButtonRef={fullscreenButtonRef} />}
                {view !== 'about' && /failed|error|wrong|could not|type something/i.test(feedback.message) && (
                    <p className="input-error" role="alert">{feedback.message}{feedback.result ? ` ${feedback.result}` : ''}</p>
                )}
            </div>
        </main>
    );
}
