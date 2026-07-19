import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/baby-check/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/baby-check/',
        name: 'BabyCheck — ritam sna i obroka',
        short_name: 'BabyCheck',
        description: 'Privatni lokalni dnevnik sna i obroka s procjenom bebinog osobnog ritma.',
        lang: 'hr',
        start_url: '/baby-check/',
        scope: '/baby-check/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#f5f7fb',
        theme_color: '#276c6b',
        categories: ['parenting', 'lifestyle'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
