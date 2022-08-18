import { NS } from './logger.mjs'
import { readFile } from 'node:fs/promises'
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

/*
# Configuration Precedence
- First the long form package.json -> repository field is read
- Then, package.json g4c
- Finally, SECRETS.g4c.json can veto all others
*/
let configCache = undefined
export const getConfig = async () => {
  const rawPackageJson = await readFile('package.json', {
    encoding: 'utf-8'
  })

  const packageJson = rawPackageJson ? JSON.parse(rawPackageJson) : undefined

  const { g4c: packageG4c } = packageJson

  const rawSecrets = await readFile(SECRETS_FILE_PATH, {
    encoding: 'utf-8'
  })
  const secretsFile = rawSecrets ? JSON.parse(rawSecrets ) : undefined

  const defaultConfig = {}
  if (packageJson?.repository?.type === 'git') {
    defaultConfig.repoUrl = packageJson.repository.url
  }
  // TODO add proxy to defaultConfig when usename is stackblitz etc

  const result = Object.assign({}, defaultConfig, packageG4c, secretsFile)

  return result
}


