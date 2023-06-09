import { NS } from './logger.js'
import { URLConverter } from './URLConverter.js'
import { readFile } from 'node:fs/promises'
import { userInfo } from 'node:os'
import { spawn, exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'
import { basename } from 'path'

export const PKG_NAME = 'g4c'
export const SB = '/sandbox'
export const HOME = process.env.HOME
export const REPO_DIR =
  process.env[NS + '_DIR'] || `/tmp/${NS.toLocaleLowerCase()}`
export const PCMD = `cd "${REPO_DIR}" &&`
export const sleep = (s /*: number*/) => new Promise((p) => setTimeout(p, s * 1000))
export const exec = promisify(execCb)
export const START_UTMS = Date.now()
export const SECRETS_PFX = 'SECRETS.'
const SECRETS_FILE_PATH = `${SECRETS_PFX}${PKG_NAME}.json`
const DEFAULT_PROXY = 'https://cors.isomorphic-git.org'

const getIsStackBlitz = () => {
  const fingerprint = [
    ['uid', 1],
    ['guid', 1],
    ['username', 'blitz'],
    ['homedir', '/home'],
    ['shell', '/bin/jsh']
  ]
  const u = userInfo()
  return fingerprint.every(e => e[1] === u[e[0]])
}
export const isStackBlitz = getIsStackBlitz()
const debug = (...args) => globalThis.process?.env?.DEBUG ? console.debug('g4c/utils',...args) : ()=>{}

export const passThrough = async (cm) => {
  const { originalCmd, uniqueCmd } = cm
  const sm = {}
  try {
    // TODO: bash: fork: retry: Resource temporarily unavailable
    const { stdout: cmdPath } = await exec(`which ${originalCmd}`) // BAD
    sm.cmdPath = cmdPath.trim()
  } catch (_e) {}

  if (basename(process.argv[1]) == uniqueCmd) {
    debug(`${uniqueCmd} running.`)
    return false
  } else if (sm.cmdPath) {
    const isProxy = sm.cmdPath.endsWith('/node_modules/.bin/git')
    if (!isProxy){
      console.log(`${originalCmd} found at ${sm.cmdPath} and using it.`)
      // https://nodejs.org/api/child_process.html#optionsstdio

      console.log('// TODO: CAUSES INFINIT LOOP')
      // spawn(originalCmd, process.argv.slice(2), {
      //   stdio: ['inherit', 'inherit', 'inherit']
      // })
      return true
    }
  } else {
    console.log(`${originalCmd} not found, using ${uniqueCmd} instead.`)
    return false
  }
}

/*
# Configuration Precedence
- First the long form package.json -> repository field is read
- Then, package.json g4c
- Finally, SECRETS.g4c.json can veto all others
*/
const configCache = {}
export const getConfig = async (passedUrlStr) => {
  if (configCache.type === PKG_NAME) {
    return configCache
  } 

  const packageJson = {}
  try {
    const rawString = await readFile('package.json', {
      encoding: 'utf-8' 
    })
    Object.assign(packageJson, JSON.parse(rawString))
  } catch(_e) {}
  const { g4c: packageG4c } = packageJson

  const secretsFile = {}
  try {
    const rawString = await readFile(SECRETS_FILE_PATH, {
      encoding: 'utf-8'
    })
    Object.assign(secretsFile, JSON.parse(rawString))
  } catch(_e) {}

  const defaultConfig = {
    type: PKG_NAME, 
    useProxyOnBareMetal: false, // TODO: Implement this
    authorName: packageJson?.author?.name || 'John Doe',
    authorEmail: packageJson?.author?.email ||'git@example.com'
  }
  
  try {
    defaultConfig.repoUrl = (new URL(process.argv[3])).toString()
  } catch {
    if (packageJson?.repository?.type === 'git') {
      debug("g4c: Using package.json git repository.")
      defaultConfig.repoUrl = packageJson.repository.url
    }
  }

  const result = {}
  Object.assign(result, defaultConfig, packageG4c, secretsFile)

  if (isStackBlitz || result.useProxyOnBareMetal === true) {
    result.proxy = result.proxy || DEFAULT_PROXY
  } else {
    result.proxy = undefined
  }

  // Allow ENV JSON config by package name, ex: G4C_CONFIG_g4c
  const G4C_CONFIG = globalThis.process?.env['G4C_CONFIG_' + packageJson.name]
  if (G4C_CONFIG) {
    const g4cConfig = JSON.parse(G4C_CONFIG)
    debug('Reading from ENV', g4cConfig)
    Object.assign(result, g4cConfig)
  }

  try {
    const converter = passedUrlStr ?
      new URLConverter(passedUrlStr) :
      new URLConverter(result.repoUrl)
    result.URL = converter.parsePseudoGitUrl()
  } catch (e){
    debug('No URL found in G4C config... this is fine.', passedUrlStr, result.repoUrl)
    debug(e)
  }
  
  debug('Reading form ENV', result)
  return result
}


const makeMapReversible = (map) => map.forEach((v, k, m) => m.set(v, k))
const HEAD_STATUS = new Map([
  ['absent', 0],
  ['present', 1]
])
const WORKDIR_STATUS = new Map([
  ['absent', 0],
  ['identical_to_head', 1],
  ['different_from_head', 2]
])
const STAGE_STATUS = new Map([
  ['absent', 0],
  ['identical_to_head', 1],
  ['identical_to_workdir', 2],
  ['different_from_workdir', 3]
])
const STATUS_MAPS = [HEAD_STATUS, WORKDIR_STATUS, STAGE_STATUS]
STATUS_MAPS.forEach(makeMapReversible)
export {HEAD_STATUS, WORKDIR_STATUS, STAGE_STATUS}

export const prettifyMatrix = (matrix) => matrix.map(
  ([filepath, headStatus, workdirStatus, stageStatus]) =>
    [headStatus, workdirStatus, stageStatus].every(e => e === 1)
      ? null
      : {
        filepath,
        headStatus: HEAD_STATUS.get(headStatus),
        workdirStatus: WORKDIR_STATUS.get(workdirStatus),
        stageStatus: STAGE_STATUS.get(stageStatus)
      }
).filter(e => e !== null)