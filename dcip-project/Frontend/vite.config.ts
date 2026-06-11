import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Digital Creative Infrastructure Platform',
        short_name: 'DCIP',
        description: 'Creative practice platform for Rwandan secondary school students',
        theme_color: '#C8960C',
        background_color: '#0E1117',
        display: 'standalone',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
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
