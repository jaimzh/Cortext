import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { initTrackpad } from './trackpadEngine.js';

let dispose;
afterEach(() => {
  dispose?.();
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function setup(zoomMethod = 'wheel') {
  vi.useFakeTimers();
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      constructor(type, options) {
        super(type, options);
        this.pointerId = options.pointerId;
      }
    },
  );
  document.body.innerHTML =
    '<div id="pad"></div><div id="bar"></div><input id="zoom" type="range" min="-10" max="10" value="0"><input id="sensitivity" value="1"><output id="value"></output>';
  const pad = document.getElementById('pad');
  const zoom = document.getElementById('zoom');
  const api = Object.fromEntries(
    ['sendMouseMove', 'sendMouseScroll', 'sendMouseZoom', 'sendMouseClick', 'sendMouseButton'].map(
      (key) => [key, vi.fn().mockResolvedValue({})],
    ),
  );
  dispose = initTrackpad(
    {
      trackpadPad: pad,
      trackpadScrollBar: document.getElementById('bar'),
      trackpadZoomSlider: zoom,
      zoomMethod,
      sensitivitySlider: document.getElementById('sensitivity'),
      sensitivityValue: document.getElementById('value'),
      statusText: {},
      mouseButtons: [],
    },
    api,
  );
  return { pad, zoom, api };
}

it('sends zoom in both directions and stops immediately on release without undoing zoom', async () => {
  const { zoom, api } = setup();
  fireEvent.input(zoom, { target: { value: '3' } });
  await vi.advanceTimersByTimeAsync(32);
  expect(api.sendMouseZoom).toHaveBeenCalledWith(1, 'wheel');
  fireEvent.pointerUp(zoom, { pointerId: 1 });
  expect(zoom.value).toBe('0');
  await vi.advanceTimersByTimeAsync(1000);
  expect(api.sendMouseZoom).toHaveBeenCalledTimes(1);
  fireEvent.input(zoom, { target: { value: '-2' } });
  await vi.advanceTimersByTimeAsync(32);
  expect(api.sendMouseZoom).toHaveBeenLastCalledWith(-1, 'wheel');
  expect(api.sendMouseScroll).not.toHaveBeenCalled();
  expect(api.sendMouseMove).not.toHaveBeenCalled();
});

it('keeps two-finger movement as scrolling without pinch zoom', async () => {
  const { pad, api } = setup();
  fireEvent.pointerDown(pad, { pointerId: 1, clientX: 100, clientY: 100 });
  fireEvent.pointerDown(pad, { pointerId: 2, clientX: 200, clientY: 100 });
  fireEvent.pointerMove(pad, { pointerId: 1, clientX: 120, clientY: 120 });
  fireEvent.pointerMove(pad, { pointerId: 2, clientX: 220, clientY: 120 });
  await vi.advanceTimersByTimeAsync(32);
  expect(api.sendMouseScroll).toHaveBeenCalledWith(12, 12);
  fireEvent.pointerMove(pad, { pointerId: 1, clientX: 80, clientY: 120 });
  fireEvent.pointerMove(pad, { pointerId: 2, clientX: 260, clientY: 120 });
  await vi.advanceTimersByTimeAsync(32);
  expect(api.sendMouseZoom).not.toHaveBeenCalled();
  expect(api.sendMouseMove).not.toHaveBeenCalled();
});

it('allows zoom and trackpad movement at the same time', async () => {
  const { pad, zoom, api } = setup();
  fireEvent.pointerDown(pad, { pointerId: 1, clientX: 100, clientY: 100 });
  fireEvent.input(zoom, { target: { value: '1' } });
  fireEvent.pointerMove(pad, { pointerId: 1, clientX: 120, clientY: 100 });
  await vi.advanceTimersByTimeAsync(32);
  expect(api.sendMouseZoom).toHaveBeenCalledWith(1, 'wheel');
  expect(api.sendMouseMove).toHaveBeenCalled();
});

it('stops continuous zoom on cancellation and leaving the mouse panel', async () => {
  const { zoom, api } = setup();
  fireEvent.input(zoom, { target: { value: '0' } });
  fireEvent.input(zoom, { target: { value: '4' } });
  fireEvent.pointerCancel(zoom, { pointerId: 1 });
  expect(zoom.value).toBe('0');
  await vi.advanceTimersByTimeAsync(32);
  expect(api.sendMouseZoom).toHaveBeenCalledTimes(1);
  fireEvent.input(zoom, { target: { value: '-4' } });
  dispose();
  expect(zoom.value).toBe('0');
  await vi.advanceTimersByTimeAsync(1000);
  expect(api.sendMouseZoom).toHaveBeenCalledTimes(2);
});

it('keeps zooming at the slider end and increases the rate farther from center', async () => {
  const { zoom, api } = setup();
  fireEvent.input(zoom, { target: { value: '1' } });
  await vi.advanceTimersByTimeAsync(1000);
  const slowTicks = api.sendMouseZoom.mock.calls.length;
  expect(slowTicks).toBeGreaterThan(1);
  fireEvent.pointerUp(zoom);
  api.sendMouseZoom.mockClear();
  fireEvent.input(zoom, { target: { value: '10' } });
  await vi.advanceTimersByTimeAsync(1000);
  expect(api.sendMouseZoom.mock.calls.length).toBeGreaterThan(slowTicks);
  expect(api.sendMouseZoom.mock.calls.every(([steps]) => steps === 1)).toBe(true);
  expect(zoom.value).toBe('10');
  fireEvent.input(zoom, { target: { value: '0' } });
  const ticks = api.sendMouseZoom.mock.calls.length;
  await vi.advanceTimersByTimeAsync(1000);
  expect(api.sendMouseZoom).toHaveBeenCalledTimes(ticks);
});

it('reverses zoom direction and stops on keyboard release and window blur', async () => {
  const { zoom, api } = setup();
  fireEvent.input(zoom, { target: { value: '4' } });
  await vi.advanceTimersByTimeAsync(300);
  fireEvent.input(zoom, { target: { value: '-4' } });
  await vi.advanceTimersByTimeAsync(300);
  expect(api.sendMouseZoom).toHaveBeenLastCalledWith(-1, 'wheel');
  fireEvent.keyUp(zoom, { key: 'ArrowDown' });
  const ticks = api.sendMouseZoom.mock.calls.length;
  await vi.advanceTimersByTimeAsync(1000);
  expect(api.sendMouseZoom).toHaveBeenCalledTimes(ticks);
  expect(zoom.value).toBe('0');
  fireEvent.input(zoom, { target: { value: '10' } });
  fireEvent.blur(window);
  const blurredTicks = api.sendMouseZoom.mock.calls.length;
  await vi.advanceTimersByTimeAsync(1000);
  expect(api.sendMouseZoom).toHaveBeenCalledTimes(blurredTicks);
  expect(zoom.value).toBe('0');
});

it('never queues zoom bursts behind a slow request or continues after releasing it', async () => {
  const { zoom, api } = setup();
  let resolve;
  api.sendMouseZoom.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  fireEvent.input(zoom, { target: { value: '10' } });
  await vi.advanceTimersByTimeAsync(2000);
  expect(api.sendMouseZoom).toHaveBeenCalledTimes(1);
  fireEvent.pointerUp(zoom);
  resolve();
  await vi.advanceTimersByTimeAsync(2000);
  expect(api.sendMouseZoom).toHaveBeenCalledTimes(1);
});

it('uses keyboard shortcuts when the alternative zoom method is selected', async () => {
  const { zoom, api } = setup('shortcuts');
  fireEvent.input(zoom, { target: { value: '3' } });
  await vi.advanceTimersByTimeAsync(400);
  expect(api.sendMouseZoom).toHaveBeenCalledWith(1, 'shortcuts');
  fireEvent.input(zoom, { target: { value: '-3' } });
  await vi.advanceTimersByTimeAsync(400);
  expect(api.sendMouseZoom).toHaveBeenLastCalledWith(-1, 'shortcuts');
});
