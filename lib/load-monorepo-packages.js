const requirePkg = require('./require-pkg')
const path = require('path')
const globby = require('globby')

module.exports = function (cwd) {
  let packages

  try {
    const lernaConfig = require(`${cwd}/lerna.json`)
    packages = lernaConfig.packages
  } catch (e) {
    const packageJson = requirePkg(cwd)
    packages = packageJson.packages
  }

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
