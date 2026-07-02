import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path is env-driven so the same code deploys to both targets:
//   • gh-pages (interim):     default '/gifted-exam-practice/'
//   • Vercel subdomain:       set VITE_DEPLOY_BASE=/ in the Vercel project
// The router reads import.meta.env.BASE_URL, so no code changes on switch.
const base = process.env.VITE_DEPLOY_BASE || '/gifted-exam-practice/'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
})
