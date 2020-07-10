#!/usr/bin/env node

const cac = require('cac')
const boostrap = require('../lib/boostrap')

const cli = cac()

cli
  .command('[...pkgs]', 'Retrieve the time and space cost of a dependency.')
  .option('--cwd', 'Current working directory.')
  .option('-t, --track', 'Whether to keep temp directory.')
  .option(
    '-r, --latest-versions <latestVersions>',
    'Specify the count of latest versions.',
  )
  .option('-r, --record', 'Whether to update DEPCOST.md.')
  .option('-t, --table', 'Displayed as markdown table.')
  .option('-m, --monorepo', 'Load packages for monorepo.')
  .option('-s, --versions <versions>', 'Select specific versions.')
  .option('-l, --log-level <logLevel>', 'log level of npmlog under the hood.')
  .option('-n, --npm-client <npmClient>', 'set npm client, defaults to npm.')
  .option('-d, --debug', 'Shortcut to set log level to "debug".')
  .option('--dependencies', 'Load dependencies from current packages.')
  .option('--dev-dependencies', 'Load devDependencies of current packages.')
  .option('--all-dependencies', 'Load dependencies & devDependencies of current packages.')
  .action((pkgs, opts) => {
    opts.pkgs = pkgs
    return boostrap(opts)
  })

cli.help()
cli.version(require('../package.json').version)

cli.parse()
