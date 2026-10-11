import { ArrowsInIcon, ArrowsOutIcon } from '@phosphor-icons/react';
import './FullscreenButton.css';

export default function FullscreenButton({ active, busy, onToggle }) {
  const label = active ? 'Exit fullscreen' : 'Enter fullscreen';
  return (
    <button
      className="fullscreen-button"
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      aria-busy={busy}
      disabled={busy}
      onClick={onToggle}
    >
      {active ? (
        <ArrowsInIcon size={22} aria-hidden="true" />
      ) : (
        <ArrowsOutIcon size={22} aria-hidden="true" />
      )}
    </button>
  );
}
