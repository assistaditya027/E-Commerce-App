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
      registerType: 'autoUpdate',

      // offline.html must be in the build output root
      // includeAssets makes sure Vite copies it to dist/
      includeAssets: ['clovo.svg', 'offline.html'],

      workbox: {
        // KEY FIX: navigateFallback tells the SW to IMMEDIATELY
        // serve offline.html for any navigation that fails.
        // This is what shows YOUR page instead of Chrome's dinosaur.
        navigateFallback: '/offline.html',

        // Only use the fallback when the network actually fails
        // (not for API calls, not for assets — only page navigations)
        navigateFallbackAllowlist: [/^(?!\/__).*/],

        // Make sure offline.html itself is precached
        // so it's available with zero network
        additionalManifestEntries: [
          { url: '/offline.html', revision: '2' },
        ],

        runtimeCaching: [
          // ── Page navigations ────────────────────────────────
          // NetworkFirst with SHORT timeout (3s max)
          // After timeout → SW serves navigateFallback immediately
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3,
            },
          },

          // ── JS / CSS assets ─────────────────────────────────
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets-cache' },
          },

          // ── Images ──────────────────────────────────────────
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

          // ── Google Fonts stylesheets ─────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'gfonts-stylesheets' },
          },

          // ── Google Fonts files ───────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gfonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60,
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