const { join } = require('path')
const homedir = require('os').homedir()
const ini = require('ini')
const { readFile, existsSync } = require('fs-extra')

module.exports = async function() {
  const configPath = join(homedir, '.depcostrc')
  if (!existsSync(configPath)) {
    return {}
  }

  const content = await readFile(configPath, 'utf-8')

  const config = ini.parse(content)
  return config
}
