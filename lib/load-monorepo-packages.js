const path = require('path')
const globby = require('globby')
const requirePkg = require('./require-pkg')

function loadMonorepoConfig(cwd) {
  try {
    return require(`${cwd}/lerna.json`)
  } catch (_) {
    return requirePkg(cwd)
  }
}

module.exports = function (cwd) {
  const packages = loadMonorepoConfig(cwd).packages || []

  const resolved = globby.sync(packages, { cwd, onlyDirectories: true })

  return resolved.map(relative => {
    const dir = path.join(cwd, relative)
    const packageJson = requirePkg(dir)
    const { name } = packageJson
    const { version } = packageJson
    return {
      relative,
      dir,
      name,
      version,
    }
  })
}

module.exports.loadMonorepoConfig = loadMonorepoConfig
