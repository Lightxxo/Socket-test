import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // or you can specify your IP directly, e.g., '192.168.1.101'
    port: 3000, // optional: set a custom port
  }
})
