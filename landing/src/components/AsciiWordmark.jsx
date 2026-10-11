import { AsciiText } from "./ui/AsciiText.jsx";
import "./AsciiWordmark.css";

export default function AsciiWordmark() {
  return (
    <h1 className="ascii-wordmark" aria-label="Cortext">
      <AsciiText
        text="CORTEXT"
        animation="wave"
        speed={0.7}
        color="var(--accent)"
        aria-hidden="true"
      />
    </h1>
  );
}
