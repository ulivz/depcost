const { join, isAbsolute, resolve } = require('path')
const { tmpdir, homedir } = require('os')
const bytes = require('bytes')
const { removeSync, ensureDirSync, writeFile, existsSync } = require('fs-extra')
const { gray } = require('chalk')
const execa = require('execa')
const log = require('npmlog')
const parsePackageName = require('./parse-package-name')

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
 * Parse and get correct install script.
 */
function getInstallScript(npmClient, pkg) {
  if (npmClient.endsWith('npm')) {
    return `${npmClient} install ${pkg} -D`
  }
  if (npmClient === 'yarn') {
    return `${npmClient} add ${pkg} -D`
  }
  throw new Error(`Unknown npm client: ${npmClient}`)
}

/**
 * Core commands.
 */
const COMMANDS = {
  init: 'npm init -y',
  installPkg: (pkg, npmClient) => getInstallScript(npmClient, pkg),
  size: dir => `du -s ${dir}`,
  execNode: file => `node ${file}`,
}

/**
 * A simple util to make "process.on" only called once.
 */
const onProcessExit = (() => {
  const listeners = []
  process.on('exit', () => {
    listeners.forEach(listener => listener())
  })
  return listener => listeners.push(listener)
})()

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
    onProcessExit(() => {
      log.info('clean temp directory ...')
      removeSync(dir)
    })
  }

  const localExeca = (commands, opts) => {
    const [command, ...args] = commands.split(' ')
    return execa(command, args, { ...opts, cwd: dir })
  }

  if (existsSync(pkg)) {
    let entry = pkg
    if (!isAbsolute(pkg)) {
      entry = resolve(pkg)
    }
    const requireTime = await getRequireTime(entry)
    return {
      pkg: entry.replace(homedir(), '~'),
      size: 'N/A',
      requireTime,
    }
  }

  log.info(pkg, COMMANDS.init)
  await localExeca(COMMANDS.init)

  const installPkgCommand = COMMANDS.installPkg(pkg, npmClient)
  log.info(pkg, installPkgCommand)
  await localExeca(installPkgCommand)

  return Promise.all([getInstallSize(), getRequireTime(parsed.name)]).then(
    ([size, requireTime]) => {
      const rawSize = Number(size)
      return {
        pkg,
        name: parsed.name,
        version: parsed.version,
        size: bytes(rawSize),
        rawSize,
        requireTime,
      }
    },
  )

  async function getInstallSize() {
    const sizeCommand = COMMANDS.size(dir)
    log.info(pkg, sizeCommand)
    const { stdout: sizeOutput } = await localExeca(sizeCommand)
    const sizes = sizeOutput.split('\t')
    return sizes[0]
  }

  async function getRequireTime(entry) {
    const entryFile = join(dir, 'index.js')
    await writeFile(
      entryFile,
      `
console.time()
try {
  require('${entry}')
} catch(e) {
  // Do not need handle it.
}
console.timeEnd()
  `,
      'utf-8',
    )

    log.info(pkg, 'calculate require time')
    const { stdout: execOutput } = await localExeca(
      COMMANDS.execNode(entryFile),
    )
    return execOutput.split(' ')[1].trim()
  }
}
