import { useEffect, useRef } from 'react';
import { useController } from './useController.js';
import { useHudEditor } from './useHudEditor.js';
import { HUD_IDS } from './hudLayout.js';
import './Controller.css';

export default function Controller({ api, report, editing = false, onFinishEditing }) {
    const panelRef = useRef(null);
    const shellRef = useRef(null);
    const editor = useHudEditor(shellRef, editing, onFinishEditing);
    useController(panelRef, api, report);
    useEffect(() => {
        if (editing) panelRef.current.dispatchEvent(new Event('controller:edit'));
    }, [editing]);
    return (
        <section ref={panelRef} id="controllerPanel" className="panel controller-panel" data-editing={editing}>
            {editing && <div className="hud-editor-toolbar" aria-label="Layout settings">
                <label className="hud-control-picker">Control
                    <select aria-label="Select control" value={editor.selected} onChange={event => editor.setSelected(event.target.value)}>
                        {HUD_IDS.map(id => <option key={id} value={id}>{id === 'stick' ? 'Joystick' : id === 'space' ? 'Select' : id === 'start' ? 'Start' : id.toUpperCase()}</option>)}
                    </select>
                </label>
                <label className="hud-size-picker">Size
                    <input aria-label="Control size" type="range" min="60" max="160" step="5" value={Math.round(editor.scale * 100)}
                        onChange={event => editor.resize(Number(event.target.value) / 100)} />
                    <output>{Math.round(editor.scale * 100)}%</output>
                </label>
                <button type="button" className="hud-editor-button" onClick={editor.reset}>Reset</button>
                <button type="button" className="hud-editor-button" onClick={editor.cancel}>Cancel</button>
            </div>}
            <div className="controller-viewport">
                <div ref={shellRef} className="controller-shell" role="application" aria-label="Game controller"
                    data-custom-layout={Boolean(editor.layout)} {...editor.handlers}>
                    <div className="controller-cluster movement-cluster" aria-label="Movement controls">
                        <button {...editor.props('lt')} className="controller-button shoulder-button" type="button" data-gamepad-trigger="left"
                            title="Slide down to increase trigger pressure; release to reset">
                            <span className="button-label">LT</span>
                        </button>
                        <button {...editor.props('lb')} className="controller-button shoulder-button" type="button" data-gamepad-button="lb">
                            <span className="button-label">LB</span>
                        </button>
                        <div {...editor.props('stick')} tabIndex={editing ? 0 : undefined} id="leftStick" className="stick-pad" data-gamepad-stick="left" aria-label="Left stick">
                            <div className="stick-knob" aria-hidden="true"></div>
                        </div>
                    </div>

                    <div className="controller-center" aria-label="System controls">
                        <button {...editor.props('space')} className="controller-button system-button" type="button" data-gamepad-button="back">
                            <span className="button-label">Select</span>
                        </button>
                        <button {...editor.props('start')} className="controller-button system-button" type="button" data-gamepad-button="start">
                            <span className="button-label">Start</span>
                        </button>
                    </div>

                    <div className="controller-cluster action-cluster" aria-label="Action controls">
                        <button {...editor.props('rt')} className="controller-button shoulder-button" type="button" data-gamepad-trigger="right"
                            title="Slide down to increase trigger pressure; release to reset">
                            <span className="button-label">RT</span>
                        </button>
                        <button {...editor.props('rb')} className="controller-button shoulder-button" type="button" data-gamepad-button="rb">
                            <span className="button-label">RB</span>
                        </button>
                        <button {...editor.props('y')} className="controller-button action-button y-button" type="button" data-gamepad-button="y">
                            <span className="button-label">Y</span>
                        </button>
                        <button {...editor.props('x')} className="controller-button action-button x-button" type="button" data-gamepad-button="x">
                            <span className="button-label">X</span>
                        </button>
                        <button {...editor.props('b')} className="controller-button action-button b-button" type="button" data-gamepad-button="b">
                            <span className="button-label">B</span>
                        </button>
                        <button {...editor.props('a')} className="controller-button action-button a-button" type="button" data-gamepad-button="a">
                            <span className="button-label">A</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
