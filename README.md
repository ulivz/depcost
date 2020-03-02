# dep-cost

[![TNPM version](https://npm.alibaba-inc.com/badge/v/dep-cost.svg)](https://npm.alibaba-inc.com/package/dep-cost) [![TNPM downloads](https://npm.alibaba-inc.com/badge/d/dep-cost.svg)](https://npm.alibaba-inc.com/package/dep-cost) [![install size](http://npg.dockerlab.alipay.net/badge?p=dep-cost)](http://npg.dockerlab.alipay.net/result?p=dep-cost)

![](./assets/example.png)

## Features

- Require time of a dependency
- Install size of a dependency

## Install

```bash
tnpm install depcost -g
```

## Usage

`depcost` or its shortcut `dc`:

```bash
depcost [package]
depcost [package@version]
depcost [package1] [package2] [package3]
depcost --debug
depcost [package] --recent-versions=3
depcost [package] --versions=1.0.0,2.0.0
```

## Examples

```bash
dc vue
```



## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D


## Author

**dep-cost** © [真山](http://gitlab.alipay-inc.com/u/haoli.chl), Released under the [MIT](./LICENSE) License.<br>



