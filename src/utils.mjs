import { NS } from './logger.mjs'
import { readFile } from 'node:fs/promises'
import { userInfo } from 'node:os'

import { promisify } from 'util'
import { exec as execCb } from 'child_process'

export const PKG_NAME = 'g4c'
export const SB = '/sandbox'
export const HOME = process.env.HOME
export const REPO_DIR =
  process.env[NS + '_DIR'] || `/tmp/${NS.toLocaleLowerCase()}`
export const PCMD = `cd "${REPO_DIR}" &&`
export const sleep = (s /*: number*/) => new Promise((p) => setTimeout(p, s * 1000))
export const exec = promisify(execCb)
export const START_UTMS = Date.now()
const SECRETS_FILE_PATH = `SECRETS.${PKG_NAME}.json`
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

/*
# Configuration Precedence
- First the long form package.json -> repository field is read
- Then, package.json g4c
- Finally, SECRETS.g4c.json can veto all others
*/
const configCache = {}
export const getConfig = async () => {
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
    ignoreProxyOnBareMetal: true, // TODO: Implement this
    author: 'John Doe',
    email: 'git@example.com'
  }
  if (packageJson?.repository?.type === 'git') {
    defaultConfig.repoUrl = packageJson.repository.url
  }
  if (isStackBlitz) {
    defaultConfig.proxy = DEFAULT_PROXY
  }

  const result = {}
  Object.assign(result, defaultConfig, packageG4c, secretsFile)

  if (result.ignoreProxyOnBareMetal === true) {
    result.proxy = undefined
  }
  return result
}


