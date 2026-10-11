import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Mouse from '../features/mouse/Mouse.jsx';
import Keyboard from '../features/keyboard/Keyboard.jsx';
import LiveKeyboard from '../features/keyboard/LiveKeyboard.jsx';
import Voice from '../features/voice/Voice.jsx';
import Controller from '../features/controller/Controller.jsx';
import ControllerOptions, { useControllerVisibility } from '../features/controller/ControllerOptions.jsx';
import FullscreenButton from './FullscreenButton.jsx';
import { useFullscreen } from './useFullscreen.js';
import { CheckIcon, PencilSimpleIcon, VibrateIcon, MouseIcon, GameControllerIcon } from '@phosphor-icons/react';
import { useHaptics } from '../hooks/useHaptics.js';
import InputRibbon from './InputRibbon.jsx';
import ResizableWorkspace from './ResizableWorkspace.jsx';
import CortextLogo from './CortextLogo.jsx';
import About from '../pages/About.jsx';
import './MainLayout.css';

export default function MainLayout({ api }) {
    const [view, setView] = useState('workspace');
    const [input, setInput] = useState('keyboard');
    const previousView = useRef('workspace');
    const logoRef = useRef(null);
    const restoreLogoFocus = useRef(false);
    useLayoutEffect(() => {
        if (view !== 'about' && restoreLogoFocus.current) {
            logoRef.current?.focus();
            restoreLogoFocus.current = false;
        }
    }, [view]);
    const { fullscreen, busy: fullscreenBusy, toggleFullscreen } = useFullscreen(view);
    const [editingController, setEditingController] = useState(false);
    const haptics = useHaptics();
    const [controllerVisibility, setControllerVisibility] = useControllerVisibility();
    const [feedback, setFeedback] = useState({ message: 'Ready', result: '' });
    const report = useCallback((message, result = '') => setFeedback({ message, result }), []);

    useEffect(() => {
        document.body.classList.toggle('controller-mode', view === 'controller');
        return () => document.body.classList.remove('controller-mode');
    }, [view]);

    function selectView(next) {
        setEditingController(false);
        setView(next);
        report('Ready');
    }

    return (
        <main>
            <div className="controls">
                {view === 'about' && <About onBack={() => {
                    restoreLogoFocus.current = true;
                    selectView(previousView.current);
                }} />}
                <div className="workspace-toolbar" hidden={view === 'about'}>
                <nav className="mode-switch" aria-label="Input workspace">
                    {[['workspace', 'Mouse + Input', MouseIcon], ['controller', 'Controller', GameControllerIcon]].map(([id, label, Icon]) => (
                        <button key={id} type="button" className={`mode-button ${view === id ? 'active' : ''}`}
                            aria-label={label} title={label} aria-pressed={view === id} onClick={() => selectView(id)}>
                            <Icon size={22} aria-hidden="true" />
                        </button>
                    ))}
                </nav>
                <CortextLogo compact buttonRef={logoRef} onAbout={() => {
                    previousView.current = view;
                    selectView('about');
                }} />
                <div className="controller-toolbar-actions">
                    {view === 'controller' && <ControllerOptions visibility={controllerVisibility} onChange={setControllerVisibility} />}
                    <button type="button" className="controller-edit-button"
                        aria-label="Haptic feedback" aria-pressed={haptics.enabled}
                        title={`Haptic feedback ${haptics.enabled ? 'on' : 'off'}`}
                        onClick={haptics.toggle}>
                        <VibrateIcon size={18} aria-hidden="true" />
                    </button>
                    {view === 'controller' && <button type="button" className="controller-edit-button" aria-pressed={editingController}
                        aria-label={editingController ? 'Save layout' : 'Edit layout'}
                        title={editingController ? 'Save layout' : 'Edit layout'}
                        onClick={() => setEditingController(value => !value)}>
                        {editingController ? <CheckIcon size={18} aria-hidden="true" /> : <PencilSimpleIcon size={18} aria-hidden="true" />}
                    </button>}
                    <FullscreenButton active={fullscreen} busy={fullscreenBusy} onToggle={toggleFullscreen} />
                </div>
                </div>
                {/* Keep the text draft and sensitivity when switching views. */}
                <ResizableWorkspace active={view === 'workspace'}
                    mouse={<Mouse api={api} report={report} active={view === 'workspace'} onHapticPress={haptics.press} />}>
                    <div className="workspace-input">
                        <InputRibbon selected={input} onSelect={next => { setInput(next); report('Ready'); }} />
                        <div id="keyboard-input-panel" role="tabpanel" aria-labelledby="keyboard-tab" hidden={input !== 'keyboard'}>
                            <Keyboard api={api} report={report} />
                        </div>
                        <div id="live-keyboard-input-panel" role="tabpanel" aria-labelledby="live-keyboard-tab" hidden={input !== 'live-keyboard'}>
                            {view === 'workspace' && input === 'live-keyboard' && <LiveKeyboard api={api} report={report} />}
                        </div>
                        <div id="voice-input-panel" role="tabpanel" aria-labelledby="voice-tab" hidden={input !== 'voice'}>
                            {view === 'workspace' && input === 'voice' && <Voice api={api} report={report} />}
                        </div>
                    </div>
                </ResizableWorkspace>
                {view === 'controller' && <Controller api={api} report={report}
                    visibility={controllerVisibility}
                    onHapticPress={haptics.press}
                    editing={editingController} onFinishEditing={() => setEditingController(false)} />}
                {view !== 'about' && /failed|error|wrong|could not|type something/i.test(feedback.message) && (
                    <p className="input-error" role="alert">{feedback.message}{feedback.result ? ` ${feedback.result}` : ''}</p>
                )}
            </div>
        </main>
    );
}
