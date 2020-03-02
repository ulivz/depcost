const EventEmitter = require('events').EventEmitter
const log = require('npmlog')
const getSingleDepCost = require('./getSingleDepCost')

const DepCostEvents = {
  message: 'depcost_message',
  end: 'depcost_end'
}

exports.DepCostEvents = DepCostEvents
exports.DepCost = class DepCost extends EventEmitter {
  constructor(options) {
    super(options);

    this.options = options
    log.heading = 'dep-cost'
    log.level = options.logLevel || 'warn'
  }

  async runAsync() {
    const { pkgs, runInBand = false, track = false } = this.options

    if (runInBand) {
      const rets = []
      for (const pkg of pkgs) {
        const ret = await getSingleDepCost({ pkg, track })
        rets.push(ret)
      }
      return rets
    }

    return Promise.all(pkgs.map(pkg => getSingleDepCost({ pkg, track })))
  }

  async runAndEmit() {
    const { pkgs, runInBand = false, track = false } = this.options

    if (runInBand) {
      for (const pkg of pkgs) {
        const ret = await getSingleDepCost({ pkg, track })
        log.info('ret', ret)
        this.emit(DepCostEvents.message, ret)
      }

    } else {
      await Promise.all(pkgs.map(pkg =>
        getSingleDepCost({ pkg, track }).then(ret => {
          log.info('ret', ret)
          this.emit(DepCostEvents.message, ret)
        })
      ))
    }

    this.emit(DepCostEvents.end)
  }
}
