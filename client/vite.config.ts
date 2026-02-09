import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 3000,
    allowedHosts: ['roguedemo.funnysolodev2026.win'],
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
