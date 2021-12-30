import { exec as execCb } from 'child_process'
import { readdir, readFile, mkdir, writeFile } from 'fs/promises'
import { promisify } from 'util'
import { REPO_DIR, HOME } from './utils.mjs'
import Log, {NS} from './logger.mjs'
const log = new Log({name: 'Install', level: 'warn'})
const exec = promisify(execCb)

const SSHP = `${HOME}/.ssh`

const ERRORS = new Map([
  [
    'CLONE',
    `
    There was a problem cloning the repository.
    - Check your credentials.
    - Check that the SSH URI is valid.
    - Check that you have enough storage.
    `
  ]
])

class Install {
  constructor() {
    this.repoDir = REPO_DIR
    this.remote = process.env[NS + '_REMOTE']
    this.name = process.env[NS + '_NAME'] || 'Sandbox User'
    this.email = process.env[NS + '_EMAIL'] || 'email@example.com'
    this.ed25519Key = process.env[NS + '_ED25519']
    this.rsaKey = process.env[NS + '_RSA']
    this.keyName = this.ed25519Key ? 'id_ed25519' : 'id_rsa'
    this.promise = this.main()
    log.debug(this)
    return this
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
      if (stderr === '') {
        log.info('git clone success.')
      } else {
        log.debug('git clone completed with a warning.', stdout)
        log.warn(stderr)
      }
    } catch (e) {
      console.error(e)
      throw new Error(ERRORS.get('CLONE'))
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
  }
}

export default Install