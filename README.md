<p align="center">
  <a href="https://feathersjs.com" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://unpkg.com/g4c@1.2.2/docs/logo.svg" alt="G4C logo">
  </a>
</p>
<br/>
<p align="center">
  # g4c - Git for Cloud  
  A basic pure js git CLI implementation based on isomorphic-git.<br><br>
  <a href="https://stackblitz.com/fork/g4c-demo"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz"></a> 
  <!--a href="https://replit.com/new/github/feathersjs/playground"><img src="https://replit.com/badge/github/feathersjs/playground" alt="Run on Repl.it"></a--> 
</p>
<br/>


- [Issue tracker](https://gitlab.com/vblip/g4c/-/issues)
- [Merge requests](https://gitlab.com/vblip/g4c/-/merge_requests)
- [GitHub mirror](https://github.com/FossPrime/g4c)
- [NPM](https://www.npmjs.com/package/g4c)


## Commands supported

```sh
- g4c clone URL
- g4c clone URL DIRECTORY
- g4c clone # (automatically clones from package.json, or secrets file)
- g4c checkout --force HEAD
- g4c pull
- g4c pull --ff-only
- g4c status
- g4c add --all
- g4c commit -m "My commit message"
- g4c push
```

**TODO:**

```sh
- git # As an alias, comming soon
- g4c add FILE(s)
- g4c add .
```


## Setup

- `npm i -D g4c`
- `npm i -g g4c` -- Global install

<!--
`npx g4c` or `npx git` will work at that point.  
In stackblitz `git` and `g4c` both work as node_modules/.bin is in the path.
-->

### Configuration Precedence

- First, the long form package.json -> repository field is read
- Then, package.json -> author field is read for email and name
- Then, package.json -> g4c
- Finally, SECRETS.g4c.json can veto all others
- Unless, yoy provided an argument in the command line

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
