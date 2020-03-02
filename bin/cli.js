#!/usr/bin/env node

const cac = require('cac')
const { DepCost, DepCostEvents } = require('../lib')

const cli = cac()

cli
  .command('[...pkgs]', 'My Default Command')
  .option('-t, --track', 'Whether to keep temp directory.')
  .option('-l, --log-level <logLevel>', 'Logger level.')
  .action((pkgs, flags) => {
    const program = new DepCost({
      ...flags,
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
