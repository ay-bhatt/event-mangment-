import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { autoQrsPlugin } from './vite-plugin-auto-qrs'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    autoQrsPlugin(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      ignored: ['**/src/generatedQRCodes/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
