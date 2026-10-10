import { useRef } from 'react';
import { useController } from './useController.js';
import './Controller.css';

export default function Controller({ api, report, fullscreenButtonRef }) {
    const panelRef = useRef(null);
    useController(panelRef, api, report, fullscreenButtonRef);
    return (
        <section ref={panelRef} id="controllerPanel" className="panel controller-panel">
            <div className="controller-viewport">
                <div className="controller-shell" role="application" aria-label="Game controller">
                    <div className="controller-cluster movement-cluster" aria-label="Movement controls">
                        <button className="controller-button shoulder-button" type="button" data-gamepad-trigger="left">
                            <span className="button-label">LT</span>
                        </button>
                        <button className="controller-button shoulder-button" type="button" data-gamepad-button="lb">
                            <span className="button-label">LB</span>
                        </button>
                        <div id="leftStick" className="stick-pad" data-gamepad-stick="left" aria-label="Left stick">
                            <div className="stick-knob" aria-hidden="true"></div>
                        </div>
                    </div>

                    <div className="controller-center" aria-label="System controls">
                        <button className="controller-button system-button" type="button" data-keyboard-key="space">
                            <span className="button-label">Space</span>
                        </button>
                        <button className="controller-button system-button" type="button" data-gamepad-button="start">
                            <span className="button-label">Start</span>
                        </button>
                    </div>

                    <div className="controller-cluster action-cluster" aria-label="Action controls">
                        <button className="controller-button shoulder-button" type="button" data-gamepad-trigger="right">
                            <span className="button-label">RT</span>
                        </button>
                        <button className="controller-button shoulder-button" type="button" data-gamepad-button="rb">
                            <span className="button-label">RB</span>
                        </button>
                        <button className="controller-button action-button y-button" type="button" data-gamepad-button="y">
                            <span className="button-label">Y</span>
                        </button>
                        <button className="controller-button action-button x-button" type="button" data-gamepad-button="x">
                            <span className="button-label">X</span>
                        </button>
                        <button className="controller-button action-button b-button" type="button" data-gamepad-button="b">
                            <span className="button-label">B</span>
                        </button>
                        <button className="controller-button action-button a-button" type="button" data-gamepad-button="a">
                            <span className="button-label">A</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
