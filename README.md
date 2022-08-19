# g4c - Git for CodeSandbox

## Summary

Aims to seamlessly support basic git
commands via a bash alias in CodeSandbox.

- [Master sandbox](https://codesandbox.io/s/g4c-git-for-codesandbox-r3f01)
- [Git tracker](https://gitlab.com/vblip/g4c)

## Commands we will support

Note: To bypass the bash alias and access the real git, use `\git`

- g4c checkout // done
- g4c checkout --force // done
- g4c pull // done
- g4c pull --ff-only // done

**TODO:**

- g4c add --all
- g4c commit -m "My commit message"
- g4c push
- g4c status
- git baremetal passthrough

## Setup

First, `yarn add --dev g4c`. This will give you access to the g4c command.

Second, generate your ssh-keys with `npx g4c keygen`

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

Finally, add `"predev": "npx -y g4c i || :"` under your package.json scripts. Replace prestart with predevelop, preserve or prestart if you do not have a "dev" script.

"install" scripts **won't work** as we need access to the secrets which are not available at install time, only at final runtime.

## Known Issues

- Binaries like PNGs are problematic. They are modified by CSB every time they are written, so keeping the exact same binary in git as in CSB is impossible. It may be possible to hide this issue by handling exif data.
- `npx -y g4c i` should install latest if not found

Also,

Every call to rsyncjs copies all files, even if they are the same or have been copied before. As read calls are cheaper than write ones, one solution is to add support for a checksum function which will compare the file if the destination is younger. Hardlinks are not an option in CSB, as `/sandbox` has it's own device.

```
# How does git find changes?
Indexing. For every tracked file, Git records information such as its size, creation time and last modification time in a file known as the index. To determine whether a file has changed, Git compares its current stats with those cached in the index. If they match, then Git can skip reading the file again.
```

CodeSandbox it's self uses a similar strategy, because of it, the git clone files and the sandbox directory will have very similar mtime/ctime.
