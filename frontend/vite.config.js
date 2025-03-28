import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false // 🔇 disables the red fullscreen overlay on dev errors
    }
  }
})
