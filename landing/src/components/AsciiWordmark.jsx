import { asciiWordmark } from '../content/brand.js';
import './AsciiWordmark.css';

export default function AsciiWordmark() {
  return (
    <h1 className="ascii-wordmark" aria-label="Cortext">
      <pre aria-hidden="true">{asciiWordmark}</pre>
    </h1>
  );
}
