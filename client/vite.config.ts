import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode})=>{
  const env = loadEnv(mode, process.cwd());

  const buildId = Date.now(); // or crypto.randomUUID()


  console.log(`Running in ${mode} mode`);
  console.log(`API URL: ${env.VITE_API_URL}`);
  console.log(`env`, JSON.stringify(env, null, 2));
  return {
  plugins: [react()],
  build: {
    outDir: mode === 'staging' ? 'dist-staging' : 'dist',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].${buildId}.js`,
        chunkFileNames: `assets/[name].[hash].${buildId}.js`,
        assetFileNames: `assets/[name].[hash].${buildId}.[ext]`,
      },
    }
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
