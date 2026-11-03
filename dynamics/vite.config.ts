import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  // נתיבים יחסיים: האתר עובד גם מתת־תיקייה ובעמוד לייב מתארח
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        contact: resolve(import.meta.dirname, 'contact/index.html'),
        specimen: resolve(import.meta.dirname, 'specimen.html'),
      },
    },
  },
});
