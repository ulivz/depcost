const parse = require('../lib/parse-package-name')

describe('parsePackageName', () => {
  it('unscoped package', () => {
    expect(parse('foo')).toEqual({
      name: 'foo',
      version: undefined,
    })

    expect(parse('foo@')).toEqual({
      name: 'foo',
      version: undefined,
    })

    expect(parse('foo@latest')).toEqual({
      name: 'foo',
      version: 'latest',
    })

    expect(parse('foo@1.0.0')).toEqual({
      name: 'foo',
      version: '1.0.0',
    })
  })

  it('scoped package', () => {
    expect(parse('@foo/bar')).toEqual({
      name: '@foo/bar',
      version: undefined,
    })

    expect(parse('@foo/bar@')).toEqual({
      name: '@foo/bar',
      version: undefined,
    })

    expect(parse('@foo/bar@latest')).toEqual({
      name: '@foo/bar',
      version: 'latest',
    })

    expect(parse('@foo/bar@1.0.0')).toEqual({
      name: '@foo/bar',
      version: '1.0.0',
    })
  })
})
