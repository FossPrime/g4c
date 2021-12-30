import Install from './install.mjs'
import { HOME, REPO_DIR, PCMD, sleep } from './utils.mjs'
import Log from './logger.mjs'

import { promisify } from 'util'
import { exec as execCb } from 'child_process'
import { readFile } from 'fs/promises'

// Pseudo-modules
const log = new Log({ level: 3 })
const exec = promisify(execCb)

const finishedMsg = '終了しました。'
const sandboxP = '/sandbox'

let ncp = 0

async function gitSync(isPush) {
  const maxFiles = isPush ? 999 : 45
  const sleepMax = isPush ? 0.001 : 5
  const commonX = ['node_modules', '.git']
  const pullX = ['package.json', 'zombies', '.vscode', 'yarn.lock', 'package-lock.json']
  const exclude = isPush ? commonX : [...commonX, ...pullX]
  const source = isPush ? sandboxP : REPO_DIR
  const destination = isPush ? REPO_DIR : sandboxP  
  await exec('yarn add rsyncjs@latest --dev > /dev/null 2>&1')
  const rsync = (await import('rsyncjs')).async
  await sleep(3)
  await rsync(source, destination, {
    deleteOrphaned: false,
    exclude,
    async afterEachSync({relativePath}) {
      ncp++
      // process.stdout.write(`${relativePath}\n`)
      process.stdout.write(`.`)

      if (ncp > maxFiles) {
        process.stdout.write(`\nTaking a ${sleepMax} second break\n`)
        await sleep(sleepMax)
        ncp = 0
      }
    }
  })

  console.log('\n' + finishedMsg)
}

const keygen = async () => {
  const filePath = `${HOME}/.ssh/id_ed25519`
  const genCmd = `ssh-keygen -N "" -t ed25519 -f "${filePath}"`
  await exec(genCmd)    
  // Use fsPromises.readFile() method
  // to read the file 
  console.log('G4C_ED25519:')
  const privKey = await readFile(filePath, { encoding: 'utf-8' })
  console.log(privKey.replaceAll(/\n/g, '$'))

  console.log('\nPublic Key:')
  const pubKey = await readFile(filePath + '.pub', { encoding: 'utf-8' })
  console.log(pubKey)
}

const addToStage = async () => {
  const { stdout: addResOut, stderr: addResErr } = await exec(`${PCMD} git add .`)
  log.info('addRes:', addResOut, addResErr)
}


const status = async () => {
  const { stdout: statusOut, stderr: statusErr } = await exec(`${PCMD} git status`)
  log.info('statusRes:', statusOut, statusErr)
}

const main = async () => {
  const command = process.argv[2]
  const args = process.argv.slice(3)
  log.info('cli arguments:', args)

  switch (command) {
    case 'keygen':
      keygen()
      break
    case 'i':
    case 'install':
      const install = new Install()
      await install.promise
      break
    case 'add':
      await gitSync(true)
      await addToStage(args)
      await status()
      break
    case 'commit':
      log.warn('ERROR: NOT IMPLEMENTED.')
      break
    case 'push':
      gitSync(true)
      break
    case 'pull':
      gitSync(false)
      break
    case 'status':
      log.warn('ERROR: NOT IMPLEMENTED.')
      break
    default:
      log.info('See readme for ussage.')
  }
}
main()

