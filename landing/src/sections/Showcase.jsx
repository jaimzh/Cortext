import { Link } from 'react-router';
import { useState } from 'react';
import { Mouse, Keyboard, Microphone, GameController, ArrowsOut, ArrowRight } from '@phosphor-icons/react';
import { asciiWordmark, tagline } from '../content/brand.js';

export default function Showcase() {
  const [mode, setMode] = useState('mouse');
  const [view, setView] = useState('web');
  function switchTab(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'web' : event.key === 'End' ? 'tui' : view === 'web' ? 'tui' : 'web';
    setView(next);
    document.getElementById(`tab-${next}`).focus();
  }
  const modes = [['mouse', Mouse, 'Mouse'], ['keyboard', Keyboard, 'Keyboard'], ['voice', Microphone, 'Voice'], ['controller', GameController, 'Controller']];
  return <section id="showcase" className="section container">
    <div className="section-heading"><div><p className="eyebrow">01 / THE INTERFACE</p><h2>A familiar screen.<br />A different kind of input.</h2></div><p>A terminal on your computer. A clean control surface on your phone. Two sides of the same little project.</p></div>
    <div className="showcase-shell">
      <div className="showcase-toolbar"><div className="view-tabs" role="tablist" aria-label="Showcase interface">{[['web', 'Web interface'], ['tui', 'Terminal interface']].map(([value, label]) => <button key={value} type="button" role="tab" id={`tab-${value}`} aria-selected={view === value} tabIndex={view === value ? 0 : -1} aria-controls="interface-preview" onKeyDown={switchTab} onClick={() => setView(value)}>{label}</button>)}</div><span className="preview-label">INTERFACE ILLUSTRATION</span></div>
      <div id="interface-preview" role="tabpanel" aria-labelledby={`tab-${view}`} className="interface-preview">
        {view === 'web' ? <><div className="demo-toolbar"><div className="demo-tabs">{modes.map(([id, Icon, label]) => <button key={id} type="button" aria-label={`Preview ${label.toLowerCase()}`} aria-pressed={mode === id} onClick={() => setMode(id)}><Icon size={21} /></button>)}</div><span className="demo-logo">{'[ C ]'}</span><ArrowsOut size={20} aria-hidden="true" /></div>
          {mode === 'controller' ? <div className="controller-demo"><div><div className="shoulders"><span>LT</span><span>LB</span></div><div className="stick"><span /></div></div><div className="center-controls"><span>Select</span><span>Start</span></div><div><div className="shoulders"><span>RB</span><span>RT</span></div><div className="face-buttons"><span>Y</span><span>X</span><span>B</span><span>A</span></div></div></div> : <><div className="touchpad-demo"><div className="cursor-trail" aria-hidden="true"><Mouse size={28} /></div><span>{mode === 'mouse' ? 'A little more room to move.' : mode === 'voice' ? 'Your voice, at the cursor.' : 'From your phone to your computer.'}</span><div className="scroll-strip" aria-hidden="true"><i /></div></div><div className="mouse-buttons"><span>Left</span><span>Right</span></div><div className="demo-input">{mode === 'voice' ? <><Microphone size={22} /><span>Record. Transcribe. Paste.</span></> : <><Keyboard size={22} /><span>{mode === 'keyboard' ? 'Live typing, one keystroke at a time.' : 'Keyboard and voice, a tap away.'}</span></>}</div></>}
        </> : <div className="terminal-demo"><div className="terminal-dots" aria-hidden="true"><i /><i /><i /></div><pre aria-label="Cortext ASCII logo">{asciiWordmark}</pre><p>{tagline}</p><div className="terminal-menu"><span className="terminal-selected">› New Session</span><span>  Models</span></div><small>Start a session. Scan the QR code. Connect.</small></div>}
      </div>
      <div className="showcase-caption"><span>{view === 'web' ? 'Made for touch. Kept deliberately simple.' : 'A terminal-first starting point.'}</span><Link to="/field-notes/">Explore the controls <ArrowRight size={16} /></Link></div>
    </div>
  </section>;
}
