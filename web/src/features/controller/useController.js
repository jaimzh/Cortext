import { useEffect } from 'react';
import { initController } from './controllerEngine.js';

export function useController(panelRef, api, report) {
    useEffect(() => {
        const panel = panelRef.current;
        return initController({
            controllerFullscreenButton: panel.querySelector("#controllerFullscreenButton"),
            controllerFullscreenLabel: panel.querySelector("#controllerFullscreenLabel"),
            controllerPanel: panel,
            controllerButtons: panel.querySelectorAll('[data-gamepad-button], [data-gamepad-trigger]'),
            controllerSticks: panel.querySelectorAll('[data-gamepad-stick]'),
            statusText: { set textContent(message) { report(message); } },
        }, api);
    }, [panelRef, api, report]);
}
