export const HUD_STORAGE_KEY = 'cortext.controllerLayout.v1';
const ORIGINAL_IDS = ['lt', 'lb', 'stick', 'space', 'start', 'rt', 'rb', 'y', 'x', 'b', 'a'];
export const HUD_IDS = [...ORIGINAL_IDS, 'rightStick', 'dpad', 'l3', 'r3'];
const DEFAULT_POSITIONS = {
  lt: [0.14, 0.12],
  lb: [0.14, 0.27],
  stick: [0.14, 0.66],
  space: [0.5, 0.58],
  start: [0.5, 0.73],
  rt: [0.87, 0.12],
  rb: [0.87, 0.27],
  y: [0.87, 0.48],
  x: [0.79, 0.66],
  b: [0.95, 0.66],
  a: [0.87, 0.84],
  rightStick: [0.67, 0.66],
  dpad: [0.34, 0.66],
  l3: [0.34, 0.26],
  r3: [0.67, 0.26],
};
function defaultItem(id) {
  const [x, y] = DEFAULT_POSITIONS[id];
  return { x, y, scale: 1 };
}

export function readHudLayout() {
  try {
    const layout = JSON.parse(localStorage.getItem(HUD_STORAGE_KEY));
    if (
      !layout ||
      !ORIGINAL_IDS.every((id) => layout[id]) ||
      !HUD_IDS.every((id) => {
        const item = layout[id];
        if (!item && !ORIGINAL_IDS.includes(id)) return true;
        return (
          item &&
          Number.isFinite(item.x) &&
          item.x >= 0 &&
          item.x <= 1 &&
          Number.isFinite(item.y) &&
          item.y >= 0 &&
          item.y <= 1 &&
          Number.isFinite(item.scale) &&
          item.scale >= 0.6 &&
          item.scale <= 1.6
        );
      })
    )
      return null;
    return Object.fromEntries(HUD_IDS.map((id) => [id, layout[id] || defaultItem(id)]));
  } catch {
    return null;
  }
}

export function screenDelta(dx, dy, rotation) {
  const angle = (rotation * Math.PI) / 180;
  return {
    x: dx * Math.cos(angle) + dy * Math.sin(angle),
    y: dy * Math.cos(angle) - dx * Math.sin(angle),
  };
}

export function moveHudControl(item, dx, dy, width, height) {
  return {
    ...item,
    x: Math.max(0, Math.min(1, item.x + dx / width)),
    y: Math.max(0, Math.min(1, item.y + dy / height)),
  };
}

export function captureHudLayout(shell) {
  const bounds = shell.getBoundingClientRect();
  const rotation = Number(getComputedStyle(shell).getPropertyValue('--controller-rotation'));
  const width = shell.offsetWidth;
  const height = shell.offsetHeight;
  if (!width || !height) return null;
  return Object.fromEntries(
    [...shell.querySelectorAll('[data-hud-id]')].map((control) => {
      if (control.closest('[hidden]'))
        return [control.dataset.hudId, defaultItem(control.dataset.hudId)];
      const rect = control.getBoundingClientRect();
      const delta = screenDelta(
        rect.left + rect.width / 2 - bounds.left - bounds.width / 2,
        rect.top + rect.height / 2 - bounds.top - bounds.height / 2,
        rotation,
      );
      return [
        control.dataset.hudId,
        { x: (width / 2 + delta.x) / width, y: (height / 2 + delta.y) / height, scale: 1 },
      ];
    }),
  );
}
