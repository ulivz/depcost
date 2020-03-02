#!/usr/bin/env node

const cac = require('cac')
const ret = require('../lib')

const cli = cac()

cli
  .command('[...pkgs]', 'My Default Command')
  .option('-t, --track', 'Whether to keep temp directory.')
  .action((pkgs, flags) => {
    ret({
      ...flags,
      pkgs
    }).catch(error => {
      process.exitCode = 1
      console.log(require('chalk').red(error.stack))
    })
  })

cli.parse()
