// URLConverter.js
// todo: use https://www.npmjs.com/package/npm-package-arg
import { URL } from 'node:url'

const debug = (...args) => globalThis.process?.env?.DEBUG ? console.debug('g4c/URLConverter',...args) : ()=>{}
const SHORT_NAMES = new Map([
  ['gh', 'github.com'],
  ['gl', 'gitlab.com'],
  ['bb', 'bitbucket.org']
])
SHORT_NAMES.forEach((full) => { // allow TLD less urls
  SHORT_NAMES.set(full.split('.').at(0) , full)
})

export class URLConverter {
  constructor(inputUrl) {
    this.original = inputUrl;
    debug(this.original, 'this.original')
  }

  /* Takes git like URLs and parses them to git repo refs
    1. Takes shortcut urls with gh and returns github.com URLs
    2. Take github website urls and return an object with an HTTPS repo URL
    3. 
  */
  parsePseudoGitUrl() {
    const result = {
      original: this.original,
    }
    try {
      this.url = this.#enforceHttpsProtocol(this.original)
      this.url = this.#spreadShortName(this.url.toString())
      this.url.pathname = this.url.pathname.replace(/\/$/, '') // Probably optimized
      
      // [ '', 'user', 'repo', 'tree', 'branch' ]
      const pathTokens = this.url.pathname.split('/') // starts with /
      const lastSlug = pathTokens.at(-1)
      const penultimateSlug = pathTokens.at(-2)
      const prId = parseInt(lastSlug)
      if (
        !Number.isNaN(prId) && 
        penultimateSlug === 'pull' &&
        pathTokens.length > 3
      ) {
        debug('Detected PR URL')
        this.url.pathname = pathTokens.slice(0, -2).join('/')
        result.virtualBranch = `pull/${prId}/head`
      } else if (
        penultimateSlug === 'tree' &&
        pathTokens.length === 5
      ) {
        debug('Detected git tree branch URL')
        this.url.pathname = pathTokens.slice(0, -2).join('/')
        result.branch = lastSlug
      }
      
      debug('pre appendGitExt', this.url)
      this.url = this.#appendGitExtension(this.url.toString())
    } catch (e) {
      debug('ERROR', this, e)
      throw e
    }
    const splitPii = this.#filterPii(this.url.toString())

    const newDirName = splitPii.cleanUrl.pathname?.split('/')?.at(-1)?.replace(/.git$/, '')

    const final = {
      ...result,
      url: splitPii.cleanUrl.toString(),
      piiUrl: splitPii.piiUrl.toString(),
      repo: this.original, // ques qu ce?
      newDirName
    }
    debug('FINAL RESULT', final)
    return final
  }
  
  // private method that strips protocols from the input url
  // unless it is a localhost one
  #enforceHttpsProtocol(urlStr) {
    const badProtocols = ['git+ssh:', 'git+https:', 'git+http:', 'git:', 'https:', 'ssh:']
    let result = {}

    try { result = new URL(urlStr) } catch {
      result = new URL('https://' + urlStr)
    }
    const protocol = result.protocol
    const isLocalhost = 
      result.hostname === 'localhost' || 
      result.hostname === '127.0.0.1' ||
      result.hostname === '[::1]' ||
      result.hostname.endsWith('.localhost')

    if (protocol === 'http:' && isLocalhost) {
      return
    } else if (
      !protocol.includes('http') &&
      result.username === 'git'
    ) {
      result.username = ''
      result.protocol = 'https:'
    } else if (badProtocols.includes(protocol)) {
      result.protocol = 'https:'
    }

    // remove dupicate protocols
    if(result.origin === 'https://https') {
      result = new URL(result.href.replace('https://https//', 'https://'))
    }

    return result
  }

  #spreadShortName(urlStr) {
    const result = new URL(urlStr)
    const shortName = SHORT_NAMES.get(result.hostname)
    if (shortName) {
      result.hostname = shortName
    }
    return result
  }
  
  #appendGitExtension(urlStr) {
    const result = new URL(urlStr)
    if (result.pathname.endsWith('.git')) {
      return urlStr
    }
    return result.href.replace(result.pathname, result.pathname + '.git')
  }

  // returns two URL objects, first with pii, second without
  // Todo: Glitch.com uses username as password...
  #filterPii(urlStr) {
    const dirtyUrl = new URL(urlStr)
    const cleanUrl = new URL(urlStr)
    if (dirtyUrl.password) {
        cleanUrl.password = ''
        cleanUrl.username = ''
    }
    return {
        piiUrl: dirtyUrl,
        cleanUrl
    }
  }
}

