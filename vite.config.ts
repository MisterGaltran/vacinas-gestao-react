import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/vacinas-gestao-react/',
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'router';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('react') || id.includes('scheduler')) return 'react';
          }
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gestão de Vacinas',
        short_name: 'Vacinas',
        description: 'Acompanhe o calendário de vacinação infantil PNI da sua família.',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/vacinas-gestao-react/',
        start_url: '/vacinas-gestao-react/',
        lang: 'pt-BR',
        categories: ['health', 'medical', 'lifestyle'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Pre-cacheia o app shell (HTML/JS/CSS/imagens locais)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // Caches em runtime para chamadas externas
        runtimeCaching: [
          {
            // API Supabase: network-first com fallback do cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/(rest|auth)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fotos das crianças (Supabase Storage): cache-first
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        navigateFallback: '/vacinas-gestao-react/index.html',
      },
      devOptions: {
        enabled: false, // só ativa em build
      },
    }),
  ],
})
