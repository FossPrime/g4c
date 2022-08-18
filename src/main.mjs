#!/usr/bin/env node
import Install from './install.mjs'
import { exec, getConfig, PCMD, sleep } from './utils.mjs'
import Log from './logger.mjs'
import { readFile } from 'node:fs/promises'
import { URL } from 'node:url'; // in Browser, the URL in native accessible on window
import {
  fetch,
  clone,
  fastForward,
  currentBranch,
  add,
  commit,
  push,
  statusMatrix
} from 'isomorphic-git'
import { default as isomorphicGitFsClient } from 'node:fs'
import path from 'node:path'

// HARD CONFIG
const PUSH = true
const CHECKOUT = false // DANGER: true WILL overrite your SB code
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
const log = new Log({ name: 'main', level: 3 })

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
  url: isomorphicGitUrl
}
const g4cClone = async () => {
  await clone({
    ...gitConfig,
    ...gitRemoteConfig,
    singleBranch: true,
    noCheckout: !CHECKOUT,
    depth: 1
  })
}

const g4cPull = async (args) => {
  if (args.length > 0) {
    throw new Error('We don\'t support any arguments for pull.')
  }
  const params = {
    ...gitConfig,
    ...gitRemoteConfig,
    singleBranch: true
    // corsProxy: proxy, we don't need this as it's saved in repo config.
  }
  if (CHECKOUT) {
    await fastForward(params)
  } else if (FETCH) {
    await fetch(params)
  } else {
    throw new Error(
      `${NS}: FastForward failed. Nither fetch, nor checkout are enabled.`
    )
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

  switch (command) {
    case 'i': // DELETE ME... This doesnt do anything anymore, i think
    case 'install':
      const install = new Install(args)
      await install.promise
      process.stdout.write('インストールに成功\n')
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
    case 'pull':
      // todo: make a tarball backup first
      log.warn('This is dangerous.')
      await g4cPull(args)
      break
    case 'status':
      await g4cStatus(args)
      break
    default:
      printReadMe()
  }
}
main()

