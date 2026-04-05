import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    allowedHosts: ['susan-hyperexcitable-werner.ngrok-free.dev'],
    proxy: {
      '/ws': {
        target: 'http://127.0.0.1:3001',
        ws: true,
      },
      '/api': {
        target: 'http://127.0.0.1:3001',
      },
    },
  },
});
