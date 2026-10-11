import { useEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowClockwise, ArrowRight } from '@phosphor-icons/react';
import LaptopPreview from '../components/showcase/LaptopPreview.jsx';
import { applyDemoInput, initialDemoState } from '../demo/demoState.js';
import '../components/showcase/Showcase.css';

export default function Showcase() {
  const frame = useRef(null);
  const [generation, setGeneration] = useState(0);
  const [state, dispatch] = useReducer(
    (current, event) =>
      event.type === 'demo.reset' ? initialDemoState() : applyDemoInput(current, event),
    undefined,
    initialDemoState,
  );

  useEffect(() => {
    function receive(event) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow)
        return;
      if (event.data?.type === 'cortext-demo') dispatch(event.data.event || {});
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

  function reset() {
    dispatch({ type: 'demo.reset' });
    setGeneration((value) => value + 1);
  }

  return (
    <section id="showcase" className="section container">
      <div className="section-heading">
        <h2>See Cortext in action.</h2>
        <p>
          Try the actual Cortext interface. Move the touchpad, click Left or Right, or send text to
          the simulated laptop. Voice transcription requires the local app.
        </p>
      </div>
      <div className="interactive-showcase">
        <div className="phone-preview">
          <iframe
            key={generation}
            ref={frame}
            src="/demo/index.html"
            title="Interactive Cortext phone interface"
            loading="lazy"
            allow="microphone 'none'; camera 'none'; fullscreen"
            allowFullScreen
          />
        </div>
        <div className="laptop-column">
          <LaptopPreview state={state} onInput={dispatch} />
          <p className="demo-feedback" role="status">
            {state.feedback}
          </p>
          <div className="demo-links">
            <button className="demo-reset" type="button" onClick={reset}>
              <ArrowClockwise size={17} /> Reset demo
            </button>
            <Link className="text-link" to="/field-notes/">
              Explore the controls <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
