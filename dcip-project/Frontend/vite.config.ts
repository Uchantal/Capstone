import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Digital Creative Infrastructure Platform',
        short_name: 'DCIP',
        description: 'Creative practice platform for Rwandan secondary school students',
        theme_color: '#C8960C',
        background_color: '#FFFFFF',
        display: 'standalone',
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: false,
    // No hardcoded hmr port — Vite auto-matches HMR to whatever port it binds
  },
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
})
