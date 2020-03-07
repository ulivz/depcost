const EventEmitter = require('events').EventEmitter
const log = require('npmlog')
const { cyan } = require('chalk')
const getSingleDepCost = require('./get-single-dep-cost')
const loadConfig = require('./load-config')
const getRecentVersions = require('./get-latest-versions')

const DepCostEvents = {
  message: 'depcost_message',
  end: 'depcost_end',
}

exports.DepCostEvents = DepCostEvents
exports.DepCost = class DepCost extends EventEmitter {
  constructor(options) {
    super(options)
    this.options = options
  }

  async processOptions() {
    const localConfig = await loadConfig()
    log.info('localConfig', localConfig)

    const options = {
      ...localConfig,
      ...this.options,
    }

    log.info('merged options', options)

    const {
      pkgs,
      runInBand = false,
      track = false,
      npmClient = 'npm',
    } = options

    let { latestVersions, versions } = options
    let finalPkgs = pkgs

    if (versions) {
      if (latestVersions) {
        log.warn(
          `"versions" option is enabled and "latestVersions" is disabled.`
        )
      }
      if (typeof versions === 'string') {
        versions = versions
          .split(',')
          .map(v => v.trim())
          .filter(v => v)
      }
      const targetPkg = pkgs[0]
      finalPkgs = versions.map(version => `${targetPkg}@${version}`)
    } else if (latestVersions) {
      if (pkgs.length > 1) {
        log.warn(
          `pkgs count can ONLY be 1 when ${cyan(
            '--recent-versions'
          )} is enabled.`
        )
      }
      const targetPkg = pkgs[0]
      let versions = await getRecentVersions(targetPkg, npmClient)
      if (isNaN(latestVersions)) {
        latestVersions = 3
      }
      versions = versions.slice(versions.length - latestVersions)
      log.info('versions', versions)
      finalPkgs = versions.map(version => `${targetPkg}@${version}`)
    }

    return {
      pkgs: finalPkgs,
      runInBand,
      track,
      npmClient,
    }
  }

  async runAsync() {
    const { runInBand, pkgs, track, npmClient } = await this.processOptions()

    if (runInBand) {
      const rets = []
      for (const pkg of pkgs) {
        // @eslint-disable-next-line
        const ret = await getSingleDepCost({ pkg, track, npmClient })
        rets.push(ret)
      }
      return rets
    }

    return Promise.all(
      pkgs.map(pkg => getSingleDepCost({ pkg, track, npmClient }))
    )
  }

  async runAndEmit() {
    const { runInBand, pkgs, track, npmClient } = await this.processOptions()

    if (runInBand) {
      for (const pkg of pkgs) {
        // @eslint-disable-next-line
        const ret = await getSingleDepCost({ pkg, track, npmClient })
        log.info('ret', ret)
        this.emit(DepCostEvents.message, ret)
      }
    } else {
      await Promise.all(
        pkgs.map(pkg =>
          getSingleDepCost({ pkg, track, npmClient }).then(ret => {
            log.info('ret', ret)
            this.emit(DepCostEvents.message, ret)
          })
        )
      )
    }

    this.emit(DepCostEvents.end)
  }
}