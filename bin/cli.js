#!/usr/bin/env node

const cac = require('cac')
const log = require('npmlog')
const { DepCost, DepCostEvents } = require('../lib')

const cli = cac()

cli
  .command('[...pkgs]', 'Retrieve the time and space cost of using a dependency.')
  .option('-t, --track', 'Whether to keep temp directory.')
  .option('-r, --recent-versions <recentVersions>', 'Whether to keep temp directory.')
  .option('-l, --log-level <logLevel>', 'log level.')
  .option('-l, --npm-client <npmClient>', 'set npm client, defaults to npm.')
  .option('-d, --debug', 'Shortcut to set log level to "debug".')
  .action((pkgs, opts) => {
    if (opts.debug) {
      opts.logLevel = 'debug'
    }

    log.heading = 'dep-cost'
    log.level = opts.logLevel || 'warn'
    log.info('pkgs', pkgs)
    log.info('opts', opts)
    const program = new DepCost({
      ...opts,
      pkgs,
    })

    program.on(DepCostEvents.message, result => {
      console.log(`${result.pkg}\t\t${result.size}\t\t${result.requireTime}`)
    })

    program.runAndEmit().catch(error => {
      process.exitCode = 1
      console.log(require('chalk').red(error.stack))
    })
  })

cli.parse()
