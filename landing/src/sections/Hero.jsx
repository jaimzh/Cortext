import { Link } from "react-router";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import AsciiWordmark from '../components/AsciiWordmark.jsx';
import Button from '../components/Button.jsx';
import { tagline } from '../content/brand.js';

export default function Hero() {
  return (
    <section className="hero container">
      <p className="eyebrow">
        <span className="status-dot" /> A PERSONAL PROJECT, WITH ROOM TO PLAY
      </p>
      <AsciiWordmark />
      <p className="hero-tagline">{tagline}</p>
      <div className="hero-bottom">
        <p>
          A touchpad, keyboard, microphone, and controller.
          <br className="desktop-break" /> Cortext puts them all on the screen
          already in your hand.
        </p>
        <div className="hero-actions">
          <Button to="/docs/">
            Get set up <ArrowUpRight size={19} />
          </Button>
          <Link className="text-link" to="#showcase">
            Take a look <ArrowRight size={18} />
          </Link>
        </div>
      </div>
      <div className="hero-foot">
        <span>{tagline.toUpperCase()}</span>
        <span>REACT / PYTHON / WEBSOCKET</span>
      </div>
    </section>
  );
}
