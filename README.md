# g4c - Git for CodeSandbox

A basic pure js git CLI implementation based on isomorphic-git.

- [Git tracker](https://gitlab.com/vblip/g4c)

## Commands we will support

- g4c checkout // done
- g4c checkout --force // done
- g4c pull // done
- g4c pull --ff-only // done
- g4c status
- g4c add --all
- g4c commit -m "My commit message"
- g4c push

**TODO:**

- g4c add FILE
- git baremetal passthrough
- git clone URL

## Setup

`npm i -D g4c`

### Configuration Precedence

- First the long form package.json -> repository field is read
- Then, package.json g4c
- Finally, SECRETS.g4c.json can veto all others

All of these are optional:

```
// SECRETS.g4c.json
{
  "proxy": "https://cors.isomorphic-git.org",
  "username": "inu",
  "password": "neko",
  "authorName": "John Doe",
  "authorEmail": "john@example.com"
}
```

## Known Issues

[Issue tracker](https://gitlab.com/vblip/g4c/-/issues)
