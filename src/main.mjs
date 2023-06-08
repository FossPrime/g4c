#!/usr/bin/env node
import { getConfig, PKG_NAME, SECRETS_PFX, HEAD_STATUS, WORKDIR_STATUS, prettifyMatrix, passThrough } from './utils.mjs'
import Log from './logger.mjs'
import { readFile, mkdir } from 'node:fs/promises'
import { URL } from 'node:url'; // in Browser, the URL in native accessible on window
import {
  clone,
  pull,
  currentBranch,
  add,
  remove,
  commit,
  push,
  statusMatrix,
  checkout,
  deleteRemote
} from 'isomorphic-git'
import isomorphicGitHttpClient from 'isomorphic-git/http/node/index.js'
import { default as isomorphicGitFsClient } from 'node:fs'

// HARD CONFIG
const NS = 'main'

// const isomorphicGitHttpClient = await import('isomorphic-git/http/node/index.js')
const isomorphicGitWorkingTreeDir = './'
const debug = (...args) => globalThis.process?.env?.DEBUG ? console.debug('g4c/core', ...args) : ()=>{}

const config = await getConfig() // BAD structure

// Pseudo-modules
const pkgDir = new URL('..', import.meta.url).pathname


// const workdir = tmpdir() + '/' + NS
const gitConfig = {
  fs: isomorphicGitFsClient,
  dir: isomorphicGitWorkingTreeDir,
  cache: {}
}
const gitRemoteConfig = {
  http: isomorphicGitHttpClient,
  corsProxy: config.proxy,
  url: config.piiUrl || undefined,
  author: { // for commits and hard pull
    name: config.authorName,
    email: config.authorEmail
  }
}

const g4cCommit = async (args) => {
  const sm = {
    message: null
  }
  if (args[0] === '-m' && typeof args[1] === 'string') {
    sm.message = args[1]
  } else {
    throw new Error('We only support "-m" as a parameter.')
  }

  const sha = await commit({
    ...gitConfig,
    author: gitRemoteConfig.author,
    ...sm
  })

  return sha
}

const g4cPush = async (args) => {
  if (args.length > 0) {
    throw new Error('We don\'t support any arguments for push.')
  }
  // if (gitUrl.password) {
  //   try{await deleteRemote({ ...gitConfig, remote: 'origin' })} catch {}
  // }
  const pushResult = await push({
    ...gitConfig,
    ...gitRemoteConfig
  })
  console.info('Push successful.')
  
  return pushResult
} 


const g4cClone = async (args, { init = false } = {}) => {
  const sm = {
    noCheckout: false
  }
  if (init === true) {
    sm.noCheckout = true
  }
  // console.info(`${NS}: Running clone.`)
  // TODO: support changing url
  await clone({
    ...gitConfig,
    ...gitRemoteConfig,
    singleBranch: true,
    depth: 1,
    ...sm
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

  console.info(`${NS}: Running pull.`)
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
    console.warn(`${NS}: Running FORCE checkout.`) 
    await checkout(Object.assign({},params,{ force: true }))
  } else {
    console.info(`${NS}: Running checkout.`)
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


const g4cStatus = async (args, { human = false } = {}) => {
  if (args.length > 0) {
    throw new Error('We don\'t support any arguments for status.')
  }

  const matrix = await statusMatrix({
    ...gitConfig,
    filter: (f) => !f.startsWith(SECRETS_PFX)
  })
  if (human === true) {
    console.log(prettifyMatrix(matrix))
  }
  
  return matrix
}

const g4cAdd = async (args) => {
  if (args[0] !== '--all') {
    throw new Error('We only support "--all" as a parameter.')
  }
  
  const matrix = await g4cStatus([])
  const result = {
    unchanged: 0,
    added: [],
    removed: [],
    other: []
  }
  for (const status of matrix) {
    const [filepath, headStatus, workdirStatus, stageStatus] = status
    if (workdirStatus === WORKDIR_STATUS.get('different_from_head')) {
      result.added.push(filepath)
      add({
        ...gitConfig,
        filepath: filepath
      })
    } else if (
      headStatus === HEAD_STATUS.get('present') &&
      workdirStatus === WORKDIR_STATUS.get('identical_to_head')
    ) {
      result.unchanged++
      add({
        // isomorphic-git's commit function will delete anything not in stage
        ...gitConfig,
        filepath: filepath
      })
    } else if (
      headStatus === HEAD_STATUS.get('present') &&
      workdirStatus === WORKDIR_STATUS.get('absent')
    ) {
      result.removed.push(filepath)
      await remove({ ...gitConfig, filepath })
    } else {
      result.other.push(status)
    }
  }

  if (result.other.length > 0) {
    console.warn(
      `${NS}: addMatrix: stage is in an unexpected state. Please stash your changes to the stage.`,
      prettifyMatrix(result.other)
    )
  } else {
    await g4cStatus([], { human: true })
  }
}

const printReadMe = async () => {
  const readMe = await readFile(`${pkgDir}README.md`, { encoding: 'utf-8' })
  process.stdout.write(readMe)
}

const main = async (_node, _js, command, ...args) => {
  debug('cli arguments:', args)

  // const currentBranch = await g4cCurrentBranch()
  switch (command) {
    case 'clone':
        const urlCliArg = args[0]
        if (urlCliArg) {
          const newDirName = args[1] ?? new URL(urlCliArg).pathname?.split('/')?.at(-1)?.replace(/.git$/, '')
          await mkdir(newDirName)
          process.chdir(newDirName)
          console.info(`Cloning to ${newDirName}…`)
        } else {
          console.info('Cloning in place…')
        }
        // Attempts to checkout in-place from repo defined in config
        await g4cClone(args, { init: true })
        await g4cCheckout(['HEAD'])
      break
    case 'checkout':
      await g4cCheckout(args)
      break
    case 'pull':
      await g4cPull(args)
      break
    case 'status':
      await g4cStatus(args, { human: true })
      break
    case 'add':
      await g4cAdd(args)
      break
    case 'commit':
      const sha = await g4cCommit(args)
      console.info(`Commit success, SHA: ${sha}`)
      break
    case 'push':
      await g4cPush(args)
      break
    default:
      printReadMe()
  }
}
main(...globalThis.process.argv)

