import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // New versions activate automatically on the next launch.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'brand/*.png'],
      manifest: {
        id: '/',
        name: 'SkyCast — Ob-havo prognozi',
        short_name: 'SkyCast',
        description: 'Aniq ob-havo prognozi: soatlik va 7 kunlik prognoz, xarita, grafiklar. Open-Meteo ma’lumotlari.',
        lang: 'uz',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#070d1f',
        theme_color: '#070d1f',
        categories: ['weather', 'utilities'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Only static assets are precached. Weather/geocoding responses are never
        // cached by the service worker, so the app never shows stale data as current.
        // The HTML page is NOT precached: hosting providers may change it at the
        // edge (e.g. Netlify's badge setting), so it is always fetched from the
        // network first and the cached copy is used only when offline.
        globPatterns: ['**/*.{js,css,svg,png,woff2}'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 5 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Lets the app be installed / tested from `npm run dev` as well.
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallbackAllowlist: [/^\/$/],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
});
