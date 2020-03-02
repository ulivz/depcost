module.exports = async function (pkg, npmClient) {
  const execa = require('execa')
  const stripAnsi = require('strip-ansi')
  const { stdout } = await execa(npmClient, ['view', pkg, 'versions'])
  const processed = stripAnsi(stdout).split(',')
    .map(v => v.replace(/\'/g, '"'))
    .join(',')

  return JSON.parse(processed)
}
