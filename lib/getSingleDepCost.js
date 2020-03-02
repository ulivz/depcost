const { join } = require('path')
const { tmpdir } = require('os')
const { removeSync, ensureDirSync, writeFile, existsSync } = require('fs-extra')
const { gray } = require('chalk')
const execa = require('execa')
const log = require('npmlog')
const parsePackageName = require('./parsePackageName')

/**
 * Get tmp directory by timestamp.
 *
 * @return string
 */

function getTmpDirByTS() {
  const dir = join(tmpdir(), new Date().getTime().toString(16))
  ensureDirSync(dir)
  return dir
}

/**
 * Core commands.
 */
const COMMANDS = {
  init: 'npm init -y',
  installPkg: (pkg, npmClient) => `${npmClient} install ${pkg} -D`,
  size: dir => `du -sh ${dir}`,
  execNode: file => `node ${file}`,
}

/**
 * Retrieve cost of a package
 *
 * @param options
 * @return {Promise<void>}
 */

module.exports = async function (options) {
  const { pkg, track, npmClient } = options
  const parsed = parsePackageName(pkg)

  log.info('getSingleDepCost', pkg)
  const dir = getTmpDirByTS()

  if (track) {
    console.log(gray('dir'), dir)
  } else {
    process.on('exit', () => {
      removeSync(dir)
    })
  }

  const localExeca = (commands, options) => {
    const [command, ...args] = commands.split(' ')
    return execa(command, args, { ...options, cwd: dir })
  }

  log.info(pkg, COMMANDS.init)
  await localExeca(COMMANDS.init)

  const installPkgCommand = COMMANDS.installPkg(pkg, npmClient)
  log.info(pkg, installPkgCommand)
  await localExeca(installPkgCommand)

  return Promise.all([getInstallSize(), getRequireTime()]).then(
    ([size, requireTime]) => {
      return {
        pkg,
        name: parsed.name,
        version: parsed.version,
        size,
        requireTime,
      }
    }
  )

  async function getInstallSize() {
    const sizeCommand = COMMANDS.size(dir)
    log.info(pkg, sizeCommand)
    const { stdout: sizeOutput } = await localExeca(sizeCommand)
    const sizes = sizeOutput.split('\t')
    return sizes[0]
  }

  async function getRequireTime() {
    const entryFile = join(dir, 'index.js')
    await writeFile(
      entryFile,
      `
console.time()
require('${parsed.name}')
console.timeEnd()
  `,
      'utf-8'
    )

    log.info(pkg, 'calculate require time')
    const { stdout: execOutput } = await localExeca(
      COMMANDS.execNode(entryFile)
    )
    return execOutput.split(' ')[1].trim()
  }
}
