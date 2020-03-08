module.exports = function(cwd) {
  try {
    return require(`${cwd}/package.json`)
  } catch (error) {
    return {}
  }
}
