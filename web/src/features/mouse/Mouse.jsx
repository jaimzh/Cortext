import { useRef } from 'react';
import { useMouse } from './useMouse.js';
import './Mouse.css';

export default function Mouse({ api, report, active = true }) {
    const panelRef = useRef(null);
    useMouse(panelRef, api, report, active);
    return (
        <section ref={panelRef} id="trackpadPanel" className="panel" aria-label="Mouse">
                <div className="trackpad-wrap">
                    <div id="trackpadPad" className="trackpad-pad" role="application" aria-label="Trackpad">
                        <div className="trackpad-hint">
                            Move with one finger<br />
                            Double-tap to click &middot; triple-tap to double-click<br />
                            Double-tap and drag to move things<br />
                            Two fingers to scroll
                        </div>
                    </div>
                    <div id="trackpadScrollBar" className="trackpad-scroll-bar" role="application" aria-label="Touch scroll bar">
                        <div className="scroll-edge top" aria-hidden="true"></div>
                        <div className="scroll-thumb" aria-hidden="true"></div>
                        <div className="scroll-edge bottom" aria-hidden="true"></div>
                    </div>
                </div>
                <div className="trackpad-buttons" aria-label="Mouse buttons">
                    <button className="shortcut-button" type="button" data-click="left">
                        <span className="button-label">Left</span>
                    </button>
                    <button className="shortcut-button" type="button" data-click="right">
                        <span className="button-label">Right</span>
                    </button>
                </div>
                <div className="trackpad-settings" aria-label="Trackpad settings">
                    <label htmlFor="sensitivitySlider">Sensitivity</label>
                    <output id="sensitivityValue">1.8x</output>
                    <input id="sensitivitySlider" type="range" min="0.5" max="3" step="0.1" defaultValue="1.8" />
                </div>
            </section>
    );
}
