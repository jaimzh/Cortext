import { useEffect, useRef, useState } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react';

export const CONTROL_GROUPS = [
  ['leftStick', 'Left stick'],
  ['rightStick', 'Right stick'],
  ['dpad', 'D-pad'],
  ['l3', 'L3 button'],
  ['r3', 'R3 button'],
  ['face', 'A / B / X / Y'],
  ['shoulders', 'LB / RB'],
  ['triggers', 'LT / RT'],
  ['system', 'Select / Start'],
];
export const VISIBILITY_KEY = 'cortext.controllerVisibility';
export function useControllerVisibility() {
  const [visibility, setVisibility] = useState(() => {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(VISIBILITY_KEY));
    } catch {}
    return Object.fromEntries(
      CONTROL_GROUPS.map(([id]) => [
        id,
        ['l3', 'r3'].includes(id) ? saved?.[id] === true : saved?.[id] !== false,
      ]),
    );
  });
  useEffect(() => {
    try {
      localStorage.setItem(VISIBILITY_KEY, JSON.stringify(visibility));
    } catch {}
  }, [visibility]);
  return [visibility, setVisibility];
}

export default function ControllerOptions({ visibility, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    function outside(event) {
      if (!rootRef.current.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current.focus();
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <div ref={rootRef} className="controller-options">
      <button
        ref={buttonRef}
        type="button"
        className="controller-edit-button"
        aria-label="Visible controls"
        title="Visible controls"
        aria-expanded={open}
        aria-controls="controllerVisibility"
        onClick={() => setOpen((value) => !value)}
      >
        <CaretDownIcon size={18} aria-hidden="true" />
      </button>
      {open && (
        <div
          id="controllerVisibility"
          className="controller-options-popover"
          role="group"
          aria-label="Visible controls"
        >
          {CONTROL_GROUPS.map(([id, label]) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={visibility[id]}
                onChange={(event) =>
                  onChange((current) => ({ ...current, [id]: event.target.checked }))
                }
              />
              {label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
