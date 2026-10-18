import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: '../public',
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, 'index.html'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:7653',
      '/health': 'http://127.0.0.1:7653',
    },
  },
});