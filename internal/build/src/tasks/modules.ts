import path from 'path'
import { cwd } from 'process'
import { excludeFiles, pkgRoot } from '@element-plus/build-utils'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { series } from 'gulp'
import { InputOptions } from 'rollup'
import { glob } from 'tinyglobby'
import { InlineConfig, build } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'
import { buildConfigEntries, target } from '../build-info'
import { ElementPlusAlias } from '../plugins/element-plus-alias'
import { generateExternal, withTaskName } from '../utils'

import type { TaskFunction } from 'gulp'

const plugins: InputOptions['plugins'] = [
  ElementPlusAlias(),
  Vue({ isProduction: true }) as any,
  vueJsx(),
]
const tsconfig = path.resolve(cwd(), '../../tsconfig.web.json')

async function buildModulesComponents() {
  const hostiedInput = excludeFiles(
    await glob(
      ['element-plus/**/*.{js,ts,vue}', '!**/style/(index|css).{js,ts,vue}'],
      {
        cwd: pkgRoot,
        absolute: true,
        onlyFiles: true,
      }
    )
  )
  await Promise.all(
    buildConfigEntries.map(async ([module, config]) => {
      const buildConfig: InlineConfig = {
        entry: hostiedInput,
        plugins,
        target,
        clean: false,
        external: await generateExternal({ full: false }),
        treeshake: { moduleSideEffects: false },
        format: config.format as any,
        outDir: config.output.path,
        sourcemap: true,
        logLevel: 'silent',

        unbundle: true,
        outExtensions: () => {
          return { js: `.${config.ext}` }
        },
        outputOptions: {
          exports: module === 'cjs' ? 'named' : undefined,
          // TODO: rolldown 对这个配置支持有bug
          // preserveModulesRoot: epRoot,
        },
        tsconfig,
        dts:
          module === 'esm'
            ? {
                vue: true,
                compilerOptions: {
                  // isolatedDeclarations: true,
                },
              }
            : false,
      }
      return Promise.all([
        patchPreserveModulesRoot(config.output.path, {
          ...buildConfig,
          entry: hostiedInput,
        }),
        // TODO: 入口文件是element-plus 的包
        // 意味着到处的都是element-plus需要的，否则会被shake掉
        // 所以需要严格约定element-plus 的导出结构
        // build(buildConfig),
      ])
    })
  )
}

async function buildModulesStyles() {
  const input = excludeFiles(
    await glob('**/style/(index|css).{js,ts,vue}', {
      cwd: pkgRoot,
      absolute: true,
      onlyFiles: true,
    })
  )

  await Promise.all(
    buildConfigEntries.map(([module, config]) => {
      return build({
        entry: input,
        plugins,
        treeshake: false,
        target,
        format: config.format as any,
        outDir: path.resolve(config.output.path, 'components'),
        logLevel: 'silent',
        clean: false,
        sourcemap: true,
        unbundle: true,
        outExtensions: () => {
          return { js: `.${config.ext}` }
        },
        outputOptions: {
          exports: module === 'cjs' ? 'named' : undefined,
          // TODO: rolldown 对这个配置支持有bug
          // preserveModulesRoot: epRoot,
        },
        tsconfig,
        dts: false,
      })
    })
  )
}

/** 单独打包需要依赖 `preserveModulesRoot` 的包（rolldown实现有bug）*/
async function patchPreserveModulesRoot(root: string, config: InlineConfig) {
  return build({
    ...config,
    outDir: root,
    outputOptions: {
      ...(config.outputOptions || {}),
      preserveModulesRoot: root,
    },
  })
}
export const buildModules: TaskFunction = series(
  withTaskName('buildModulesComponents', buildModulesComponents),
  withTaskName('buildModulesStyles', buildModulesStyles)
)
