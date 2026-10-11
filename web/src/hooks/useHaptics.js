import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebHaptics } from 'web-haptics/react';

const STORAGE_KEY = 'cortext.controllerHaptics';

export function useHaptics() {
    const [enabled, setEnabled] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY) !== 'false'; }
        catch { return true; }
    });
    const { trigger, cancel } = useWebHaptics({ debug: false, showSwitch: false });
    const enabledRef = useRef(enabled);

    useEffect(() => {
        enabledRef.current = enabled;
        try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch { /* Optional preference. */ }
        if (!enabled) cancel();
    }, [enabled, cancel]);

    const pulse = useCallback(() => {
        try {
            // A continuous pulse avoids the light preset's barely perceptible PWM ticks.
            Promise.resolve(trigger(35, { intensity: 1 })).catch(() => {});
        } catch { /* Haptics must never interrupt input. */ }
    }, [trigger]);

    // Keep the callback stable so toggling feedback never releases held controls.
    const press = useCallback(() => {
        if (enabledRef.current) pulse();
    }, [pulse]);

    function toggle() {
        const next = !enabledRef.current;
        enabledRef.current = next;
        setEnabled(next);
        // Preview synchronously within the tap, preserving browser user activation.
        if (next) pulse();
    }

    return { enabled, toggle, press };
}
