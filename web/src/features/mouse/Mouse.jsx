import { useEffect, useRef, useState } from 'react';
import { GearSixIcon } from '@phosphor-icons/react';
import { useMouse } from './useMouse.js';
import './Mouse.css';

export default function Mouse({ api, report, active = true }) {
    const panelRef = useRef(null);
    const settingsRef = useRef(null);
    const settingsButtonRef = useRef(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    useMouse(panelRef, api, report, active);
    useEffect(() => {
        if (!active) setSettingsOpen(false);
    }, [active]);
    useEffect(() => {
        if (!settingsOpen) return;
        function dismiss(event) {
            if (!settingsRef.current.contains(event.target)) setSettingsOpen(false);
        }
        function escape(event) {
            if (event.key !== 'Escape') return;
            setSettingsOpen(false);
            settingsButtonRef.current.focus();
        }
        document.addEventListener('pointerdown', dismiss);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', dismiss);
            document.removeEventListener('keydown', escape);
        };
    }, [settingsOpen]);
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
                <div className="trackpad-actions">
                <div className="trackpad-buttons" aria-label="Mouse buttons">
                    <button className="shortcut-button" type="button" data-click="left">
                        <span className="button-label">Left</span>
                    </button>
                    <button className="shortcut-button" type="button" data-click="right">
                        <span className="button-label">Right</span>
                    </button>
                </div>
                <div ref={settingsRef} className="trackpad-settings">
                    <button ref={settingsButtonRef} className="trackpad-settings-button" type="button" aria-label="Mouse settings"
                        title="Mouse settings" aria-expanded={settingsOpen} aria-controls="mouseSensitivitySettings"
                        onClick={() => setSettingsOpen(value => !value)}>
                        <GearSixIcon size={20} aria-hidden="true" />
                    </button>
                    <div id="mouseSensitivitySettings" className="trackpad-settings-popover" hidden={!settingsOpen}>
                    <label htmlFor="sensitivitySlider">Sensitivity
                        <output id="sensitivityValue">1.8x</output>
                    </label>
                    <input id="sensitivitySlider" aria-label="Sensitivity" type="range" min="0.5" max="3" step="0.1" defaultValue="1.8" />
                    </div>
                </div>
                </div>
            </section>
    );
}
