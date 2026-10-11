import { useRef, useState } from 'react';
import { DragDropProvider, useDraggable } from '@dnd-kit/react';
import { AutoScroller, Cursor, Feedback, PointerSensor } from '@dnd-kit/dom';

const STORAGE_KEY = 'cortext.mouseHeight';
const DEFAULT_HEIGHT = 320;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 640;
const clamp = (height) => Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height)));

function loadHeight() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const height = stored === null ? NaN : Number(stored);
    return Number.isFinite(height) ? clamp(height) : DEFAULT_HEIGHT;
  } catch {
    return DEFAULT_HEIGHT;
  }
}

function saveHeight(height) {
  try {
    localStorage.setItem(STORAGE_KEY, String(height));
  } catch {
    // Resizing still works when browser storage is unavailable.
  }
}

// The layout itself moves the separator; disable drag clones and auto-scrolling.
const plugins = (defaults) => [
  ...defaults.filter((plugin) => ![AutoScroller, Cursor, Feedback].includes(plugin)),
  Feedback.configure({ feedback: 'none', dropAnimation: null }),
];
// Separator arrow keys resize directly rather than starting keyboard drag mode.
const sensors = [PointerSensor.configure({ activationConstraints: () => undefined })];

function Divider({ height, active, onResize }) {
  const { ref, isDragging } = useDraggable({ id: 'mouse-panel-divider', disabled: !active });

  function resizeWithKeyboard(event) {
    let next;
    const step = event.shiftKey ? 48 : 16;
    if (event.key === 'ArrowUp') next = height - step;
    else if (event.key === 'ArrowDown') next = height + step;
    else if (event.key === 'Home') next = MIN_HEIGHT;
    else if (event.key === 'End') next = MAX_HEIGHT;
    else return;
    event.preventDefault();
    onResize(next);
  }

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={active ? 0 : -1}
      className={`workspace-divider${isDragging ? ' is-resizing' : ''}`}
      aria-label="Resize mouse panel"
      aria-orientation="horizontal"
      aria-controls="trackpadPanel"
      aria-valuemin={MIN_HEIGHT}
      aria-valuemax={MAX_HEIGHT}
      aria-valuenow={height}
      aria-valuetext={`${height} pixels`}
      onKeyDown={resizeWithKeyboard}
      title="Drag to resize. Arrow keys adjust size. Double-click to reset."
      onDoubleClick={() => onResize(DEFAULT_HEIGHT)}
    >
      <span className="workspace-divider-grip" aria-hidden="true" />
    </div>
  );
}

export default function ResizableWorkspace({ active, mouse, children }) {
  const [height, setHeight] = useState(loadHeight);
  const startHeight = useRef(height);

  function commit(next) {
    const size = clamp(next);
    setHeight(size);
    saveHeight(size);
  }

  function dragHeight(operation) {
    return clamp(startHeight.current + operation.position.current.y - operation.position.initial.y);
  }

  return (
    <DragDropProvider
      sensors={sensors}
      plugins={plugins}
      onDragStart={() => {
        startHeight.current = height;
      }}
      onDragMove={({ operation }) => setHeight(dragHeight(operation))}
      onDragEnd={({ operation, canceled }) => {
        if (canceled) setHeight(startHeight.current);
        else commit(dragHeight(operation));
      }}
    >
      <div className="input-workspace" hidden={!active} style={{ '--mouse-height': `${height}px` }}>
        {mouse}
        <Divider height={height} active={active} onResize={commit} />
        {children}
      </div>
    </DragDropProvider>
  );
}
