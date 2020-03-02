const execa = require('execa')
const { join } = require('path')
const { tmpdir } = require('os')
const { removeSync, ensureDirSync, writeFile } = require('fs-extra')
const { cyan, gray } = require('chalk')

const getTmpDir = () => {
  const dir = join(tmpdir(), new Date().getTime().toString(16))
  ensureDirSync(dir)
  return dir
}

const log = (...msg) => console.log(`${cyan('❯ ')} ${msg.join(' ')}`)

const COMMANDS = {
  init: 'npm init -y',
  installPkg: pkg => `tnpm install ${pkg} -D`,
  size: dir => `du -sh ${dir}`,
  execNode: file => `node ${file}`
}

module.exports = async function (options = {}) {
  const { pkgs, runInBand, track = false } = options
  if (!pkgs || pkgs.length === 0) {
    return
  }

  if (runInBand) {
    for (const pkg of pkgs) {
      await retPackage({ pkg, track })
    }
  } else {
    await Promise.all(pkgs.map(pkg => retPackage({ pkg, track })))
  }
}

async function retPackage({ pkg, track }) {
  // log(gray('pkg'), pkg)
  const dir = getTmpDir()

  if (track) {
    log(gray('dir'), dir)
  } else {
    process.on('exit', () => {
      removeSync(dir)
    })
  }

  const localExeca = (commands, options) => {
    const [command, ...args] = commands.split(' ')
    return execa(command, args, { ...options, cwd: dir })
  }

  // log(COMMANDS.init)
  await localExeca(COMMANDS.init)

  const installPkgCommand = COMMANDS.installPkg(pkg)
  // log(installPkgCommand)
  await localExeca(installPkgCommand)

  await Promise.all(
    [
      getInstallSize(),
      getRequireTime()
    ]
  ).then(([
    size,
    requireTime
  ]) => {
    console.log()
    log(gray('pkg'), pkg)
    log(gray('size'), size)
    log(gray('require time'), requireTime)
    console.log()
  })

  async function getInstallSize() {
    const sizeCommand = COMMANDS.size(dir)
    // log(sizeCommand)
    const { stdout: sizeOutput } = await localExeca(sizeCommand)
    const sizes = sizeOutput.split('\t')
    return sizes[0]
  }

  async function getRequireTime() {
    const entryFile = join(dir, 'index.js')
    await writeFile(entryFile, `
console.time()
require('${pkg}')
console.timeEnd()
  `, 'utf-8')

    // log('calculate require time')
    const { stdout: execOutput } = await localExeca(COMMANDS.execNode(entryFile))
    return execOutput.split(' ')[1].trim()
  }
}
