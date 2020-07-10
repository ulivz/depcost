/**
 * Create a cached version of a pure function.
 */

module.exports = function cached(fn) {
  const cache = Object.create(null)
  // eslint-disable-next-line func-names
  return function cachedFn(str) {
    const hit = cache[str]
    // eslint-disable-next-line no-return-assign
    return hit || (cache[str] = fn(str))
  }
}
