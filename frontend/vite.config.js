import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Dev only: forward /api to another backend (for example the live API)
      // when DEV_API_PROXY is set in .env.local
      proxy: env.DEV_API_PROXY
        ? { '/api': { target: env.DEV_API_PROXY, changeOrigin: true } }
        : undefined,
    },
    build: { outDir: 'dist', sourcemap: false },
  };
});