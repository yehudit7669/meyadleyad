import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode})=>{
  const env = loadEnv(mode, process.cwd());
  console.log(`Running in ${mode} mode`);
  console.log(`API URL: ${env.VITE_API_URL}`);
  console.log(`env`, JSON.stringify(env, null, 2));
  return {
  plugins: [react()],
  build: {
    outDir: mode === 'staging' ? 'dist-staging' : 'dist',
  },
  define: {
    'window.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: parseInt(env.VITE_PORT) || 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
}});
