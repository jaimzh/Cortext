import { asciiC } from './cortextBrand.js';

export default function CortextLogo({ onAbout, buttonRef, compact = false }) {
  return (
    <button
      ref={buttonRef}
      className={`app-logo${compact ? ' toolbar-logo' : ''}`}
      type="button"
      aria-label="About Cortext"
      title="About Cortext"
      onClick={onAbout}
    >
      <pre aria-hidden="true">{asciiC}</pre>
    </button>
  );
}
