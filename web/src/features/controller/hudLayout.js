export const HUD_STORAGE_KEY = 'cortext.controllerLayout.v1';
export const HUD_IDS = ['lt', 'lb', 'stick', 'space', 'start', 'rt', 'rb', 'y', 'x', 'b', 'a'];

export function readHudLayout() {
    try {
        const layout = JSON.parse(localStorage.getItem(HUD_STORAGE_KEY));
        if (!layout || !HUD_IDS.every(id => {
            const item = layout[id];
            return item && Number.isFinite(item.x) && item.x >= 0 && item.x <= 1
                && Number.isFinite(item.y) && item.y >= 0 && item.y <= 1
                && Number.isFinite(item.scale) && item.scale >= 0.6 && item.scale <= 1.6;
        })) return null;
        return Object.fromEntries(HUD_IDS.map(id => [id, layout[id]]));
    } catch { return null; }
}

export function screenDelta(dx, dy, rotation) {
    const angle = rotation * Math.PI / 180;
    return { x: dx * Math.cos(angle) + dy * Math.sin(angle), y: dy * Math.cos(angle) - dx * Math.sin(angle) };
}

export function moveHudControl(item, dx, dy, width, height) {
    return { ...item, x: Math.max(0, Math.min(1, item.x + dx / width)), y: Math.max(0, Math.min(1, item.y + dy / height)) };
}

export function captureHudLayout(shell) {
    const bounds = shell.getBoundingClientRect();
    const rotation = Number(getComputedStyle(shell).getPropertyValue('--controller-rotation'));
    const width = shell.offsetWidth;
    const height = shell.offsetHeight;
    if (!width || !height) return null;
    return Object.fromEntries([...shell.querySelectorAll('[data-hud-id]')].map(control => {
        const rect = control.getBoundingClientRect();
        const delta = screenDelta(rect.left + rect.width / 2 - bounds.left - bounds.width / 2,
            rect.top + rect.height / 2 - bounds.top - bounds.height / 2, rotation);
        return [control.dataset.hudId, { x: (width / 2 + delta.x) / width, y: (height / 2 + delta.y) / height, scale: 1 }];
    }));
}
