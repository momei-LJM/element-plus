import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import VueMacros from 'unplugin-vue-macros/vite'

export default defineConfig({
  plugins: [
    VueMacros({
      setupComponent: false,
      setupSFC: false,
      plugins: {
        vue: Vue(),
        vueJsx: VueJsx(),
      },
      // 禁用 better-define 插件，避免 magic-string-ast 兼容性问题
      betterDefine: false,
    }),
  ],
  optimizeDeps: {
    disabled: true,
  },
  test: {
    clearMocks: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    reporters: ['default'],
    testTransformMode: {
      web: ['*.{ts,tsx}'],
    },
    coverage: {
      reporter: ['text', 'json-summary', 'json'],
      include: ['packages/**/*.test.{ts,tsx}'],
      exclude: [
        'play/**',
        '**/lang/**',
        'packages/components/*/style/**',
        'scripts/**',
        'ssr-testing/**',
      ],
    },
  },
})
