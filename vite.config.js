import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '首爾滑雪之旅 2026',
        short_name: 'SeoulTrip',
        description: '2026 首爾滑雪行程表',
        theme_color: '#ffffff',
        icons: [
          {
            src: '512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '512x512.png', // 重複使用 512 的圖
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // ★ 關鍵：這行讓 Android 知道這張圖可以被裁切成圓形
          }
        ]
      }
    })
  ],
})