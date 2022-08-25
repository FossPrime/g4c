# g4c - Git for Cloud

A basic pure js git CLI implementation based on isomorphic-git.

- [Git tracker](https://gitlab.com/vblip/g4c)

## Commands supported

- git checkout --force HEAD
- git pull
- git pull --ff-only
- git status
- git add --all
- git commit -m "My commit message"
- git push

**TODO:**

- git add FILE
- git clone URL // Currently automatically clones during checkout

## Setup

`npm i -D g4c`

`npx g4c` or `npx git` will work at that point.  
In stackblitz `git` and `g4c` both work as node_modules/.bin is in the path.

### Configuration Precedence

- First the long form package.json -> repository field is read
- Then, package.json g4c
- Finally, SECRETS.g4c.json can veto all others

All of these are optional:

```
// SECRETS.g4c.json
{
  "proxy": "https://cors.isomorphic-git.org",
  "useProxyOnBareMetal": false,
  "username": "inu",
  "password": "neko",
  "authorName": "John Doe",
  "authorEmail": "john@example.com",
  "repoUrl": "https://github-sucks.com/user/project.git"
}
```

## Known Issues

[Issue tracker](https://gitlab.com/vblip/g4c/-/issues)
