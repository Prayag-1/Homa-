import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
const env = loadEnv(mode, process.cwd(), '');
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
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            for (const [chunkName, packages] of Object.entries(chunkGroups)) {
              if (packages.some((packageName) => normalizedId.includes(`/node_modules/${packageName}/`))) {
                return chunkName;
              }
            }
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
    server: {
      port: 5173,
      proxy: env.VITE_API_URL
        ? {
            '/api': {
              target: env.VITE_API_URL,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
});
