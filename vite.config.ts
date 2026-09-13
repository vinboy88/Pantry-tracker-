import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Project Pages URL is https://<user>.github.io/Pantry-tracker-/
// (the repo name includes a trailing hyphen). Local dev/preview stay at "/".
const pagesBase = process.env.GITHUB_PAGES === 'true' ? '/Pantry-tracker-/' : '/'

export default defineConfig({
  base: pagesBase,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
