const requirePkg = require('./require-pkg')
const path = require('path')
const globby = require('globby')

function loadMonorepoConfig() {
  try {
    return require(`${cwd}/lerna.json`)
  } catch (e) {
    return requirePkg(cwd)
  }
}

module.exports = function (cwd) {
  const packages = loadMonorepoConfig().packages || []

  const resolved = globby.sync(
    packages,
    { cwd, onlyDirectories: true }
  )

  return resolved.map(relative => {
    const dir = path.join(cwd, relative)
    const packageJson = requirePkg(dir)
    const name = packageJson.name
    const version = packageJson.version
    return {
      relative,
      dir,
      name,
      version
    }
  })
}

module.exports.loadMonorepoConfig = loadMonorepoConfig
