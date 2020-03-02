#!/usr/bin/env node

const cac = require('cac')
const log = require('npmlog')
const { DepCost, DepCostEvents } = require('../lib')

const cli = cac()

cli
  .command('[...pkgs]', 'Retrieve the time and space cost of a dependency.')
  .option('-t, --track', 'Whether to keep temp directory.')
  .option('-r, --latest-versions <latestVersions>', 'Specify the count of latest versions.')
  .option('-v, --versions <versions>', 'Select specific versions.')
  .option('-l, --log-level <logLevel>', 'log level of npmlog under the hood.')
  .option('-l, --npm-client <npmClient>', 'set npm client, defaults to npm.')
  .option('-d, --debug', 'Shortcut to set log level to "debug".')
  .action((pkgs, opts) => {
    if (opts.debug) {
      opts.logLevel = 'debug'
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

    program.on(DepCostEvents.message, result => {
      if (!isFirst) {
        isFirst = true
        console.log(`name\t\t\tinstall size\t\treuqire time`)
      }
      console.log(`${result.pkg}\t\t\t${result.size}\t\t${result.requireTime}`)
    })

    program.runAndEmit().catch(error => {
      process.exitCode = 1
      console.log(require('chalk').red(error.stack))
    })
  })

cli.help()
cli.version(require('../package.json').version)
cli.parse()
