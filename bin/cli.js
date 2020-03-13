#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const cac = require('cac')
const log = require('npmlog')
const { DepCost, DepCostEvents } = require('../lib')
const requirePkg = require('../lib/require-pkg')

const cli = cac()

cli
  .command('[...pkgs]', 'Retrieve the time and space cost of a dependency.')
  .option('--cwd', 'Current working directory.')
  .option('-t, --track', 'Whether to keep temp directory.')
  .option(
    '-r, --latest-versions <latestVersions>',
    'Specify the count of latest versions.'
  )
  .option('-r, --record', 'Whether to update DEPCOST.md.')
  .option('-t, --table', 'Displayed as markdown table.')
  .option('-m, --monorepo', 'Load packages for monorepo.')
  .option('-s, --versions <versions>', 'Select specific versions.')
  .option('-l, --log-level <logLevel>', 'log level of npmlog under the hood.')
  .option('-n, --npm-client <npmClient>', 'set npm client, defaults to npm.')
  .option('-d, --debug', 'Shortcut to set log level to "debug".')
  .action((pkgs, opts) => {
    opts.cwd = opts.cwd || process.cwd()

    if (opts.debug) {
      opts.logLevel = 'debug'
    }
    if (opts.monorepo) {
      const loadMonorepoPackages = require('../lib/load-monorepo-packages')
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
          `| ${result.pkg} | ${result.size} | ${result.requireTime} |`
        )
      } else {
        if (!isFirst) {
          isFirst = true
          console.log(`name\t\t\tinstall size\t\treuqire time`)
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
          const { loadMonorepoConfig } = require('../lib/load-monorepo-packages')
          const config = loadMonorepoConfig(opts.cwd)
          content += `## ${config.version}\n`
        }

        content += `
| name | install size | reuqire time |
| ---  | --- | --- |
${results.map(result =>
          `| ${result.pkg} | ${result.size} | ${result.requireTime} |`
        ).join('\n')}
        `
        const RECORD_FILE = 'DEPCOST.md'
        const recordFile = path.join(opts.cwd, RECORD_FILE)
        if (fs.existsSync(recordFile)) {
          const existedContent = fs.readFileSync(recordFile, 'utf-8')
          content = content.trim() + '\n\n\n' + existedContent
        }

        fs.writeFileSync(recordFile, content)
      }

    }).catch(error => {
      process.exitCode = 1
      console.log(require('chalk').red(error.stack))
    })
  })

cli.help()
cli.version(require('../package.json').version)
cli.parse()
