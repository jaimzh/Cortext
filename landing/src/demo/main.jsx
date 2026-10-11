import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../web/src/styles/global.css';
import MainLayout from '../../../web/src/layouts/MainLayout.jsx';
import './demo.css';
import { createDemoApi } from './createDemoApi.js';

// The same UI and gesture engines as the local app, in an isolated document.
// No real API client, token, HTTP requests, or WebSocket is created here.
const api = createDemoApi(event => {
  window.parent.postMessage({ type: 'cortext-demo', event }, window.location.origin);
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode><MainLayout api={api} /></React.StrictMode>,
);
