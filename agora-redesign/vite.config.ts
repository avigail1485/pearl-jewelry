import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Fonts are inlined so the single-file preview build always renders Google Sans.
export default defineConfig({ base: './', plugins: [react(), tailwindcss()], build: { assetsInlineLimit: 200_000 } })
