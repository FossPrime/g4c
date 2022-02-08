import { exec as execCb } from 'child_process'
import { appendFile, readdir, readFile, mkdir, writeFile } from 'fs/promises'
import { promisify } from 'util'
import { PKG_NAME, REPO_DIR, SB, HOME } from './utils.mjs'
import Log, {NS} from './logger.mjs'
const log = new Log({name: 'Install', level: 'warn'})
const exec = promisify(execCb)

const SSHP = `${HOME}/.ssh`

const E = new Map([
  [
    'CLONE',
    `
    There was a problem cloning the repository.
    - Check your credentials.
    - Check that the SSH URI is valid.
    - Check that you have enough storage.
    `
  ],
  [
    'BASHRC',
    `We were unable to update bashrc`
  ]
])

class Install {
  constructor(args) {
    this.repoDir = REPO_DIR
    this.remote = process.env[NS + '_REMOTE']
    this.name = process.env[NS + '_NAME'] || 'Sandbox User'
    this.email = process.env[NS + '_EMAIL'] || 'email@example.com'
    this.ed25519Key = process.env[NS + '_ED25519']
    this.rsaKey = process.env[NS + '_RSA']
    this.keyName = this.ed25519Key ? 'id_ed25519' : 'id_rsa'
    this.isMeta = args[0] === 'meta'

    log.debug(this)
    this.preFlightChecks()
    this.promise = this.main()
    return this
  }

  preFlightChecks() {
    let kill = false
    if (this.remote === undefined) {
      console.error('Please configure the G4C_REMOTE secret')
      kill = true
    }
    if (this.email === undefined) {
      console.warn('Please configure the G4C_EMAIL secret')
      this.email = 'john.doe@example.org' // for pull only scenarios
    }
    if (this.ed25519Key === undefined && this.rsaKey === undefined) {
      console.error('Please configure the G4C_ED25519 or G4C_RSA secret')
      kill = true
    }

    if (kill) {
      process.exit(1)
    }
  }

  async gitConfig() {
    await exec(`git config --global user.name "${this.name}"`)
    await exec(`git config --global user.email "${this.email}"`)
    const { stdout, stderr } = await exec(`git config -l`)
    log.info('Using the following git credentials:\n' + stdout)
    log.debug(stderr)
  }

  async isKeyValid() {
    const expected = [ this.keyName, `${this.keyName}.pub`, 'known_hosts' ]
    try {
      const rdRes = await readdir(SSHP)
      log.info('Cached Keys found.')
      log.debug(rdRes)
      return expected.every(e => rdRes.includes(e))
    } catch (e) {
      log.info('Keys will be updated.')
      log.debug('Failed to read .ssh dir')
      return false
    }
  }
  
  async installKey() {
    await mkdir(SSHP, { recursive: true })
    await exec(`chmod 700 "${SSHP}"`)

    const keyDataRaw = this.ed25519Key || this.rsaKey
    const keyData = keyDataRaw.replaceAll(/\$/g, '\n')
    const keyFPath = `${SSHP}/${this.keyName}`
    writeFile(keyFPath, keyData)
    await exec(`chmod 600 "${keyFPath}"`)
    await exec(`ssh-keygen -y -f "${keyFPath}" > "${keyFPath}.pub"`)
    await exec(`chmod 600 "${keyFPath}.pub"`)
  }
  
  async keyScan() {
    const domain = this.remote.match(/@(.*):/).pop()
    // log.info(domain)
    try {
      await exec(`ssh-keygen -F "${domain}"`)
    } catch (e) {
      // known_hosts missing or domain not found
      if (e.code === 255 || e.code === 1) {
        await exec(`ssh-keyscan "${domain}" >> "${SSHP}/known_hosts"`)
      }
    }
  }

  async isRepoValid() {
    const expected = [ 'HEAD' ]
    try {
      const rdRes = await readdir(this.repoDir + '/.git')
      log.info('Cached Repo found.')
      log.debug('repodir:', rdRes)
      return expected.every(e => rdRes.includes(e))
    } catch (e) {
      log.info('Repo will be updated.')
      log.debug('Failed to read repository directory')
      return false
    }
  }

  async gitClone() {
    try {
      const { stdout, stderr } = await exec(`git clone "${this.remote}" "${this.repoDir}"`)
      log.debug(stdout)
      log.info('git clone success.')
      if (stderr === '') {
        log.debug('git clone:', stderr)
      }
    } catch (e) {
      console.error(e)
      throw new Error(E.get('CLONE'))
    }
  }

  configureBash = async () => {
    const header = `\n\n# Added by ${NS} #\n`
    const configForSelf = `alias git="node ${SB}/src/main.mjs"\n`
    const configForOthers = `alias git="node ${SB}/node_modules/${PKG_NAME}/src/main.mjs"\n`
    const config = this.isMeta ? configForSelf : configForOthers
    const bashrcP = `${HOME}/.bashrc`
    try {
      const bashrc = await readFile(bashrcP, { encoding: 'utf-8' })
      if (bashrc.match(header) === null) {
        await appendFile(bashrcP, header + config)
        log.info('Successfully patched bashrc.')
      }
    } catch(e) {
      console.error(e)
      throw new Error(E.get('BASHRC'))
    }
  }

  async main() {
    await this.gitConfig()
    log.debug('HOME: ', HOME)

    if (! await this.isKeyValid()) {
      await this.installKey()
      await this.keyScan()
    }

    if (! await this.isRepoValid()) {
      await this.gitClone()
    }

    await this.configureBash()
  }
}

export default Install