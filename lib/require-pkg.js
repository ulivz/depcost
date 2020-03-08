module.exports = function (cwd) {
  try {
    return require(`${cwd}/package.json`)
  } catch (e) {
    return {}
  }
}
