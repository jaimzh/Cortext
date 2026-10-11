import { afterEach, expect, it, vi } from 'vitest';
import { createApi } from './api.js';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('shares one WebSocket for live keyboard, mouse zoom and controller events without falling back to HTTP', async () => {
    vi.useFakeTimers();
    class Socket extends EventTarget {
        static OPEN = 1;
        static CONNECTING = 0;
        readyState = 0;
        send = vi.fn();
        close = vi.fn(() => { this.readyState = 3; this.dispatchEvent(new Event('close')); });
        constructor(url) { super(); this.url = url; Socket.instances.push(this); }
        static instances = [];
    }
    vi.stubGlobal('WebSocket', Socket);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const api = createApi('test');
    const connection = vi.fn();
    const unsubscribe = api.onInputConnection(connection);
    api.connectInputSocket();
    expect(api.sendLiveKeyboardInput({ delete: 0, text: 'unsent' })).toBe(false);
    expect(Socket.instances).toHaveLength(1);
    const socket = Socket.instances[0];
    expect(socket.url).toContain('/controller/ws?token=test');
    socket.readyState = 1;
    socket.dispatchEvent(new Event('open'));
    expect(connection).toHaveBeenLastCalledWith(true);
    expect(api.sendLiveKeyboardInput({ delete: 1, text: 'a ' })).toBe(true);
    expect(api.sendLiveKeyboardKey('enter')).toBe(true);
    expect(api.sendLiveKeyboardShortcut('win_tab')).toBe(true);
    await api.sendMouseZoom(2);
    api.sendControllerEvent({ type: 'gamepad.connect' });
    expect(socket.send.mock.calls.map(([message]) => JSON.parse(message))).toEqual([
        { type: 'keyboard.input', delete: 1, text: 'a ' },
        { type: 'keyboard.key', key: 'enter' }, { type: 'keyboard.shortcut', shortcut: 'win_tab' },
        { type: 'mouse.zoom', steps: 2, method: 'wheel' }, { type: 'gamepad.connect' },
    ]);
    expect(Socket.instances).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
    socket.close();
    expect(connection).toHaveBeenLastCalledWith(false);
    unsubscribe();
    api.dispose();
    expect(vi.getTimerCount()).toBe(0);
});

it('falls back to the authenticated mouse zoom endpoint when the socket is unavailable', async () => {
    class Socket extends EventTarget {
        static OPEN = 1;
        static CONNECTING = 0;
        readyState = 0;
        close() {}
    }
    vi.stubGlobal('WebSocket', Socket);
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetch);
    const api = createApi('test');
    await api.sendMouseZoom(-2, 'shortcuts');
    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain('/mouse/zoom');
    expect(options.body.get('token')).toBe('test');
    expect(options.body.get('steps')).toBe('-2');
    expect(options.body.get('method')).toBe('shortcuts');
    api.dispose();
});
