import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Usar esbuild (incluido en Vite, más rápido que terser)
    minify: 'esbuild',
    // Chunk splitting inteligente
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'icons': ['react-icons/fa'],
        },
      },
    },
    // Optimizaciones de build
    cssCodeSplit: true,
    sourcemap: false, // Desactivar sourcemaps en producción
    reportCompressedSize: false, // Acelera build
    chunkSizeWarningLimit: 500,
  },
})
