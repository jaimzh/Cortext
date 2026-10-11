import { useEffect, useRef } from 'react';
import { useController } from './useController.js';
import { useHudEditor } from './useHudEditor.js';
import { HUD_IDS } from './hudLayout.js';
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react';
import './Controller.css';

export default function Controller({
  api,
  report,
  editing = false,
  onFinishEditing,
  onHapticPress,
  visibility = {},
}) {
  const panelRef = useRef(null);
  const shellRef = useRef(null);
  const editor = useHudEditor(shellRef, editing, onFinishEditing);
  useController(panelRef, api, report, onHapticPress, visibility);
  const visibleIds = HUD_IDS.filter((id) =>
    ['l3', 'r3'].includes(id)
      ? visibility[id] === true
      : visibility[
          id === 'stick'
            ? 'leftStick'
            : id === 'rightStick'
              ? 'rightStick'
              : id === 'dpad'
                ? 'dpad'
                : ['lt', 'rt'].includes(id)
                  ? 'triggers'
                  : ['lb', 'rb'].includes(id)
                    ? 'shoulders'
                    : ['space', 'start'].includes(id)
                      ? 'system'
                      : 'face'
        ] !== false,
  );
  useEffect(() => {
    if (!visibleIds.includes(editor.selected) && visibleIds.length)
      editor.setSelected(visibleIds[0]);
  }, [visibility, editor.selected]);
  useEffect(() => {
    if (editing) panelRef.current.dispatchEvent(new Event('controller:edit'));
  }, [editing]);
  return (
    <section
      ref={panelRef}
      id="controllerPanel"
      className="panel controller-panel"
      data-editing={editing}
    >
      {editing && (
        <div className="hud-editor-toolbar" aria-label="Layout settings">
          <label className="hud-control-picker">
            Control
            <select
              aria-label="Select control"
              value={editor.selected}
              onChange={(event) => editor.setSelected(event.target.value)}
            >
              {visibleIds.map((id) => (
                <option key={id} value={id}>
                  {id === 'stick'
                    ? 'Left stick'
                    : id === 'rightStick'
                      ? 'Right stick'
                      : id === 'dpad'
                        ? 'D-pad'
                        : id === 'space'
                          ? 'Select'
                          : id === 'start'
                            ? 'Start'
                            : id.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="hud-size-picker">
            Size
            <input
              aria-label="Control size"
              type="range"
              min="60"
              max="160"
              step="5"
              value={Math.round(editor.scale * 100)}
              onChange={(event) => editor.resize(Number(event.target.value) / 100)}
            />
            <output>{Math.round(editor.scale * 100)}%</output>
          </label>
          <button type="button" className="hud-editor-button" onClick={editor.reset}>
            Reset
          </button>
          <button type="button" className="hud-editor-button" onClick={editor.cancel}>
            Cancel
          </button>
        </div>
      )}
      <div className="controller-viewport">
        <div
          ref={shellRef}
          className="controller-shell"
          role="application"
          aria-label="Game controller"
          data-custom-layout={Boolean(editor.layout)}
          {...editor.handlers}
        >
          {['l3', 'r3'].map((id, index) => (
            <button
              key={id}
              {...editor.props(id)}
              hidden={visibility[id] !== true}
              type="button"
              className={`controller-button stick-click-button ${id}-button`}
              data-gamepad-button={index === 0 ? 'left_stick' : 'right_stick'}
              title={`Hold to press ${id.toUpperCase()}`}
            >
              <span className="button-label">{id.toUpperCase()}</span>
            </button>
          ))}
          <div className="controller-cluster movement-cluster" aria-label="Movement controls">
            <button
              {...editor.props('lt')}
              hidden={visibility.triggers === false}
              className="controller-button shoulder-button"
              type="button"
              data-gamepad-trigger="left"
              title="Hold to reach full pressure, or slide to adjust; release to reset"
            >
              <span className="button-label">LT</span>
            </button>
            <button
              {...editor.props('lb')}
              hidden={visibility.shoulders === false}
              className="controller-button shoulder-button"
              type="button"
              data-gamepad-button="lb"
            >
              <span className="button-label">LB</span>
            </button>
            <div
              {...editor.props('stick')}
              hidden={visibility.leftStick === false}
              tabIndex={editing ? 0 : undefined}
              id="leftStick"
              className="stick-pad"
              data-gamepad-stick="left"
              aria-label="Left stick"
              title="Drag to move. Double-tap and hold for L3."
              aria-description="Drag to move. Double-tap and hold to press L3; release to let go."
            >
              <div className="stick-knob" aria-hidden="true"></div>
            </div>
          </div>

          <div
            {...editor.props('dpad')}
            hidden={visibility.dpad === false}
            tabIndex={editing ? 0 : undefined}
            className="controller-dpad"
            aria-label="D-pad"
          >
            {[
              ['up', ArrowUpIcon],
              ['left', ArrowLeftIcon],
              ['right', ArrowRightIcon],
              ['down', ArrowDownIcon],
            ].map(([direction, Icon]) => (
              <button
                key={direction}
                type="button"
                className={`controller-button dpad-button dpad-${direction}`}
                data-gamepad-button={`dpad_${direction}`}
                aria-label={`D-pad ${direction}`}
              >
                <Icon size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div
            className="controller-center"
            aria-label="System controls"
            hidden={visibility.system === false}
          >
            <button
              {...editor.props('space')}
              className="controller-button system-button"
              type="button"
              data-gamepad-button="back"
            >
              <span className="button-label">Select</span>
            </button>
            <button
              {...editor.props('start')}
              className="controller-button system-button"
              type="button"
              data-gamepad-button="start"
            >
              <span className="button-label">Start</span>
            </button>
          </div>

          <div
            {...editor.props('rightStick')}
            hidden={visibility.rightStick === false}
            tabIndex={editing ? 0 : undefined}
            id="rightStick"
            className="stick-pad right-stick"
            data-gamepad-stick="right"
            aria-label="Right stick"
            title="Drag to look. Double-tap and hold for R3."
            aria-description="Drag to move. Double-tap and hold to press R3; release to let go."
          >
            <div className="stick-knob" aria-hidden="true"></div>
          </div>
          <div className="controller-cluster action-cluster" aria-label="Action controls">
            <button
              {...editor.props('rt')}
              hidden={visibility.triggers === false}
              className="controller-button shoulder-button"
              type="button"
              data-gamepad-trigger="right"
              title="Hold to reach full pressure, or slide to adjust; release to reset"
            >
              <span className="button-label">RT</span>
            </button>
            <button
              {...editor.props('rb')}
              hidden={visibility.shoulders === false}
              className="controller-button shoulder-button"
              type="button"
              data-gamepad-button="rb"
            >
              <span className="button-label">RB</span>
            </button>
            <button
              {...editor.props('y')}
              hidden={visibility.face === false}
              className="controller-button action-button y-button"
              type="button"
              data-gamepad-button="y"
            >
              <span className="button-label">Y</span>
            </button>
            <button
              {...editor.props('x')}
              hidden={visibility.face === false}
              className="controller-button action-button x-button"
              type="button"
              data-gamepad-button="x"
            >
              <span className="button-label">X</span>
            </button>
            <button
              {...editor.props('b')}
              hidden={visibility.face === false}
              className="controller-button action-button b-button"
              type="button"
              data-gamepad-button="b"
            >
              <span className="button-label">B</span>
            </button>
            <button
              {...editor.props('a')}
              hidden={visibility.face === false}
              className="controller-button action-button a-button"
              type="button"
              data-gamepad-button="a"
            >
              <span className="button-label">A</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
