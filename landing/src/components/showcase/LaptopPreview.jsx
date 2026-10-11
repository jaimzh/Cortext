import { useEffect, useRef } from 'react';
import { Cursor, NotePencil, Trash } from '@phosphor-icons/react';

export default function LaptopPreview({ state, onInput }) {
  const note = useRef(null);
  useEffect(() => {
    if (note.current) note.current.scrollTop = state.scroll;
  }, [state.scroll]);
  const clearNote = () => onInput({ type: 'demo.clear-note' });

  return (
    <div className="laptop-preview" aria-label="Simulated laptop">
      <div className="laptop-lid">
        <span className="laptop-camera" aria-hidden="true" />
        <div className="laptop-screen">
          <button className="laptop-new-note" type="button" onClick={clearNote}>
            <NotePencil size={22} aria-hidden="true" /> New note
          </button>
          <button className="laptop-clear-note" type="button" onClick={clearNote}>
            <Trash size={22} aria-hidden="true" /> Clear note
          </button>
          <div
            ref={note}
            className={`laptop-note${state.selected ? ' is-selected' : ''}`}
            style={{ '--note-font-size': `${14 * state.zoom}px` }}
          >
            {state.text ? (
              <pre aria-label="Received keyboard text">
                {state.text}
                <span className="note-caret" aria-hidden="true">
                  ▏
                </span>
              </pre>
            ) : (
              <p>Move your mouse around, or type something using the phone keyboard.</p>
            )}
          </div>
          {state.menu && (
            <div
              className="laptop-context-menu"
              style={{ left: `${Math.min(state.x, 65)}%`, top: `${Math.min(state.y, 65)}%` }}
            >
              <button type="button" onClick={clearNote}>
                <Trash size={16} aria-hidden="true" /> Clear note
              </button>
            </div>
          )}
          {state.gamepad?.type === 'gamepad.stick' && (
            <div
              className="demo-gamepad-marker"
              style={{
                left: `${50 + state.gamepad.x * 30}%`,
                top: `${50 + state.gamepad.y * 30}%`,
              }}
              aria-label="Controller stick position"
            />
          )}
          <div
            key={state.clicks}
            className="laptop-cursor"
            style={{ left: `${state.x}%`, top: `${state.y}%` }}
            aria-hidden="true"
          >
            <Cursor size={25} weight="fill" />
          </div>
        </div>
      </div>
      <div className="laptop-base" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
