import path from 'path'
import { cwd } from 'process'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { series } from 'gulp'
import { InlineConfig, build } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'
import { ElementPlusAlias } from '../plugins/element-plus-alias'
import { generateExternal, withTaskName } from '../utils'

import type { TaskFunction } from 'gulp'

const tsconfig = path.resolve(cwd(), '../../tsconfig.web.json')

async function buildModulesComponents() {
  const buildConfig: InlineConfig = {
    entry: 'packages/element-plus/index.ts',
    plugins: [ElementPlusAlias(), Vue({ isProduction: true }), vueJsx()],
    target: 'es2018',
    clean: true,
    external: await generateExternal({ full: false }),
    treeshake: { moduleSideEffects: false },
    format: 'esm',
    outDir: '../../dist/element-plus/es',
    sourcemap: true,
    unbundle: true,
    tsconfig,
    dts: {
      vue: true,
      eager: true,
    },
    // dts: false,
  }
  return build(buildConfig)
}

export const buildModules: TaskFunction = series(
  withTaskName('buildModulesComponents', buildModulesComponents)
)
