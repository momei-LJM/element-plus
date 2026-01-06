import path from 'path'
import fs from 'fs'
import { cwd } from 'process'
import {
  PKG_BRAND_NAME,
  PKG_CAMELCASE_LOCAL_NAME,
  PKG_CAMELCASE_NAME,
} from '@element-plus/build-constants'
import { epOutput, epRoot, localeRoot } from '@element-plus/build-utils'
import replace from '@rollup/plugin-replace'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { parallel } from 'gulp'
import { camelCase, upperFirst } from 'lodash-unified'
import { glob } from 'tinyglobby'
import { InlineConfig, build } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'
import { version } from '../../../../packages/element-plus/version'
import { target } from '../build-info'
import { ElementPlusAlias } from '../plugins/element-plus-alias'
import { generateExternal, withTaskName } from '../utils'

import type { TaskFunction } from 'gulp'
import type { InputOptions } from 'rollup'

const tsconfig = path.resolve(cwd(), '../../tsconfig.web.json')

const banner = `/*! ${PKG_BRAND_NAME} v${version} */\n`

export const replaceUMD = (paths: string[]) => {
  paths.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      // 检查文件名是否包含 'umd'
      const parsedPath = path.parse(filePath)
      const hasUmd = parsedPath.name.includes('umd')

      if (hasUmd) {
        // 去掉文件名中的 'umd' 部分
        const newName = parsedPath.name.replace(/\.?umd/g, '')
        const newFilePath = path.join(
          parsedPath.dir,
          `${newName}${parsedPath.ext}`
        )
        fs.renameSync(filePath, newFilePath)
      }
    }
  })
}

const plugins: InputOptions['plugins'] = [
  ElementPlusAlias(),
  Vue({
    isProduction: true,
  }) as any,
  vueJsx(),
  replace({
    'process.env.NODE_ENV': '"production"',
  }),
]

async function buildFullEntry(minify: boolean) {
  const pluginList = plugins as any
  const baseConfig: InlineConfig = {
    plugins: pluginList as any,
    target,
    external: await generateExternal({ full: true }),
    treeshake: true,
    outDir: path.resolve(epOutput, 'dist'),
    minify: minify
      ? {
          compress: {
            target,
          },
        }
      : undefined,
    sourcemap: minify,
    dts: false,
  }
  // TODO: 如何自定义文件名去掉umd中的umd
  const outputConfigs: InlineConfig[] = [
    {
      ...baseConfig,
      // 重命名
      entry: {
        'index.full': path.resolve(epRoot, 'index.ts'),
      },
      // 重命名后缀  去不掉umd
      outExtensions: () => {
        return {
          js: minify ? '.min.js' : '.js',
        }
      },

      format: 'umd',
      outputOptions: {
        globals: {
          vue: 'Vue',
        },
      },
      globalName: PKG_CAMELCASE_NAME,
      sourcemap: minify,
      banner,
    },
    {
      ...baseConfig,
      entry: {
        'index.full': path.resolve(epRoot, 'index.ts'),
      },
      outExtensions: () => {
        return {
          js: minify ? '.min.mjs' : '.mjs',
        }
      },
      format: 'esm',
      sourcemap: minify,
      banner,
    },
  ]

  const results = await Promise.all(
    outputConfigs.map((config) => build(config))
  )

  // 重命名包含 'umd' 的文件
  const outputDir = path.resolve(epOutput, 'dist')
  const filesToCheck = [
    path.join(
      outputDir,
      minify ? 'index.full.umd.min.js' : 'index.full.umd.js'
    ),
    path.join(outputDir, 'index.full.umd.min.js.map'),
  ]
  replaceUMD(filesToCheck)

  return results
}

async function buildFullLocale(minify: boolean) {
  const files = await glob(`**/*.ts`, {
    cwd: path.resolve(localeRoot, 'lang'),
    absolute: true,
  })

  // TODO: 正确配置dts
  const results = await Promise.all(
    files.map(async (file) => {
      const filename = path.basename(file, '.ts')
      const name = upperFirst(camelCase(filename))

      return Promise.all([
        build({
          outDir: path.resolve(epOutput, 'dist/locale'),
          entry: file,
          minify: minify
            ? {
                compress: {
                  target,
                },
              }
            : undefined,
          target,
          treeshake: false,
          format: 'umd',
          outExtensions: () => {
            return {
              js: minify ? '.min.js' : '.js',
            }
          },
          // exports: 'default',
          globalName: `${PKG_CAMELCASE_LOCAL_NAME}${name}`,
          sourcemap: minify,
          banner,
          dts: false,
          tsconfig,
        }),
        build({
          outDir: path.resolve(epOutput, 'dist/locale'),
          entry: file,
          minify,
          treeshake: true,
          format: 'esm',
          outExtensions: () => {
            return {
              js: minify ? '.min.mjs' : '.mjs',
            }
          },
          sourcemap: minify,
          banner,
          dts: false,
          tsconfig,
        }),
      ])
    })
  )

  // 重命名包含 'umd' 的 locale 文件
  const localeDir = path.resolve(epOutput, 'dist/locale')
  const localeFilesToCheck = files.flatMap((file) => {
    const filename = path.basename(file, '.ts')
    return [
      path.join(
        localeDir,
        minify ? `${filename}.umd.min.js` : `${filename}.umd.js`
      ),
      path.join(localeDir, `${filename}.umd.min.js.map`),
    ]
  })
  replaceUMD(localeFilesToCheck)

  return results
}

export const buildFull = (minify: boolean) => async () => {
  return Promise.all([buildFullEntry(minify), buildFullLocale(minify)])
}

export const buildFullBundle: TaskFunction = parallel(
  withTaskName('buildFullMinified', buildFull(true)),
  withTaskName('buildFull', buildFull(false))
)
