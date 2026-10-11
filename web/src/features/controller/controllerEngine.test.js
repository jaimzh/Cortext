import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initController } from './controllerEngine.js';

let dispose;
beforeEach(() => vi.useFakeTimers());
afterEach(() => { dispose?.(); document.body.replaceChildren(); vi.restoreAllMocks(); vi.useRealTimers(); });

function setup() {
    const panel = document.createElement('section');
    panel.innerHTML = '<button data-gamepad-trigger="left">LT</button><button data-gamepad-trigger="right">RT</button><button data-gamepad-button="left_stick">L3</button><button data-gamepad-button="right_stick">R3</button><div data-gamepad-stick="left"></div><div data-gamepad-stick="right"></div>';
    document.body.append(panel);
    const api = { sendControllerEvent: vi.fn().mockReturnValue(true) };
    const sticks = [...panel.querySelectorAll('[data-gamepad-stick]')];
    for (const stick of sticks) vi.spyOn(stick, 'getBoundingClientRect').mockReturnValue({ left: 50, top: 50, width: 100, height: 100 });
    dispose = initController({ controllerPanel: panel, controllerButtons: panel.querySelectorAll('button'),
        controllerSticks: sticks, statusText: {} }, api);
    const buttons = [...panel.querySelectorAll('button')];
    function pointer(button, type, id = 1, distance = 0) {
        const event = new MouseEvent(type, { bubbles: true, clientX: 100, clientY: 100 + distance });
        Object.defineProperty(event, 'pointerId', { value: id });
        button.dispatchEvent(event);
    }
    const values = side => api.sendControllerEvent.mock.calls.map(([event]) => event)
        .filter(event => event.type === 'gamepad.trigger' && event.side === side).map(event => event.value);
    return { panel, api, buttons, sticks, pointer, values };
}

describe('Trigger hold pressure', () => {
    it('ramps both triggers independently to full pressure in half a second', () => {
        const { buttons, pointer, values } = setup();
        pointer(buttons[0], 'pointerdown', 1);
        vi.advanceTimersByTime(200);
        expect(values('left').at(-1)).toBeCloseTo(0.49);
        pointer(buttons[1], 'pointerdown', 2);
        vi.advanceTimersByTime(300);
        expect(values('left').at(-1)).toBe(1);
        expect(values('right').at(-1)).toBeGreaterThan(0.15);
        expect(values('right').at(-1)).toBeLessThan(1);
        vi.advanceTimersByTime(200);
        expect(values('right').at(-1)).toBe(1);
        const count = values('left').length;
        vi.advanceTimersByTime(1000);
        expect(values('left')).toHaveLength(count);
        pointer(buttons[0], 'pointerup', 1);
        expect(values('left').at(-1)).toBe(0);
        expect(values('right').at(-1)).toBe(1);
    });

    it('ignores touch jitter, then hands control to sliding until released', () => {
        const { buttons, pointer, values } = setup();
        pointer(buttons[0], 'pointerdown');
        pointer(buttons[0], 'pointermove', 1, 2);
        vi.advanceTimersByTime(200);
        expect(values('left').at(-1)).toBe(0.49);
        pointer(buttons[0], 'pointermove', 1, 8);
        expect(values('left').at(-1)).toBe(0.59);
        vi.advanceTimersByTime(800);
        expect(values('left').at(-1)).toBe(0.59);
        pointer(buttons[0], 'pointermove', 1, -16);
        expect(values('left').at(-1)).toBe(0.29);
        pointer(buttons[0], 'pointerup');
        pointer(buttons[0], 'pointerdown');
        expect(values('left').at(-1)).toBe(0.15);
        vi.advanceTimersByTime(500);
        expect(values('left').at(-1)).toBe(1);
    });

    it.each(['pointerup', 'pointercancel', 'lostpointercapture', 'blur', 'edit', 'dispose', 'hidden'])
    ('cancels pending pressure updates on %s', reason => {
        const { panel, api, buttons, pointer, values } = setup();
        pointer(buttons[0], 'pointerdown');
        vi.advanceTimersByTime(120);
        if (reason === 'blur') window.dispatchEvent(new Event('blur'));
        else if (reason === 'edit') panel.dispatchEvent(new Event('controller:edit'));
        else if (reason === 'dispose') dispose();
        else if (reason === 'hidden') {
            vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
            document.dispatchEvent(new Event('visibilitychange'));
        }
        else pointer(buttons[0], reason);
        expect(values('left').at(-1)).toBe(0);
        api.sendControllerEvent.mockClear();
        vi.advanceTimersByTime(1000);
        expect(api.sendControllerEvent).not.toHaveBeenCalled();
    });
});

describe('L3 and R3 touch clicks', () => {
    it.each(['buttonFirst', 'gestureFirst'])('keeps L3 pressed until both input sources release (%s)', order => {
        const { api, sticks, buttons, pointer } = setup();
        const button = buttons[2];
        pointer(sticks[0], 'pointerdown', 1);
        pointer(sticks[0], 'pointerup', 1);
        pointer(sticks[0], 'pointerdown', 1);
        pointer(button, 'pointerdown', 2);
        const clicks = () => api.sendControllerEvent.mock.calls.map(([event]) => event).filter(event => event.type === 'gamepad.button');
        expect(clicks()).toEqual([{ type: 'gamepad.button', button: 'left_stick', action: 'down' }]);
        pointer(order === 'buttonFirst' ? button : sticks[0], 'pointerup', order === 'buttonFirst' ? 2 : 1);
        expect(clicks()).toHaveLength(1);
        pointer(order === 'buttonFirst' ? sticks[0] : button, 'pointerup', order === 'buttonFirst' ? 1 : 2);
        expect(clicks()).toEqual([{ type: 'gamepad.button', button: 'left_stick', action: 'down' },
            { type: 'gamepad.button', button: 'left_stick', action: 'up' }]);
    });

    it.each([['left', 0], ['right', 1]])('double-taps and holds %s stick while still allowing directional movement', (side, index) => {
        const { api, sticks, pointer } = setup();
        const stick = sticks[index];
        pointer(stick, 'pointerdown');
        pointer(stick, 'pointerup');
        vi.advanceTimersByTime(100);
        pointer(stick, 'pointerdown');
        expect(api.sendControllerEvent).toHaveBeenCalledWith({ type: 'gamepad.button', button: `${side}_stick`, action: 'down' });
        expect(stick.classList.contains('stick-clicked')).toBe(true);
        pointer(stick, 'pointermove', 1, 25);
        expect(api.sendControllerEvent).toHaveBeenLastCalledWith({ type: 'gamepad.stick', side, x: 0, y: -0.5 });
        vi.advanceTimersByTime(1000);
        expect(stick.classList.contains('stick-clicked')).toBe(true);
        pointer(stick, 'pointerup', 1, 25);
        expect(api.sendControllerEvent).toHaveBeenCalledWith({ type: 'gamepad.button', button: `${side}_stick`, action: 'up' });
        expect(stick.classList.contains('stick-clicked')).toBe(false);
        expect(api.sendControllerEvent).toHaveBeenLastCalledWith({ type: 'gamepad.stick', side, x: 0, y: 0 });
    });

    it.each(['pointercancel', 'lostpointercapture', 'blur', 'edit', 'dispose', 'hidden'])('releases stick clicks on %s', reason => {
        const { api, panel, sticks, pointer } = setup();
        pointer(sticks[0], 'pointerdown');
        pointer(sticks[0], 'pointerup');
        pointer(sticks[0], 'pointerdown');
        if (reason === 'blur') window.dispatchEvent(new Event('blur'));
        else if (reason === 'edit') panel.dispatchEvent(new Event('controller:edit'));
        else if (reason === 'dispose') dispose();
        else if (reason === 'hidden') {
            vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
            document.dispatchEvent(new Event('visibilitychange'));
        } else pointer(sticks[0], reason);
        expect(api.sendControllerEvent).toHaveBeenCalledWith({ type: 'gamepad.button', button: 'left_stick', action: 'up' });
        expect(sticks[0].classList.contains('stick-clicked')).toBe(false);
    });

    it.each(['drag', 'hold', 'late', 'cancel', 'otherStick'])('does not mistake %s for a double-tap', reason => {
        const { api, sticks, pointer } = setup();
        pointer(sticks[0], 'pointerdown');
        if (reason === 'drag') {
            pointer(sticks[0], 'pointermove', 1, 30);
            pointer(sticks[0], 'pointermove');
        }
        if (reason === 'hold') vi.advanceTimersByTime(400);
        pointer(sticks[0], reason === 'cancel' ? 'pointercancel' : 'pointerup');
        if (reason === 'late') vi.advanceTimersByTime(400);
        pointer(reason === 'otherStick' ? sticks[1] : sticks[0], 'pointerdown');
        expect(api.sendControllerEvent.mock.calls.some(([event]) => event.type === 'gamepad.button')).toBe(false);
    });
});
