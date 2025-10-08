import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
    allowedHosts: ['yuorur0ucfs2.share.zrok.io'],
    proxy: {
      '/api': {
        target: 'http://83.222.9.90:8080', // Удаленный сервер
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Передаем все заголовки авторизации
            if (req.headers['authorization']) {
              proxyReq.setHeader('Authorization', req.headers['authorization'])
            }
            if (req.headers['x-device-token']) {
              proxyReq.setHeader('X-Device-Token', req.headers['x-device-token'])
            }
            if (req.headers['x-admin-session']) {
              proxyReq.setHeader('X-Admin-Session', req.headers['x-admin-session'])
            }
          })
        },
      },
      '/admin': {
        target: 'http://83.222.9.90:8080', // Удаленный сервер
        changeOrigin: true,
        secure: false,
        bypass(req) {
          // Не проксировать если это навигация браузера (HTML)
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/devices': {
        target: 'http://83.222.9.90:8080', // Удаленный сервер
        changeOrigin: true,
        secure: false,
      },
      '/menu': {
        target: 'http://83.222.9.90:8080', // Удаленный сервер
        changeOrigin: true,
        secure: false,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/categories': {
        target: 'http://83.222.9.90:8080', // Удаленный сервер
        changeOrigin: true,
        secure: false,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/orders': {
        target: 'http://83.222.9.90:8080', // Удаленный сервер
        changeOrigin: true,
        secure: false,
        bypass(req) {
          // НЕ проксировать если это навигация браузера к странице /orders
          if (req.headers.accept?.includes('text/html')) {
            console.log('🔄 Пропускаем прокси для навигации:', req.url)
            return req.url // Пропустить прокси, вернуть в SPA
          }
        },
      },
      '/cart': {
        target: 'http://83.222.9.90:8080', // Удаленный сервер
        changeOrigin: true,
        secure: false,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/tables': {
        target: 'http://83.222.9.90:8080', // Удаленный сервер
        changeOrigin: true,
        secure: false,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/sync': {
        target: 'http://83.222.9.90:8080', // Удаленный сервер
        changeOrigin: true,
        secure: false,
      },
    },
  },
  publicDir: 'public',
  assetsInclude: ['**/*.json'],
})
