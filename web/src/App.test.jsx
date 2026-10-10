import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MainLayout from './layouts/MainLayout.jsx';
import Voice from './features/voice/Voice.jsx';
import { createApi } from './services/api.js';

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
        loadModels: vi.fn().mockResolvedValue(null),
        uploadAudio: vi.fn().mockResolvedValue({ text: 'hello' }),
    };
}

describe('React input workspace', () => {
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
        const voice = screen.getByRole('tab', { name: 'Voice' });
        expect(voice.getAttribute('aria-selected')).toBe('true');
        expect(document.activeElement).toBe(voice);
        expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('voice-tab');
        fireEvent.keyDown(voice, { key: 'ArrowLeft' });
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
