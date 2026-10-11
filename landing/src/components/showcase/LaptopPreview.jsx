import { useEffect, useRef } from 'react';
import { Cursor } from '@phosphor-icons/react';

export default function LaptopPreview({ state, onInput }) {
  const note = useRef(null);
  useEffect(() => { if (note.current) note.current.scrollTop = state.scroll; }, [state.scroll]);
  const clearNote = () => onInput({ type: 'demo.clear-note' });

  return (
    <div className="laptop-preview" aria-label="Simulated laptop">
      <div className="laptop-lid">
        <span className="laptop-camera" aria-hidden="true" />
        <div className="laptop-screen">
          <div className="laptop-app-title">Cortext playground</div>
          <button className="laptop-new-note" type="button" onClick={clearNote}>New note</button>
          <button className="laptop-clear-note" type="button" onClick={clearNote}>Clear note</button>
          <div ref={note} className={`laptop-note${state.selected ? ' is-selected' : ''}`} style={{ '--note-font-size': `${14 * state.zoom}px` }}>
            {state.text ? <pre aria-label="Received keyboard text">{state.text}<span className="note-caret" aria-hidden="true">▏</span></pre> : <p>Type in the phone’s keyboard and press Send, or switch to live typing. Your words will appear here.</p>}
          </div>
          {state.menu && <div className="laptop-context-menu" style={{ left: `${Math.min(state.x, 65)}%`, top: `${Math.min(state.y, 65)}%` }}><button type="button" onClick={clearNote}>Clear note</button><span>Right-click received</span></div>}
          {state.gamepad?.type === 'gamepad.stick' && <div className="demo-gamepad-marker" style={{ left: `${50 + state.gamepad.x * 30}%`, top: `${50 + state.gamepad.y * 30}%` }} aria-label="Controller stick position" />}
          <div key={state.clicks} className="laptop-cursor" style={{ left: `${state.x}%`, top: `${state.y}%` }} aria-hidden="true"><Cursor size={25} weight="fill" /></div>
          <div className="laptop-taskbar"><span>CORTEXT</span><span>{Math.round(state.zoom * 100)}%</span></div>
        </div>
      </div>
      <div className="laptop-base" aria-hidden="true"><span /></div>
    </div>
  );
}
