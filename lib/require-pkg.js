const cached = require('./cached')

module.exports = cached(cwd => {
  try {
    return require(`${cwd}/package.json`)
  } catch (_) {
    return {}
  }
})
