import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = process.env.CORTEXT_BACKEND_URL || 'https://127.0.0.1:8001';
const routes = ['/transcribe', '/keyboard', '/mouse', '/controller', '/models', '/session', '/health', '/qr'];

export default defineConfig({
    plugins: [react()],
    base: '/app/',
    server: {
        proxy: Object.fromEntries(routes.map(route => [route, {
            target: backend,
            changeOrigin: true,
            secure: false,
            ws: route === '/controller',
        }])),
    },
    test: { environment: 'jsdom' },
});
