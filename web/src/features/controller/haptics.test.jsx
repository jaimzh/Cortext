import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import MainLayout from '../../layouts/MainLayout.jsx';

const feedback = vi.hoisted(() => ({ trigger: vi.fn(), cancel: vi.fn() }));
vi.mock('web-haptics/react', () => ({ useWebHaptics: () => feedback }));

afterEach(() => { cleanup(); localStorage.clear(); vi.resetAllMocks(); });

function setup() {
    const api = { sendControllerEvent: vi.fn().mockReturnValue(true),
        sendMouseClick: vi.fn().mockResolvedValue({}),
        onControllerMessage: vi.fn(), onControllerOpen: vi.fn() };
    const view = render(<MainLayout api={api} />);
    fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
    return { api, view };
}

describe('Controller haptics', () => {
    it('shares feedback with both mouse buttons, pulsing once per press and respecting the toggle', async () => {
        const { api } = setup();
        fireEvent.click(screen.getByRole('button', { name: 'Mouse + Input' }));
        for (const label of ['Left', 'Right']) {
            const button = screen.getByRole('button', { name: label, exact: true });
            const before = feedback.trigger.mock.calls.length;
            fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
            expect(feedback.trigger).toHaveBeenCalledTimes(before + 1);
            fireEvent(button, new MouseEvent('pointermove', { bubbles: true, button: 0 }));
            fireEvent(button, new MouseEvent('pointerup', { bubbles: true, button: 0 }));
            fireEvent.click(button, { detail: 1 });
            expect(feedback.trigger).toHaveBeenCalledTimes(before + 1);
            expect(api.sendMouseClick).toHaveBeenCalledWith(label.toLowerCase(), 1);
        }
        fireEvent.click(screen.getByRole('button', { name: 'Haptic feedback' }));
        fireEvent(screen.getByRole('button', { name: 'Left', exact: true }), new MouseEvent('pointerdown', { bubbles: true }));
        expect(feedback.trigger).toHaveBeenCalledTimes(2);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        fireEvent.pointerDown(screen.getByRole('button', { name: 'A', exact: true }));
        expect(feedback.trigger).toHaveBeenCalledTimes(2);
        await Promise.resolve();
    });

    it('ticks once on button and trigger presses, without feedback during movement or editing', () => {
        setup();
        const a = screen.getByRole('button', { name: 'A', exact: true });
        fireEvent.pointerDown(a, { pointerId: 1 });
        fireEvent.pointerDown(a, { pointerId: 2 });
        expect(feedback.trigger).toHaveBeenCalledExactlyOnceWith(35, { intensity: 1 });
        fireEvent.pointerUp(a, { pointerId: 1 });
        const lt = screen.getByRole('button', { name: 'LT', exact: true });
        fireEvent.pointerDown(lt, { pointerId: 3, clientY: 0 });
        fireEvent.pointerMove(lt, { pointerId: 3, clientY: 30 });
        fireEvent.pointerUp(lt, { pointerId: 3 });
        expect(feedback.trigger).toHaveBeenCalledTimes(2);
        fireEvent.click(screen.getByRole('button', { name: 'Edit layout' }));
        fireEvent.pointerDown(a, { pointerId: 5 });
        expect(feedback.trigger).toHaveBeenCalledTimes(2);
    });

    it('pulses once when engaging the joystick, respects the toggle and stays quiet during editing', () => {
        setup();
        const stick = screen.getByLabelText('Left stick');
        vi.spyOn(stick, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100 });
        function pointer(type, id = 1) {
            const event = new MouseEvent(type, { bubbles: true, clientX: 50, clientY: 50 });
            Object.defineProperty(event, 'pointerId', { value: id });
            fireEvent(stick, event);
        }
        pointer('pointerdown');
        expect(feedback.trigger).toHaveBeenCalledExactlyOnceWith(35, { intensity: 1 });
        pointer('pointerdown', 2);
        pointer('pointermove');
        pointer('pointermove');
        pointer('pointerup');
        expect(feedback.trigger).toHaveBeenCalledTimes(1);
        pointer('pointerdown');
        expect(feedback.trigger).toHaveBeenCalledTimes(2);
        pointer('pointerup');
        fireEvent.click(screen.getByRole('button', { name: 'Haptic feedback' }));
        pointer('pointerdown');
        pointer('pointerup');
        expect(feedback.trigger).toHaveBeenCalledTimes(2);
        fireEvent.click(screen.getByRole('button', { name: 'Haptic feedback' }));
        expect(feedback.trigger).toHaveBeenCalledTimes(3);
        fireEvent.click(screen.getByRole('button', { name: 'Edit layout' }));
        pointer('pointerdown');
        expect(feedback.trigger).toHaveBeenCalledTimes(3);
    });

    it('remembers disabling feedback without releasing a held button', () => {
        const { api, view } = setup();
        const a = screen.getByRole('button', { name: 'A', exact: true });
        fireEvent.pointerDown(a, { pointerId: 1 });
        api.sendControllerEvent.mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'Haptic feedback' }));
        expect(api.sendControllerEvent).not.toHaveBeenCalled();
        expect(feedback.cancel).toHaveBeenCalled();
        fireEvent.pointerUp(a, { pointerId: 1 });
        expect(api.sendControllerEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'up', button: 'a' }));
        fireEvent.pointerDown(a, { pointerId: 2 });
        expect(feedback.trigger).toHaveBeenCalledTimes(1);
        view.unmount();
        setup();
        expect(screen.getByRole('button', { name: 'Haptic feedback' }).getAttribute('aria-pressed')).toBe('false');
        fireEvent.pointerDown(screen.getByRole('button', { name: 'A', exact: true }));
        expect(feedback.trigger).toHaveBeenCalledTimes(1);
    });

    it('keeps controller input working when vibration fails', async () => {
        const { api } = setup();
        feedback.trigger.mockRejectedValueOnce(new Error('Unavailable'));
        fireEvent.pointerDown(screen.getByRole('button', { name: 'A', exact: true }));
        expect(api.sendControllerEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'down', button: 'a' }));
        await Promise.resolve();
    });

    it('previews a continuous pulse when feedback is enabled', () => {
        localStorage.setItem('cortext.controllerHaptics', 'false');
        const { api } = setup();
        api.sendControllerEvent.mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'Haptic feedback' }));
        expect(feedback.trigger).toHaveBeenCalledExactlyOnceWith(35, { intensity: 1 });
        expect(api.sendControllerEvent).not.toHaveBeenCalled();
        expect(localStorage.getItem('cortext.controllerHaptics')).toBe('true');
    });
});
