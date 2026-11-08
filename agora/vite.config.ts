import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the build works from any path.
// `--mode artifact` emits a single JS bundle so it can be inlined into one page (see scripts/make-artifact.mjs).
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react()],
  build: {
    outDir: mode === "artifact" ? "dist-artifact" : "dist",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 800,
    rollupOptions: mode === "artifact" ? { output: { inlineDynamicImports: true } } : {},
  },
}));
