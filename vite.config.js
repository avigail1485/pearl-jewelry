import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so the built assets resolve correctly whether the site is
  // served from the domain root or a GitHub Pages project subpath.
  base: './',
  plugins: [react()],
})
