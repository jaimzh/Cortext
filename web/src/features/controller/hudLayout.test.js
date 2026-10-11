import { afterEach, expect, it } from 'vitest';
import { HUD_IDS, HUD_STORAGE_KEY, moveHudControl, readHudLayout, screenDelta } from './hudLayout.js';

afterEach(() => localStorage.clear());

it('preserves existing HUD positions while adding right stick and D-pad to old layouts', () => {
    const old = Object.fromEntries(HUD_IDS.filter(id => !['rightStick', 'dpad'].includes(id)).map(id => [id, { x: 0.4, y: 0.6, scale: 1.2 }]));
    localStorage.setItem(HUD_STORAGE_KEY, JSON.stringify(old));
    const result = readHudLayout();
    expect(result.stick).toEqual(old.stick);
    expect(result.rightStick).toEqual({ x: 0.67, y: 0.66, scale: 1 });
    expect(result.dpad).toEqual({ x: 0.34, y: 0.66, scale: 1 });
});

it('maps portrait drags into landscape coordinates and bounds positions', () => {
    const delta = screenDelta(0, 60, 90);
    expect(delta.x).toBeCloseTo(60);
    expect(delta.y).toBeCloseTo(0);
    expect(moveHudControl({ x: 0.5, y: 0.5, scale: 1 }, delta.x, delta.y, 600, 300).x).toBeCloseTo(0.6);
    expect(moveHudControl({ x: 0.5, y: 0.5, scale: 1 }, 1000, -1000, 600, 300)).toEqual({ x: 1, y: 0, scale: 1 });
});

it('ignores corrupt, incomplete and out-of-range saved layouts', () => {
    for (const value of ['broken', '{}', JSON.stringify(Object.fromEntries(HUD_IDS.map(id => [id, { x: 2, y: 0.5, scale: 1 }]))),
        JSON.stringify(Object.fromEntries(HUD_IDS.map(id => [id, { x: 0.5, y: 0.5, scale: 10 }])))] ) {
        localStorage.setItem(HUD_STORAGE_KEY, value);
        expect(readHudLayout()).toBeNull();
    }
});
