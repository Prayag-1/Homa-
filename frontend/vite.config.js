import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const proxyTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000';
const chunkGroups = {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  query: ['@tanstack/react-query'],
  motion: ['framer-motion'],
  charts: ['recharts'],
  icons: ['lucide-react'],
  forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(here, './src') },
  },
  build: {
    minify: 'esbuild',
    esbuildOptions: { drop: ['console', 'debugger'] },
    rollupOptions: { output: { manualChunks: chunkGroups } },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
  },
  server: {
    proxy: { '/api': { target: proxyTarget, changeOrigin: true } },
  },
});
