import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/p0/',
  plugins: [react()],
  build: {
    outDir: "docs"
  }
})
