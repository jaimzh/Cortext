import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MainLayout from './layouts/MainLayout.jsx';
import Voice from './features/voice/Voice.jsx';
import { createApi } from './services/api.js';
import { HUD_IDS, HUD_STORAGE_KEY } from './features/controller/hudLayout.js';

afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function mockApi() {
    return {
        sendKeyboardText: vi.fn().mockResolvedValue({ message: 'Text inserted' }),
        sendKeyboardKey: vi.fn().mockResolvedValue({}),
        sendKeyboardShortcut: vi.fn().mockResolvedValue({}),
        sendMouseClick: vi.fn().mockResolvedValue({}),
        sendMouseMove: vi.fn().mockResolvedValue(undefined),
        sendMouseScroll: vi.fn().mockResolvedValue(undefined),
        sendMouseButton: vi.fn().mockResolvedValue(undefined),
        sendControllerEvent: vi.fn().mockReturnValue(true),
        onControllerMessage: vi.fn().mockReturnValue(vi.fn()),
        onControllerOpen: vi.fn().mockReturnValue(vi.fn()),
        connectInputSocket: vi.fn(),
        onInputConnection: vi.fn(listener => { listener(true); return vi.fn(); }),
        sendLiveKeyboardInput: vi.fn().mockReturnValue(true),
        sendLiveKeyboardKey: vi.fn().mockReturnValue(true),
        loadModels: vi.fn().mockResolvedValue(null),
        uploadAudio: vi.fn().mockResolvedValue({ text: 'hello' }),
    };
}

describe('React input workspace', () => {
    it('streams live text, spaces, deletion and autocorrect over the shared socket', () => {
        const api = mockApi();
        render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Live keyboard' }));
        const input = screen.getByRole('textbox', { name: 'Live keyboard input' });
        for (const value of ['h', 'hi', 'hi ', 'hi', 'hello']) fireEvent.change(input, { target: { value } });
        expect(api.sendLiveKeyboardInput.mock.calls.map(([edit]) => edit)).toEqual([
            { delete: 0, text: 'h' }, { delete: 0, text: 'i' }, { delete: 0, text: ' ' },
            { delete: 1, text: '' }, { delete: 1, text: 'ello' },
        ]);
        expect(api.sendKeyboardText).not.toHaveBeenCalled();
        expect(api.connectInputSocket).toHaveBeenCalledOnce();
        expect(screen.getByRole('application', { name: 'Trackpad' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Enter', exact: true }));
        expect(api.sendLiveKeyboardKey).toHaveBeenCalledWith('enter');
        expect(input.value).toBe('');
    });

    it('streams phone composition immediately and does not replay text after disconnecting', () => {
        const api = mockApi();
        render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Live keyboard' }));
        const input = screen.getByRole('textbox', { name: 'Live keyboard input' });
        fireEvent.compositionStart(input);
        fireEvent.change(input, { target: { value: 'n' } });
        fireEvent.change(input, { target: { value: '你' } });
        expect(api.sendLiveKeyboardInput.mock.calls.map(([edit]) => edit)).toEqual([
            { delete: 0, text: 'n' }, { delete: 1, text: '你' },
        ]);
        fireEvent.compositionEnd(input, { data: '你' });
        expect(api.sendLiveKeyboardInput).toHaveBeenCalledTimes(2);
        expect(api.sendLiveKeyboardInput).toHaveBeenLastCalledWith({ delete: 1, text: '你' });
        act(() => api.onInputConnection.mock.calls[0][0](false));
        expect(input.disabled).toBe(true);
        expect(input.value).toBe('');
        act(() => api.onInputConnection.mock.calls[0][0](true));
        expect(api.sendLiveKeyboardInput).toHaveBeenCalledTimes(2);
        fireEvent.change(input, { target: { value: 'a' } });
        expect(api.sendLiveKeyboardInput).toHaveBeenLastCalledWith({ delete: 0, text: 'a' });
        fireEvent.click(screen.getByRole('tab', { name: 'Voice', exact: true }));
        expect(api.onInputConnection.mock.results[0].value).toHaveBeenCalledOnce();
        expect(api.onControllerMessage.mock.results[0].value).toHaveBeenCalledOnce();
    });

    it('sends each Android composing input before compositionend without duplicate events', () => {
        const api = mockApi();
        render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Live keyboard' }));
        const input = screen.getByRole('textbox', { name: 'Live keyboard input' });
        fireEvent.compositionStart(input);
        for (const value of ['a', 'ab', 'abc']) fireEvent.input(input, { target: { value }, isComposing: true, inputType: 'insertCompositionText' });
        expect(api.sendLiveKeyboardInput.mock.calls.map(([edit]) => edit)).toEqual([
            { delete: 0, text: 'a' }, { delete: 0, text: 'b' }, { delete: 0, text: 'c' },
        ]);
        fireEvent.compositionEnd(input, { data: 'abc' });
        expect(api.sendLiveKeyboardInput).toHaveBeenCalledTimes(3);
        fireEvent.click(screen.getByRole('button', { name: 'Enter', exact: true }));
        expect(api.sendLiveKeyboardKey).toHaveBeenCalledWith('enter');
    });

    it('sends Enter from the Return button beside voice recording', async () => {
        const api = mockApi();
        render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Voice', exact: true }));
        const record = screen.getByRole('button', { name: 'Start Recording' });
        const returnButton = screen.getByRole('button', { name: 'Return', exact: true });
        expect(returnButton.parentElement).toBe(record.parentElement);
        fireEvent.click(returnButton);
        await waitFor(() => expect(api.sendKeyboardKey).toHaveBeenCalledWith('enter'));
        expect(api.uploadAudio).not.toHaveBeenCalled();
    });

    it.each([['LT', 'left', 0], ['RT', 'right', 90]])('adjusts %s pressure with sliding at %s orientation', (label, side, rotation) => {
        const api = mockApi();
        render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        const trigger = screen.getByRole('button', { name: label, exact: true });
        trigger.style.setProperty('--controller-rotation', String(rotation));
        const pointer = (type, distance = 0) => fireEvent(trigger, new MouseEvent(type, {
            bubbles: true, clientX: rotation === 90 ? 100 - distance : 100,
            clientY: rotation === 90 ? 100 : 100 + distance,
        }));
        pointer('pointerdown');
        expect(api.sendControllerEvent).toHaveBeenLastCalledWith({ type: 'gamepad.trigger', side, value: 0.15 });
        pointer('pointermove', 40);
        expect(api.sendControllerEvent).toHaveBeenLastCalledWith({ type: 'gamepad.trigger', side, value: 0.65 });
        expect(trigger.style.getPropertyValue('--trigger-pressure')).toBe('65%');
        pointer('pointermove', 100);
        expect(api.sendControllerEvent).toHaveBeenLastCalledWith({ type: 'gamepad.trigger', side, value: 1 });
        pointer('pointermove', 20);
        expect(api.sendControllerEvent).toHaveBeenLastCalledWith({ type: 'gamepad.trigger', side, value: 0.4 });
        pointer('pointermove', -100);
        expect(api.sendControllerEvent).toHaveBeenLastCalledWith({ type: 'gamepad.trigger', side, value: 0 });
        pointer('pointermove', 40);
        pointer('pointercancel');
        expect(api.sendControllerEvent).toHaveBeenLastCalledWith({ type: 'gamepad.trigger', side, value: 0 });
        expect(trigger.style.getPropertyValue('--trigger-pressure')).toBe('0%');
        expect(trigger.classList.contains('pressed')).toBe(false);
    });

    it('releases trigger pressure when entering the HUD editor', () => {
        const api = mockApi();
        render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        const trigger = screen.getByRole('button', { name: 'LT', exact: true });
        fireEvent(trigger, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }));
        fireEvent.click(screen.getByRole('button', { name: 'Edit layout' }));
        expect(api.sendControllerEvent).toHaveBeenCalledWith({ type: 'gamepad.trigger', side: 'left', value: 0 });
        expect(trigger.classList.contains('pressed')).toBe(false);
    });

    it('edits rotated controls without sending gameplay input, saves sizes and restores the layout', () => {
        const initial = Object.fromEntries(HUD_IDS.map(id => [id, { x: 0.5, y: 0.5, scale: 1 }]));
        localStorage.setItem(HUD_STORAGE_KEY, JSON.stringify(initial));
        const api = mockApi();
        const view = render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        fireEvent.click(screen.getByRole('button', { name: 'Edit layout' }));
        const shell = screen.getByRole('application', { name: 'Game controller' });
        Object.defineProperties(shell, { offsetWidth: { value: 600 }, offsetHeight: { value: 300 } });
        shell.style.setProperty('--controller-rotation', '90');
        api.sendControllerEvent.mockClear();
        const button = screen.getByRole('button', { name: 'A', exact: true });
        fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }));
        fireEvent(shell, new MouseEvent('pointermove', { bubbles: true, clientX: 100, clientY: 160 }));
        fireEvent(shell, new MouseEvent('pointerup', { bubbles: true }));
        fireEvent.change(screen.getByRole('slider', { name: 'Control size' }), { target: { value: '125' } });
        expect(api.sendControllerEvent).not.toHaveBeenCalled();
        expect(api.sendKeyboardKey).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Save layout' }));
        const saved = JSON.parse(localStorage.getItem(HUD_STORAGE_KEY));
        expect(saved.a.x).toBeCloseTo(0.6);
        expect(saved.a.y).toBeCloseTo(0.5);
        expect(saved.a.scale).toBe(1.25);
        view.unmount();
        render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        expect(screen.getByRole('button', { name: 'A', exact: true }).style.getPropertyValue('--hud-scale')).toBe('1.25');
    });

    it('cancels layout changes and resets to the default arrangement', () => {
        const initial = Object.fromEntries(HUD_IDS.map(id => [id, { x: 0.5, y: 0.5, scale: 1 }]));
        localStorage.setItem(HUD_STORAGE_KEY, JSON.stringify(initial));
        render(<MainLayout api={mockApi()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        fireEvent.click(screen.getByRole('button', { name: 'Edit layout' }));
        fireEvent.change(screen.getByRole('slider', { name: 'Control size' }), { target: { value: '150' } });
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(JSON.parse(localStorage.getItem(HUD_STORAGE_KEY))).toEqual(initial);
        fireEvent.click(screen.getByRole('button', { name: 'Edit layout' }));
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
        fireEvent.click(screen.getByRole('button', { name: 'Save layout' }));
        expect(localStorage.getItem(HUD_STORAGE_KEY)).toBeNull();
        expect(screen.getByRole('application', { name: 'Game controller' }).getAttribute('data-custom-layout')).toBe('false');
    });

    it.each([0, 90])('maps joystick movement into controller coordinates at %s degrees', angle => {
        const api = mockApi();
        render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        const stick = document.getElementById('leftStick');
        stick.style.setProperty('--controller-rotation', String(angle));
        vi.spyOn(stick, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100 });
        fireEvent(stick, new MouseEvent('pointerdown', {
            bubbles: true, clientX: angle === 90 ? 50 : 100, clientY: angle === 90 ? 100 : 50,
        }));
        expect(api.sendControllerEvent).toHaveBeenLastCalledWith({
            type: 'gamepad.stick', side: 'left', x: expect.closeTo(1, 5), y: expect.closeTo(0, 5),
        });
        fireEvent(stick, new MouseEvent('pointerup', { bubbles: true }));
        expect(api.sendControllerEvent).toHaveBeenLastCalledWith({ type: 'gamepad.stick', side: 'left', x: 0, y: 0 });
    });

    it('keeps the fullscreen icon outside the controller controls and toggles it', async () => {
        render(<MainLayout api={mockApi()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        const enter = screen.getByRole('button', { name: 'Enter fullscreen' });
        expect(document.getElementById('controllerPanel').contains(enter)).toBe(false);
        fireEvent.click(enter);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeTruthy());
        expect(document.body.classList.contains('controller-fullscreen')).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: 'Exit fullscreen' }));
        await waitFor(() => expect(document.body.classList.contains('controller-fullscreen')).toBe(false));
    });

    it('uses the controller Space button to send a keyboard space press', async () => {
        const api = mockApi();
        render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        expect(screen.queryByRole('button', { name: 'Back', exact: true })).toBeNull();
        const space = screen.getByRole('button', { name: 'Space', exact: true });
        fireEvent.pointerDown(space, { pointerId: 2 });
        fireEvent.pointerUp(space, { pointerId: 2 });
        await waitFor(() => expect(api.sendKeyboardKey).toHaveBeenCalledWith('space'));
        expect(api.sendKeyboardKey).toHaveBeenCalledOnce();
        expect(api.sendControllerEvent).not.toHaveBeenCalledWith(expect.objectContaining({ button: 'back' }));
    });

    it('opens the info page from the logo and returns without losing the keyboard draft', () => {
        render(<MainLayout api={mockApi()} showNavbar />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Keep this draft' } });
        fireEvent.click(screen.getByRole('button', { name: 'About Cortext' }));
        const heading = screen.getByRole('heading', { name: 'Cortext' });
        expect(document.activeElement).toBe(heading);
        expect(screen.queryByRole('application', { name: 'Trackpad' })).toBeNull();
        expect(screen.queryByRole('navigation', { name: 'Input workspace' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Back to controls' }));
        expect(screen.getByRole('textbox').value).toBe('Keep this draft');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'About Cortext' }));
    });

    it('resizes the mouse panel with the separator and restores its saved size', () => {
        const api = mockApi();
        const rendered = render(<MainLayout api={api} />);
        const divider = screen.getByRole('separator', { name: 'Resize mouse panel' });
        expect(divider.getAttribute('aria-valuenow')).toBe('320');
        fireEvent.keyDown(divider, { key: 'ArrowDown' });
        expect(divider.getAttribute('aria-valuenow')).toBe('336');
        fireEvent.click(screen.getByRole('tab', { name: 'Voice' }));
        expect(divider.getAttribute('aria-valuenow')).toBe('336');
        rendered.unmount();
        render(<MainLayout api={api} />);
        const restored = screen.getByRole('separator', { name: 'Resize mouse panel' });
        expect(restored.getAttribute('aria-valuenow')).toBe('336');
        expect(restored.parentElement.style.getPropertyValue('--mouse-height')).toBe('336px');
        fireEvent.doubleClick(restored);
        expect(restored.getAttribute('aria-valuenow')).toBe('320');
    });

    it('bounds resizing and safely handles invalid saved panel sizes', () => {
        localStorage.setItem('cortext.mouseHeight', 'broken');
        render(<MainLayout api={mockApi()} />);
        const divider = screen.getByRole('separator', { name: 'Resize mouse panel' });
        expect(divider.getAttribute('aria-valuenow')).toBe('320');
        fireEvent.keyDown(divider, { key: 'Home' });
        fireEvent.keyDown(divider, { key: 'ArrowUp' });
        expect(divider.getAttribute('aria-valuenow')).toBe('180');
        fireEvent.keyDown(divider, { key: 'End' });
        fireEvent.keyDown(divider, { key: 'ArrowDown', shiftKey: true });
        expect(divider.getAttribute('aria-valuenow')).toBe('640');
    });

    it('uses mouse and keyboard together and preserves the draft across views', async () => {
        const api = mockApi();
        render(<MainLayout api={api} />);
        expect(screen.getByRole('application', { name: 'Trackpad' })).toBeTruthy();
        const text = screen.getByRole('textbox');
        fireEvent.change(text, { target: { value: 'draft' } });
        fireEvent.click(screen.getByRole('button', { name: 'Left', exact: true }));
        await waitFor(() => expect(api.sendMouseClick).toHaveBeenCalledWith('left', 1));
        fireEvent.click(screen.getByRole('tab', { name: 'Voice', exact: true }));
        expect(screen.queryByRole('textbox')).toBeNull();
        expect(screen.getByRole('application', { name: 'Trackpad' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Voice', exact: true })).toBeNull();
        fireEvent.click(screen.getByRole('tab', { name: 'Keyboard' }));
        expect(screen.getByRole('textbox').value).toBe('draft');
        fireEvent.click(screen.getByRole('button', { name: 'Send text', exact: true }));
        await waitFor(() => expect(api.sendKeyboardText).toHaveBeenCalledWith('draft'));
        await waitFor(() => expect(text.value).toBe(''));
    });

    it('keeps newer edits when an earlier text submission completes', async () => {
        const api = mockApi();
        let finish;
        api.sendKeyboardText.mockReturnValue(new Promise(resolve => { finish = resolve; }));
        render(<MainLayout api={api} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'first' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send text', exact: true }));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'next' } });
        finish({});
        await waitFor(() => expect(screen.getByRole('button', { name: 'Send text', exact: true }).disabled).toBe(false));
        expect(screen.getByRole('textbox').value).toBe('next');
    });

    it('releases held controller buttons and subscriptions when leaving its view', () => {
        const api = mockApi();
        render(<MainLayout api={api} />);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        fireEvent.pointerDown(screen.getByRole('button', { name: 'A', exact: true }), { pointerId: 1 });
        expect(api.sendControllerEvent).toHaveBeenCalledWith({ type: 'gamepad.button', action: 'down', button: 'a' });
        fireEvent.click(screen.getByRole('button', { name: 'Mouse + Input' }));
        expect(api.sendControllerEvent).toHaveBeenCalledWith({ type: 'gamepad.button', action: 'up', button: 'a' });
        expect(api.onControllerMessage.mock.results[0].value).toHaveBeenCalledOnce();
        expect(api.onControllerOpen.mock.results[0].value).toHaveBeenCalledOnce();
        expect(document.body.classList.contains('controller-mode')).toBe(false);
    });

    it('stops mouse movement loops on leaving the workspace', async () => {
        vi.useFakeTimers();
        render(<MainLayout api={mockApi()} />);
        fireEvent.pointerDown(screen.getByRole('application', { name: 'Trackpad' }), { pointerId: 1, clientX: 0, clientY: 0 });
        expect(vi.getTimerCount()).toBeGreaterThan(0);
        fireEvent.click(screen.getByRole('button', { name: 'Controller', exact: true }));
        await vi.advanceTimersByTimeAsync(100);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('releases microphone access that resolves after the voice view closes', async () => {
        let allow;
        const stop = vi.fn();
        vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => new Promise(resolve => { allow = resolve; }) } });
        const rendered = render(<Voice api={mockApi()} report={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Start Recording' }));
        rendered.unmount();
        allow({ getTracks: () => [{ stop }] });
        await waitFor(() => expect(stop).toHaveBeenCalledOnce());
    });

    it('switches ribbon tabs with arrow keys and moves focus to the selected tab', () => {
        render(<MainLayout api={mockApi()} />);
        fireEvent.keyDown(screen.getByRole('tab', { name: 'Keyboard' }), { key: 'ArrowRight' });
        const live = screen.getByRole('tab', { name: 'Live keyboard' });
        expect(live.getAttribute('aria-selected')).toBe('true');
        expect(document.activeElement).toBe(live);
        fireEvent.keyDown(live, { key: 'ArrowRight' });
        const voice = screen.getByRole('tab', { name: 'Voice' });
        expect(voice.getAttribute('aria-selected')).toBe('true');
        expect(document.activeElement).toBe(voice);
        expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('voice-tab');
        fireEvent.keyDown(voice, { key: 'ArrowLeft' });
        fireEvent.keyDown(live, { key: 'ArrowLeft' });
        expect(screen.getByRole('textbox')).toBeTruthy();
    });
});

it('closes the API socket without scheduling a reconnect after disposal', () => {
    vi.useFakeTimers();
    class Socket extends EventTarget {
        static OPEN = 1;
        static CONNECTING = 0;
        readyState = 1;
        send = vi.fn();
        close = vi.fn(() => this.dispatchEvent(new Event('close')));
        constructor() { super(); Socket.instance = this; }
    }
    vi.stubGlobal('WebSocket', Socket);
    const api = createApi('test');
    api.sendControllerEvent({ type: 'gamepad.connect' });
    api.dispose();
    expect(Socket.instance.close).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    expect(api.sendControllerEvent({ type: 'gamepad.connect' })).toBe(false);
});
