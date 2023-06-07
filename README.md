# g4c - Git for Cloud

A basic pure js git CLI implementation based on isomorphic-git.

- [Issue tracker](https://gitlab.com/vblip/g4c/-/issues)
- [Merge requests](https://gitlab.com/vblip/g4c/-/merge_requests)
- [GitHub mirror](https://github.com/FossPrime/g4c)
- [NPM](https://www.npmjs.com/package/g4c)

## Commands supported

- g4c clone URL
- g4c clone # (automatically clones from package.json, or secrets file)
- g4c checkout --force HEAD
- g4c pull
- g4c pull --ff-only
- g4c status
- g4c add --all
- g4c commit -m "My commit message"
- g4c push

**TODO:**

- g4c add FILE


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
