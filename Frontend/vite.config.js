import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Auto-update SW in background — user always gets latest version
      registerType: 'autoUpdate',

      // Don't put offline.html in includeAssets — workbox precaches it
      // via additionalManifestEntries below (avoids duplicate entry bug)
      includeAssets: ['clovo.svg'],

      workbox: {
        // IMPORTANT: null here — we do NOT use navigateFallback
        // because it routes ALL navigation to offline.html even when online.
        // Instead we use NetworkFirst + handlerDidError below.
        navigateFallback: null,

        // Explicitly precache offline.html so it's available when offline
        additionalManifestEntries: [
          { url: '/offline.html', revision: '1' },
        ],

        runtimeCaching: [
          // ── Page navigations ──────────────────────────────────
          // Try network first (5s timeout), fall back to offline.html
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 5,
              plugins: [
                {
                  // Only called when network fails AND no cache hit
                  handlerDidError: async () => {
                    return caches.match('/offline.html');
                  },
                },
              ],
            },
          },

          // ── JS / CSS assets ───────────────────────────────────
          // Serve from cache instantly, update in background
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
            },
          },

          // ── Images ────────────────────────────────────────────
          // Cache first, 60 entries max, 30 day expiry
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },

          // ── Google Fonts stylesheets ──────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },

          // ── Google Fonts files ────────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          },
        ],
      },

      manifest: {
        name: 'E-Commerce App',
        short_name: 'Shop',
        description: 'Your favourite online shop',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [
          {
            src: '/clovo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: { port: 5173 },
});