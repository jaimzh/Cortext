import { afterEach, expect, it, vi } from 'vitest';
import { createApi } from './api.js';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('shares one WebSocket for live keyboard and controller events without falling back to HTTP', () => {
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
    api.sendControllerEvent({ type: 'gamepad.connect' });
    expect(socket.send.mock.calls.map(([message]) => JSON.parse(message))).toEqual([
        { type: 'keyboard.input', delete: 1, text: 'a ' },
        { type: 'keyboard.key', key: 'enter' }, { type: 'gamepad.connect' },
    ]);
    expect(Socket.instances).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
    socket.close();
    expect(connection).toHaveBeenLastCalledWith(false);
    unsubscribe();
    api.dispose();
    expect(vi.getTimerCount()).toBe(0);
});
