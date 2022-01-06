#!/usr/bin/env node
import Install from './install.mjs'
import { exec, SB, HOME, REPO_DIR, PCMD, sleep } from './utils.mjs'
import Log from './logger.mjs'
import { readFile } from 'fs/promises'

// Pseudo-modules
const log = new Log({ name: 'main', level: 3 })

let ncp = 0

async function gitSync(isPush) {
  const maxFiles = isPush ? 999 : 45
  const sleepMax = isPush ? 0.001 : 5
  const commonX = ['node_modules', '.git']
  const pullX = ['package.json', 'zombies', '.vscode', 'yarn.lock', 'package-lock.json']
  const exclude = isPush ? commonX : [...commonX, ...pullX]
  const source = isPush ? SB : REPO_DIR
  const destination = isPush ? REPO_DIR : SB  
  await exec('yarn add rsyncjs@latest --dev > /dev/null 2>&1')
  const rsync = (await import('rsyncjs')).async
  await sleep(3)
  await rsync(source, destination, {
    deleteOrphaned: false,
    exclude,
    async afterEachSync({relativePath}) {
      ncp++
      log.debug(`${relativePath}`)
      process.stdout.write(`.`)

      if (ncp > maxFiles) {
        process.stdout.write(`\nTaking a ${sleepMax} second break\n`)
        await sleep(sleepMax)
        ncp = 0
      }
    }
  })

  process.stdout.write('\n終了しました。\n')
}

const keygen = async () => {
  const filePath = `${HOME}/.ssh/id_ed25519`
  const genCmd = `ssh-keygen -N "" -t ed25519 -f "${filePath}"`
  await exec(genCmd)    
  // Use fsPromises.readFile() method
  // to read the file 
  log.info('G4C_ED25519:')
  const privKey = await readFile(filePath, { encoding: 'utf-8' })
  log.info(privKey.replaceAll(/\n/g, '$'))

  log.info('\nPublic Key:')
  const pubKey = await readFile(filePath + '.pub', { encoding: 'utf-8' })
  log.info(pubKey)
}

const addToStage = async (args) => {
  if (args[0] !== '.') {
    throw new Error('We only support "." as a parameter.')
  }
  await gitSync(true)
  const { stdout: addResOut, stderr: addResErr } = await exec(`${PCMD} git add .`)
  log.info('addRes:', addResOut, addResErr)
}


const commit = async (args) => {
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

const push = async (args) => {
  if (args.length > 0) {
    throw new Error('We don\'t support any arguments for push.')
  }
  const { stdout, stderr } = await exec(`${PCMD} git push`)
  log.info(stdout, stderr)
}

const pull = async (args) => {
  if (args.length > 0) {
    throw new Error('We don\'t support any arguments for pull.')
  }
  await await gitSync(false)
  const { stdout, stderr } = await exec(`${PCMD} git pull`)
  log.info('pull:', stdout, stderr)
}

const gitStatus = async () => {
  const { stdout: statusOut, stderr: statusErr } = await exec(`${PCMD} git status`)
  log.info('status:', statusOut, statusErr)
}

const status = async (args) => {
  if (args.length > 0) {
    throw new Error('We don\'t support any arguments for status.')
  }
  await gitStatus()
}

const printReadMe = async () => {
  const readMe = await readFile(`${SB}/README.md`, { encoding: 'utf-8' })
  process.stdout.write(readMe)
}

const main = async () => {
  const command = process.argv[2]
  const args = process.argv.slice(3)
  log.debug('cli arguments:', args)

  switch (command) {
    case 'keygen':
      keygen()
      break
    case 'i':
    case 'install':
      const install = new Install(args)
      await install.promise
      process.stdout.write('インストールに成功\n')
      break
    case 'add':
      await addToStage(args)
      await gitStatus()
      break
    case 'commit':
      await commit(args)
      break
    case 'push':
      await push(args)
      break
    case 'pull':
      // todo: make a tarball backup first
      log.warn('This is dangerous.')
      await pull(args)
      break
    case 'status':
      await status(args)
      break
    default:
      printReadMe()
  }
}
main()

