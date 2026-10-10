import { useEffect } from 'react';
import { initController } from './controllerEngine.js';

export function useController(panelRef, api, report, fullscreenButtonRef) {
    useEffect(() => {
        const panel = panelRef.current;
        return initController({
            controllerFullscreenButton: fullscreenButtonRef.current,
            controllerPanel: panel,
            controllerButtons: panel.querySelectorAll('[data-gamepad-button], [data-gamepad-trigger], [data-keyboard-key]'),
            controllerSticks: panel.querySelectorAll('[data-gamepad-stick]'),
            statusText: { set textContent(message) { report(message); } },
        }, api);
    }, [panelRef, api, report, fullscreenButtonRef]);
}
