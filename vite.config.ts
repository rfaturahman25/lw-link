import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@frontend': path.resolve(__dirname, './src/frontend'),
      '@backend': path.resolve(__dirname, './src/backend'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/ready': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  
  build: {
    outDir: 'dist/frontend',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          utils: ['@tanstack/react-query', 'qrcode.react'],
        },
      },
    },
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})