import { ArrowRight, DeviceMobile, Desktop, Terminal } from '@phosphor-icons/react';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section container">
      <div className="section-heading">
        <div>
          <h2>
            Connect in
            <br />
            three steps.
          </h2>
        </div>
        <p>
          Run Cortext on your computer, connect your phone over the same network, and choose your
          controls.
        </p>
      </div>
      <div className="connection-diagram">
        <div>
          <DeviceMobile size={36} />
          <h3>Your phone</h3>
          <p>React web interface</p>
        </div>
        <ArrowRight className="connection-arrow" size={24} />
        <div>
          <Terminal size={36} />
          <h3>Local server</h3>
          <p>Python · FastAPI · WebSocket</p>
        </div>
        <ArrowRight className="connection-arrow" size={24} />
        <div>
          <Desktop size={36} />
          <h3>Your computer</h3>
          <p>Mouse, keys, voice & gamepad</p>
        </div>
      </div>
      <div className="steps">
        <article>
          <h3>Start a session</h3>
          <p>Launch Cortext on your computer and open the terminal interface.</p>
        </article>
        <article>
          <h3>Connect your phone</h3>
          <p>Join the same network and open the session link or scan its QR code.</p>
        </article>
        <article>
          <h3>Choose your controls</h3>
          <p>Pick your input mode, adjust the panels, and arrange your controller.</p>
        </article>
      </div>
    </section>
  );
}
