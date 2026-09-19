import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api/pushalert': {
        target: 'https://api.pushalert.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pushalert/, ''),
      },
    },
  },
})

