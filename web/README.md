# Cortext frontend

React + Vite frontend for the Python FastAPI backend. Styles use plain CSS.

## Run the app

From the repository root, run `run_backend.bat`. It installs frontend dependencies
if needed, builds the frontend, and starts the HTTPS backend on port 8001.
Use the `/app?token=...` link or QR code provided by the TUI as before.

For frontend development, start the backend and then run these commands in `web/`:

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173/app/?token=...` with the same session token.
Vite proxies API requests and controller WebSockets to `https://127.0.0.1:8001`.
For a backend served over HTTP or a different port, set `CORTEXT_BACKEND_URL`
before starting Vite. Phone microphone access requires a secure browser context;
use the backend's HTTPS app link for phone recording.

```powershell
npm.cmd run build
npm.cmd test
```

FastAPI serves the generated `dist/index.html` at `/app` and `/app/`, with bundled
assets under `/app/assets/`. Rebuild after source changes when using the backend
directly. Without a build, `/app` responds with a setup message and HTTP 503.

## Structure

- `src/App.jsx`: owns the shared API connection and its lifetime.
- `src/layouts/MainLayout.jsx`: selects views and displays shared feedback.
- `src/features/mouse/`: touchpad, scrolling, mouse buttons, and sensitivity.
- `src/features/keyboard/`: text input, keys, and existing shortcuts.
- `src/features/voice/`: microphone capture and transcription settings.
- `src/features/controller/`: gamepad controls and fullscreen behavior.
- `src/services/api.js`: authenticated HTTP requests and shared WebSocket transport.
- `src/styles/global.css`: shared styles and theme variables.

The mouse stays above an icon ribbon that switches the lower panel between keyboard
and voice. Controller has a separate top-level view. Switching away keeps
the keyboard draft and sensitivity, but stops mouse gestures and releases a drag.
Voice and controller unmount when their views close, releasing the microphone or
held gamepad controls. Gesture engines attach to component refs through hooks;
high-frequency movement does not trigger React rendering.

Drag the horizontal divider above the ribbon to resize the touchpad (120–640px).
The touch scroll strip follows the same height. The divider uses dnd-kit React;
resizing is restricted to the handle, so touchpad gestures remain independent.
Focus the divider and use Up/Down (Shift for larger steps), Home/End for limits,
or double-click to restore the default size. The height is saved on this device.

Additional keyboard modes and the draggable/resizable sidebar
are future additions. Keep their UI in the appropriate feature or layout folder.
