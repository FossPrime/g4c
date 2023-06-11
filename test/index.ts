// URLConverter.test.js
import test from 'node:test'
import { strictEqual } from 'node:assert'
import { URLConverter } from '../src/URLConverter.js'

globalThis.process.chdir('/tmp')
console.log(`
 _____
< CI IS WORKING! > 
 -----
        |   ^__^
         |  (oo)=_______
           %(__)%       )=~^
                ||----w |
                ||     ||
`)

// - From sub folders
//   - https://github.com/vitejs/vite/tree/main/packages/create-vite/template-vanilla-ts
// - From the pull request URL's
//   - https://github.com/marshallswain/feathers-pinia/pull/132
//  - From a folder with a branch that has forward slashes
//   - https://github.com/vitejs/vite/tree/docs/philosophy/packages/create-vite/template-vanilla-ts
// - From commit hash
//   - https://github.com/joshmarinacci/node-pureimage/commit/c9aff9dbb39d06d5dca86c9a375dd86c3cea0315
// - From version tags
//   - https://github.com/marshallswain/feathers-pinia/releases/tag/v3.0.0
// - ✅ Extensionless .git url
//   - https://github.com/dominictarr/JSONStream
// - ✅ With .git extension
//   - git://github.com/feathersjs/feathers.git
// - ✅ Cloning from private repos
//   - https://vslite.dev/~/gitlab+deploy-token-2130493:c6zRhq_mdPczz_9p_k_o@gitlab.com/vblip/example-private.git
// - ❗From glitch password-less, username'd repo url
//   - b37f30a5-2412-4e62-8c64-69de4e7e11c1@api.glitch.com/git/friggin-cat-weather.git
// - ❓GitLab Wiki URL's
//   - https://gitlab.com/painlessMesh/painlessMesh.wiki.git
// - Starts with double protocol
//   - https://https://gitlab.com/painlessMesh/painlessMesh.wiki.git

test('convert GitHub project page', (t) => {
  const converter = new URLConverter('https://github.com/FossPrime/feathers-halloween')
  const expectedOutput = 'https://github.com/FossPrime/feathers-halloween.git'
  const actualOutput = converter.parsePseudoGitUrl()
  strictEqual(actualOutput.url, expectedOutput)
})

test('convert gh host to GitHub URL', (t) => {
  const converter = new URLConverter('gh/marshallswain/feathers-pinia')
  const expectedOutput = 'https://github.com/marshallswain/feathers-pinia.git'
  const actualOutput = converter.parsePseudoGitUrl()
  strictEqual(actualOutput.url, expectedOutput)
})

test('convert https://gh host to GitHub URL', (t) => {
  const converter = new URLConverter('https://gh/marshallswain/feathers-pinia')
  const expectedOutput = 'https://github.com/marshallswain/feathers-pinia.git'
  const actualOutput = converter.parsePseudoGitUrl()
  strictEqual(actualOutput.url, expectedOutput)
})

test('convert https://user:pass@x.com host to clean URL', (t) => {
  const piiStr = 'https://user:pass@x.com/path/to/repo'
  const converter = new URLConverter(piiStr)
  const expectedOutput = 'https://x.com/path/to/repo.git'
  const actualOutput = converter.parsePseudoGitUrl()
  strictEqual(actualOutput.url, expectedOutput)
  strictEqual(actualOutput.piiUrl, piiStr + '.git')
})

test('convert PR URL with correct newDirName and branch', (t) => {
  const piiStr = 'https://github.com/marshallswain/feathers-pinia/pull/132'
  const converter = new URLConverter(piiStr)
  const expectedUrl = 'https://github.com/marshallswain/feathers-pinia.git'
  const expectedDirName = 'feathers-pinia'
  const expectedBranchName = 'pull/132/head'
  const actualOutput = converter.parsePseudoGitUrl()
  strictEqual(actualOutput.url, expectedUrl)
  strictEqual(actualOutput.newDirName, expectedDirName)
  strictEqual(actualOutput.virtualBranch, expectedBranchName)
})


test('convert URL with user/repo/tree/branch format', (t) => {
  const piiStr = 'https://github.com/feathersjs/playground/tree/main'
  const converter = new URLConverter(piiStr)
  const expectedUrl = 'https://github.com/marshallswain/feathers-pinia.git'
  const expectedDirName = 'feathers-pinia'
  const expectedBranchName = 'pull/132/head'
  const actualOutput = converter.parsePseudoGitUrl()
  strictEqual(actualOutput.url, expectedUrl)
  strictEqual(actualOutput.newDirName, expectedDirName)
  strictEqual(actualOutput.branch, expectedBranchName)
})

// test('Can clone regular repos', (t) => {

  
// git clone https://gh/piuccio/cowsay './'

// PR and Branch that ends with forward slash

// Clone a branch that happens to be the default branch
//   - https://github.com/piuccio/cowsay/tree/master
// More tests for the other URLs...
// https://https://hithib.com
// ssh://git@github.com:FossPrime/halloween.git
// allow capitalization
// http://[2001:db8::1]:80
// https://gitlab.com/painlessMesh/painlessMesh.wiki.git
// Todo: Glitch.com uses username as password...
