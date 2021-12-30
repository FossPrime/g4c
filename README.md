# git-4-csb

## Summary

Aims to seamlessly support basic git
commands via a bash alias in CodeSandbox.

- [Master sandbox](https://codesandbox.io/s/git-4-csb-r3f01?file=/README.md)
- [Git tracker](https://gitlab.com/vblip/git-4-csb)

## Commands we will support

Note: To bypass the bash alias and access the real git, use `\git`

- git add .
- git commit -m "My commit message"
- git push
- git pull
- git status

- g4c install
  - To be run after install through the package.json "prestart" script. Reads the env vars and modifies the container with a stable private key and a `.bashrc` alias.
- g4c keygen
  - Runs ssh-keygen and escapes the new lines for use in G4C_ED25519

## Setup

First, `npm i --save-dev git-4-csb`. This will give you access to the g4c command.

Second, generate your ssh-keys with `g4c keygen`

Third, configure the CodeSandbox secret environment variables

- G4C_EMAIL
  - eg: `12345-CrashOverride@users.noreply.gitlab.com`
- G4C_REMOTE
  - a valid git ssh URI
  - eg: git@gitlab.com:evilcorp/e-coin.git
- G4C_ED25519
  - Your private key, with new lines replaced by \$ signs
- G4C_RSA (alternatively)
  - same thing, but for RSA

Finally, add `"predev": "g4c i || :"` under your package.json scripts. Replace prestart with predevelop, preserve or prestart if you do not have a "dev" script.

"install" scripts **won't work** as we need access to the secrets which are not available at install time, only at final runtime.
