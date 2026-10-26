import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // La API expuesta es Express (28523), que a su vez proxya a Go (8080).
    // Nunca apuntar el frontend directamente a Go: la API key se inyecta en Express.
    proxy: {
      '/api': {
        target: 'http://localhost:28523',
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
