import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  captureHudLayout,
  HUD_STORAGE_KEY,
  moveHudControl,
  readHudLayout,
  screenDelta,
} from './hudLayout.js';

export function useHudEditor(shellRef, editing, onFinish) {
  const [layout, setLayout] = useState(readHudLayout);
  const [selected, setSelected] = useState('stick');
  const original = useRef(layout);
  const wasEditing = useRef(false);
  const gesture = useRef(null);
  const changed = useRef(false);
  const resetPending = useRef(false);

  useLayoutEffect(() => {
    if (editing && !layout) setLayout(captureHudLayout(shellRef.current));
  }, [editing, layout, shellRef]);

  useEffect(() => {
    if (editing && !wasEditing.current) {
      original.current = layout;
      changed.current = false;
      resetPending.current = false;
    }
    if (!editing && wasEditing.current) {
      const saved = changed.current ? layout : resetPending.current ? null : original.current;
      setLayout(saved);
      try {
        if (saved) localStorage.setItem(HUD_STORAGE_KEY, JSON.stringify(saved));
        else localStorage.removeItem(HUD_STORAGE_KEY);
      } catch {
        /* Editing still works when device storage is unavailable. */
      }
    }
    wasEditing.current = editing;
    if (!editing) gesture.current = null;
  }, [editing, layout]);

  function props(id) {
    const item = layout?.[id];
    return {
      'data-hud-id': id,
      'data-selected': editing && selected === id ? 'true' : undefined,
      ...(item
        ? {
            style: {
              '--hud-x': `${item.x * 100}%`,
              '--hud-y': `${item.y * 100}%`,
              '--hud-scale': item.scale,
            },
          }
        : {}),
    };
  }

  function stop(event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const handlers = editing
    ? {
        onPointerDownCapture(event) {
          const control = event.target.closest('[data-hud-id]');
          if (!control || !layout || event.button > 0) return;
          stop(event);
          const id = control.dataset.hudId;
          setSelected(id);
          control.focus();
          const shell = shellRef.current;
          gesture.current = {
            id,
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            item: layout[id],
            width: shell.offsetWidth,
            height: shell.offsetHeight,
            rotation: Number(getComputedStyle(shell).getPropertyValue('--controller-rotation')),
          };
          shell.setPointerCapture?.(event.pointerId);
        },
        onPointerMoveCapture(event) {
          const drag = gesture.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          stop(event);
          const delta = screenDelta(event.clientX - drag.x, event.clientY - drag.y, drag.rotation);
          if (!drag.width || !drag.height) return;
          changed.current = true;
          resetPending.current = false;
          setLayout((current) => ({
            ...current,
            [drag.id]: moveHudControl(drag.item, delta.x, delta.y, drag.width, drag.height),
          }));
        },
        onPointerUpCapture(event) {
          if (gesture.current?.pointerId !== event.pointerId) return;
          stop(event);
          gesture.current = null;
          shellRef.current.releasePointerCapture?.(event.pointerId);
        },
        onPointerCancelCapture(event) {
          const drag = gesture.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          setLayout((current) => ({ ...current, [drag.id]: drag.item }));
          gesture.current = null;
        },
        onFocusCapture(event) {
          const id = event.target.closest('[data-hud-id]')?.dataset.hudId;
          if (id) setSelected(id);
        },
        onKeyDownCapture(event) {
          const id = event.target.closest('[data-hud-id]')?.dataset.hudId;
          if (!id || !layout?.[id]) return;
          const delta = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
          }[event.key];
          if (!delta) return;
          stop(event);
          const shell = shellRef.current;
          const step = event.shiftKey ? 16 : 4;
          const local = screenDelta(
            delta[0] * step,
            delta[1] * step,
            Number(getComputedStyle(shell).getPropertyValue('--controller-rotation')),
          );
          if (shell.offsetWidth && shell.offsetHeight) {
            changed.current = true;
            resetPending.current = false;
            setLayout((current) => ({
              ...current,
              [id]: moveHudControl(
                current[id],
                local.x,
                local.y,
                shell.offsetWidth,
                shell.offsetHeight,
              ),
            }));
          }
        },
      }
    : {};

  return {
    layout,
    selected,
    setSelected,
    props,
    handlers,
    scale: layout?.[selected]?.scale ?? 1,
    resize(scale) {
      if (!layout) return;
      changed.current = true;
      resetPending.current = false;
      setLayout((current) => ({ ...current, [selected]: { ...current[selected], scale } }));
    },
    reset() {
      changed.current = false;
      resetPending.current = true;
      setLayout(null);
    },
    cancel() {
      changed.current = false;
      resetPending.current = false;
      setLayout(original.current);
      onFinish();
    },
  };
}
