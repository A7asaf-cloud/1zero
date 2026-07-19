import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/1zero/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'WealthFlow',
        short_name: 'WealthFlow',
        description: 'Adaptive Wealth Dashboard',
        theme_color: '#863bff',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/1zero/',
        scope: '/1zero/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
