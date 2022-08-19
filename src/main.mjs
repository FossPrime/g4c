#!/usr/bin/env node
import Install from './install.mjs'
import { exec, getConfig, PCMD, sleep } from './utils.mjs'
import Log from './logger.mjs'
import { readFile } from 'node:fs/promises'
import { URL } from 'node:url'; // in Browser, the URL in native accessible on window
import {
  fetch,
  clone,
  pull,
  fastForward,
  currentBranch,
  add,
  commit,
  push,
  statusMatrix,
  checkout
} from 'isomorphic-git'
import { default as isomorphicGitFsClient } from 'node:fs'
import path from 'node:path'

// HARD CONFIG
const PUSH = true
const CHECKOUT = true // DANGER: true WILL overrite your SB code
const FETCH = true // BUG: Overwrites any unpushed commits when true
const NS = 'git'
const GIT_COMMIT_MESSAGE = 'StackBlitz Commit.'


const isomorphicGitHttpClient = await import(
  '../node_modules/isomorphic-git/http/node/index.js'
)
const isomorphicGitWorkingTreeDir = './'

const config = await getConfig()

// Pseudo-modules
const pkgDir = new URL('..', import.meta.url).pathname
const log = new Log({ name: 'main', level: 'info' })

const addToStage = async (args) => {
  if (args[0] !== '.') {
    throw new Error('We only support "." as a parameter.')
  }
  // DELETE: await gitSync(true)
  const { stdout: addResOut, stderr: addResErr } = await exec(`${PCMD} git add .`)
  log.info('addRes:', addResOut, addResErr)
}

const g4cCommit = async (args) => {
  if (args[0] === '-m' && typeof args[1] === 'string') {
    const { stdout, stderr } = await exec(`${PCMD} git commit -m "${args[1]}"`)
    log.info('commit:', stdout, stderr)
  } else if (args[0] === undefined) {
    // We chave to pass through a spawn STDIO
    // I don't have time to look up the code I used in stackblitz right now
    throw new Error('This feature is coming soon... for now use "-m" as a parameter.')
  } else {
    throw new Error('We only support "-m" as a parameter.')
  }
}

const g4cPush = async (args) => {
  if (args.length > 0) {
    throw new Error('We don\'t support any arguments for push.')
  }
  const { stdout, stderr } = await exec(`${PCMD} git push`)
  log.info(stdout, stderr)
} 


const gitUrl = new URL(config.repoUrl)
if (config.username) {
  gitUrl.username = config.username
  gitUrl.password = config.password
}
const isomorphicGitUrl = gitUrl.toString()
// const workdir = tmpdir() + '/' + NS
const gitConfig = {
  fs: isomorphicGitFsClient,
  dir: isomorphicGitWorkingTreeDir,
  cache: {}
}
const gitRemoteConfig = {
  http: isomorphicGitHttpClient,
  corsProxy: config.proxy,
  url: isomorphicGitUrl,
  author: { // for commits and hard pull
    name: config.author,
    email: config.email
  }
}

const g4cClone = async () => {
  log.info(`${NS}: Running clone.`)
  // TODO: support changing url
  await clone({
    ...gitConfig,
    ...gitRemoteConfig,
    singleBranch: true,
    noCheckout: true,
    depth: 1
  })
}

const g4cPull = async (args) => {
  const sm = {
    fastForwardOnly: false
  }
  if (args.length === 1 && args[0] === '--ff-only') {
    sm.fastForwardOnly = true
  } else if (args.length !== 0) {
    throw new Error('We don\'t support any arguments for pull.')
  }

  const params = {
    ...gitConfig, 
    ...gitRemoteConfig,
    singleBranch: true,
    ...sm
  }

  log.info(`${NS}: Running pull.`)
  await pull(params)

}

const g4cCheckout = async (args) => {
  const sm = {
    FORCE: false // similar to checkout --force
  }
  if (args.length === 2 && args[0] === '--force'  && args[1] === 'HEAD') {
    sm.FORCE = true 
  } else if (args.length === 1 && args[0] === 'HEAD') {
    sm.FORCE = false
  } else {
    throw new Error('We only support --force HEAD as an argument.')
  }

  const params = {
    ...gitConfig, 
    ...gitRemoteConfig,
    singleBranch: true, 
    // corsProxy: proxy, we don't need this as it's saved in repo config.
  }

  if (sm.FORCE) { // may create a merge commit
    log.warn(`${NS}: Running FORCE checkout.`) 
    await checkout(Object.assign({},params,{ force: true }))
  } else {
    log.info(`${NS}: Running checkout.`)
    await checkout(params)
  }
}

const g4cCurrentBranch = async () => {
  try {
    const branch = await currentBranch({
      ...gitConfig,
      fullname: false
    })
    return branch
  } catch (e) {
    if (e.code === 'NotFoundError') {
      return ''
    } else {
      throw e
    }
  }
}


const g4cStatus = async (args) => {
  if (args.length > 0) {
    throw new Error('We don\'t support any arguments for status.')
  }
  await g4cStatus()
}

const printReadMe = async () => {
  const readMe = await readFile(`${pkgDir}README.md`, { encoding: 'utf-8' })
  process.stdout.write(readMe)
}

const main = async () => {
  const command = process.argv[2]
  const args = process.argv.slice(3)
  log.debug('cli arguments:', args)

  const currentBranch = await g4cCurrentBranch()
  if (currentBranch === '') {
    log.info('Initiatting...')
    await g4cClone()
  }

  switch (command) {
    case 'checkout':
      await g4cCheckout(args)
      break
    case 'pull':
      await g4cPull(args)
      break
    case 'add':
      await addToStage(args)
      await g4cStatus()
      break
    case 'commit':
      await g4cCommit(args)
      break
    case 'push':
      await g4cPush(args)
      break
    case 'status':
      await g4cStatus(args)
      break
    default:
      printReadMe()
  }
}
main()

