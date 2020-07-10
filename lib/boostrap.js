const fs = require('fs-extra')
const path = require('path')
const log = require('npmlog')
const semver = require('semver')
const execa = require('execa')
const requireFromString = require('require-from-string')
const { DepCost, DepCostEvents } = require('./dep-cost')
const requirePkg = require('./require-pkg')
const loadConfig = require('./load-config')

function getPkgByDependencies(dependencies) {
  return Object.keys(dependencies).map(name => {
    const range = dependencies[name]
    const version = semver.minVersion(range)
    if (semver.valid(version)) {
      return `${name}@${version}`
    }
    throw new Error(`Invalid semantic version: ${version}`)
  })
}

module.exports = async opts => {
  opts.cwd = opts.cwd || process.cwd()

  let pkgs = opts.pkgs || []

  if (opts.debug) {
    opts.logLevel = 'debug'
  }

  const localConfig = await loadConfig()

  opts = {
    ...localConfig,
    ...opts,
  }

  let dependencies = {}
  let devDependencies = {}

  if (opts.dependencies || opts.devDependencies) {
    if (opts.pkgs.length > 1) {
      throw new Error(`length of pkgs under 'dependencies' or 'devDependencies' mode should be 1 or 1, but got ${pkgs}`)
    }

    const currentPkg = pkgs[0]
    if (currentPkg) {
      // TODO Error handling
      if (opts.allDependencies || opts.dependencies) {
        const { stdout } = await execa(opts.npmClient, ['view', currentPkg, 'dependencies'])
        dependencies = requireFromString(`module.exports = ${stdout}`)
      }
      if (opts.allDependencies || opts.devDependencies) {
        const { stdout } = await execa('npm', ['view', currentPkg, 'devDependencies'])
        devDependencies = requireFromString(`module.exports = ${stdout}`)
      }
    } else {
      const packageJson = requirePkg(opts.cwd)
      if (opts.allDependencies || opts.dependencies) {
        dependencies = packageJson.dependencies
      }
      if (opts.allDependencies || opts.devDependencies) {
        devDependencies = packageJson.devDependencies
      }
    }

    const dependenciesPkgs = getPkgByDependencies(dependencies)
    const devDependenciesPkgs = getPkgByDependencies(devDependencies)

    if (opts.allDependencies) {
      pkgs = [...dependenciesPkgs, ...devDependenciesPkgs]
    } else if (opts.dependencies) {
      pkgs = dependenciesPkgs
    } else if (opts.devDependencies) {
      pkgs = dependenciesPkgs
    }
  } else if (opts.monorepo) {
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
    log.info('results', results)

    let content = ''

    if (opts.record) {
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

    return {
      content,
      results,
      dependencies,
      devDependencies,
    }
  }).catch(error => {
    process.exitCode = 1
    console.log(require('chalk').red(error.stack))
  })
}
