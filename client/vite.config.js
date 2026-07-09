import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = (() => {
    const apiUrl = env.VITE_API_URL || 'http://localhost:5000/api/v1';
    try {
      return new URL(apiUrl).origin;
    } catch {
      return 'http://localhost:5000';
    }
  })();
  const chunkGroups = {
    vendor: ['react', 'react-dom', 'react-router-dom'],
    query: ['@tanstack/react-query'],
    motion: ['framer-motion'],
    charts: ['recharts'],
    icons: ['lucide-react'],
    forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
  };

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
      minify: 'esbuild',
      esbuildOptions: {
        drop: ['console', 'debugger'],
      },
      rollupOptions: {
        output: {
          manualChunks: chunkGroups,
        },
      },
      chunkSizeWarningLimit: 500,
      sourcemap: false,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
