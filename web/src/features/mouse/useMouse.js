import { useEffect } from 'react';
import { initTrackpad } from './trackpadEngine.js';

export function useMouse(panelRef, api, report, active) {
    useEffect(() => {
        if (!active) return;
        const panel = panelRef.current;
        return initTrackpad({
            trackpadPad: panel.querySelector("#trackpadPad"),
            trackpadScrollBar: panel.querySelector("#trackpadScrollBar"),
            sensitivitySlider: panel.querySelector("#sensitivitySlider"),
            sensitivityValue: panel.querySelector("#sensitivityValue"),
            mouseButtons: panel.querySelectorAll("[data-click]"),
            statusText: { set textContent(message) { report(message); } },
        }, api);
    }, [panelRef, api, report, active]);
}
