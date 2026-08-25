import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        id: '/',
        name: 'ArazChat',
        short_name: 'ArazChat',

        description: 'Mobile-first chat — direct & group messaging',

        lang: 'fa',
        dir: 'rtl',

        start_url: '/',
        scope: '/',

        display: 'standalone',
        orientation: 'portrait',

        theme_color: '#3880ff',
        background_color: '#ffffff',

        categories: [
          'social',
          'communication',
        ],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2,woff}',
        ],

        navigateFallback: '/index.html',

        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.startsWith('/api/'),

            handler: 'NetworkFirst',

            options: {
              cacheName: 'api-cache',

              networkTimeoutSeconds: 8,

              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 60 * 60,
              },
            },
          },

          {
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.startsWith('/uploads/'),

            handler: 'CacheFirst',

            options: {
              cacheName: 'uploads-cache',

              expiration: {
                maxEntries: 128,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(
        new URL('./src', import.meta.url),
      ),

      buffer: 'buffer/',
    },
  },

  define: {
    global: 'globalThis',
  },

  optimizeDeps: {
    include: [
      '@arazchat/shared',
      'simple-peer',
      'buffer',
    ],
  },

  build: {
    commonjsOptions: {
      include: [
        /node_modules/,
        /@arazchat\/shared/,
        /packages[\\/]shared/,
        /simple-peer/,
      ],

      transformMixedEsModules: true,
    },
  },

  server: {
    port: 7070,

    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
        rewrite: (path: string) =>
          path.replace(/^\/api/, ''),
      },

      '/uploads': {
        target: 'http://localhost:7071',
        changeOrigin: true,
      },

      '/socket.io': {
        target: 'http://localhost:7071',
        ws: true,
      },
    },
  },
})