import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Chunk viewer berisi three.js (~200 kB gzip) dan sengaja dimuat lazy.
    chunkSizeWarningLimit: 900,
  },
})
