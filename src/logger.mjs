export const NS = 'G4C'
const V = new Map([
  ['warn', 2],
  ['info', 3],
  ['debug', 4]
])

class Log {
  constructor ({name, level}) {
    this.level = typeof level === 'number' ? level : (V.get(level) || 3)
    this.prefix = `[${NS}/${name}]`
    return this
  }
  p (f, lv = '') {
    if (typeof f === 'string') {
      return `${this.prefix}:${lv} ${f}`
    } else {
      return f
    }
  }
  debug(...all) {
    if (this.level > 3) {
      console.debug('debug:', ...all)
    }
  }
  info(f, ...rest) {
    if (this.level > 2) {
      console.log(this.p(f), ...rest)
    }
  }
  warn(f, ...rest) {
    if (this.level > 1) {
      console.warn(this.p(f, '⚠️ '), ...rest)
    }
  }
}

export default Log