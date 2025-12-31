import path from 'path'
import { buildOutput } from '@element-plus/build-utils'
import { copy, ensureDir } from 'fs-extra'
import { glob } from 'tinyglobby'
import { buildConfig } from '../build-info'

/**
 * 提取es的所有声明文件
 * 后续复制到cjs的包中做声明文件
 */
export const extractTypesDefinitions = async () => {
  const targetDir = path.join(buildOutput, 'types', 'packages')
  await ensureDir(targetDir)
  const sourceDir = buildConfig.esm.output.path
  const filePaths = await glob(`**/*.d.mts`, {
    cwd: sourceDir,
    absolute: true,
  })
  const copyTasks = filePaths.map(async (filePath) => {
    const relativePath = path.relative(sourceDir, filePath)
    const targetPath = path.join(targetDir, relativePath)
    await copy(filePath, targetPath)
  })
  await Promise.all(copyTasks)
}
