module.exports = function(name) {
  const REG = /(@?[^@]+)@?(.*)?/
  const matched = name.match(REG)
  if (matched) {
    return {
      name: matched[1],
      version: matched[2],
    }
  }

  throw new Error(`Invalid package name: ${name}`)
}
