import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // Exclude service account key from being processed
  optimizeDeps: {
    exclude: ['firebase-admin']
  }
})

