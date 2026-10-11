import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const dependencies = ['react', 'react-dom', '@phosphor-icons/react', '@dnd-kit/react', '@dnd-kit/dom', 'web-haptics'];

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    dedupe: dependencies,
    alias: [
      { find: 'web-haptics/react', replacement: fileURLToPath(new URL('./node_modules/web-haptics/dist/react/index.mjs', import.meta.url)) },
      ...dependencies.map(name => ({
        find: name,
        replacement: fileURLToPath(new URL(`./node_modules/${name}`, import.meta.url)),
      })),
    ],
  },
  server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
  build: {
    rollupOptions: {
      input: {
        landing: fileURLToPath(new URL('./index.html', import.meta.url)),
        demo: fileURLToPath(new URL('./demo/index.html', import.meta.url)),
      },
    },
  },
});
