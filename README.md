# depcost

[![TNPM version](https://npm.alibaba-inc.com/badge/v/dep-cost.svg)](https://npm.alibaba-inc.com/package/dep-cost) [![TNPM downloads](https://npm.alibaba-inc.com/badge/d/dep-cost.svg)](https://npm.alibaba-inc.com/package/dep-cost) [![install size](http://npg.dockerlab.alipay.net/badge?p=dep-cost)](http://npg.dockerlab.alipay.net/result?p=dep-cost)

<p align="center">
  <img width="600" src="./assets/example.png" alt="logo">
</p>

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
Usage:
  $ cli.js [...pkgs]

Commands:
  [...pkgs]  Retrieve the time and space cost of a dependency.

For more info, run any command with the `--help` flag:
  $ cli.js --help

Options:
  -t, --track                             Whether to keep temp directory.
  -r, --recent-versions <recentVersions>  Specify the count of latest versions
  -v, --versions <versions>               Select specific versions.
  -l, --log-level <logLevel>              log level.
  -l, --npm-client <npmClient>            set npm client, defaults to npm.
  -d, --debug                             Shortcut to set log level to "debug".
  -h, --help                              Display this message
  -v, --version                           Display version number
```

Examples:

```bash
depcost [package]
depcost [package] --log-level=info
depcost [package] --debug
depcost [package@version]
depcost [package1] [package2] [package3]
depcost --debug
depcost [package] --recent-versions=3
depcost [package] --versions=1.0.0,2.0.0
```

## Global Config

You can set global options at `~/.depcostrc` with ini syntax. 

e.g., set npmClient to `tnpm` globally:

```bash
echo 'npmClient=tnpm' > ~/.depcostrc
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D


## Author

**dep-cost** © [ULIVZ](https://github.com/ulivz), Released under the [MIT](./LICENSE) License.<br>



