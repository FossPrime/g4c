import { NS } from './logger.mjs'

export const PKG_NAME = 'g4c'
export const HOME = process.env.HOME
export const REPO_DIR = process.env[NS + '_DIR'] || '/tmp/g4c'
export const PCMD = `cd "${REPO_DIR}" &&`
export const sleep = s => new Promise(p => setTimeout(p, s*1000))