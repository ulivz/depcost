const fs = require('fs-extra')
const path = require('path')
const log = require('npmlog')
const { DepCost, DepCostEvents } = require('./dep-cost')
const requirePkg = require('./require-pkg')

module.exports = opts => {
  opts.cwd = opts.cwd || process.cwd()

  let pkgs = opts.pkgs || []

  if (opts.debug) {
    opts.logLevel = 'debug'
  }

  if (opts.monorepo) {
    const loadMonorepoPackages = require('./load-monorepo-packages')
    const monorepoPaackages = loadMonorepoPackages(opts.cwd)
      .filter(pkg => !!(pkg.name && pkg.version))
      .map(pkg => `${pkg.name}@${pkg.version}`)

    pkgs = [
      ...pkgs,
      ...monorepoPaackages,
    ]
  }

  log.heading = 'depcost'
  log.level = opts.logLevel || 'warn'
  log.info('pkgs', pkgs)
  log.info('opts', opts)

  const program = new DepCost({
    ...opts,
    pkgs,
  })

  let isFirst = false

  const results = []

  program.on(DepCostEvents.message, result => {
    results.push(result)
    if (opts.table) {
      if (!isFirst) {
        isFirst = true
        console.log(`| name | install size | reuqire time |
| ---  | --- | --- |`)
      }
      console.log(
        `| ${result.pkg} | ${result.size} | ${result.requireTime} |`,
      )
    } else {
      if (!isFirst) {
        isFirst = true
        console.log('name\t\t\tinstall size\t\treuqire time')
      }
      console.log(`${result.pkg}\t\t\t${result.size}\t\t${result.requireTime}`)
    }
  })

  program.runAndEmit().then(() => {
    if (opts.record) {
      let content = ''

      if (pkgs.length === 0) {
        const packageJson = requirePkg(opts.cwd)
        content += `## ${packageJson.version}\n`
      }

      if (opts.monorepo) {
        const { loadMonorepoConfig } = require('./load-monorepo-packages')
        const config = loadMonorepoConfig(opts.cwd)
        content += `## ${config.version}\n`
      }

      content += `
| name | install size | reuqire time |
| ---  | --- | --- |
${results.map(result => `| ${result.pkg} | ${result.size} | ${result.requireTime} |`).join('\n')}
        `
      const RECORD_FILE = 'DEPCOST.md'
      const recordFile = path.join(opts.cwd, RECORD_FILE)
      if (fs.existsSync(recordFile)) {
        const existedContent = fs.readFileSync(recordFile, 'utf-8')
        content = `${content.trim()}\n\n\n${existedContent}`
      }

      fs.writeFileSync(recordFile, content)
      return content
    }

    return results
  }).catch(error => {
    process.exitCode = 1
    console.log(require('chalk').red(error.stack))
  })
}
