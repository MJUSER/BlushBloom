import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Blush & Bloom - Business Manager',
        short_name: 'Blush & Bloom',
        description: 'Manage your Blush & Bloom inventory and sales offline.',
        theme_color: '#2563eb',
        background_color: '#f9fafb',
        display: 'standalone',
        scope: '/BlushBloom/',
        start_url: '/BlushBloom/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // runtimeCaching: [
        //   {
        //     urlPattern: ({ url }) => url.origin === self.location.origin,
        //     handler: 'StaleWhileRevalidate',
        //     options: {
        //       cacheName: 'local-assets',
        //     }
        //   }
        // ]
      }
    })
  ],
});
