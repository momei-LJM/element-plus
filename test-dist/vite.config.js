import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'element-plus': path.resolve(__dirname, '../dist/element-plus'),
    },
  },
  server: {
    port: 8082,
  },
  optimizeDeps: {
    exclude: ['element-plus'],
  },
})
