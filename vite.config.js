import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    // 配置路径别名
    alias: {
      '@': path.resolve(__dirname, 'src') // @ 指向 src 目录
    }
  },
  plugins: [
    uni(),
  ],
})
