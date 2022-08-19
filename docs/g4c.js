// Prototype pure-js implementation
// git.mjs -- push all changes to Git
// Usage: `node git.mjs`

  
  
  const gitUrl = new URL(repoUrl)
  if (username) {
    gitUrl.username = username
    gitUrl.password = password
  }
  const isomorphicGitUrl = gitUrl.toString()
  // const workdir = tmpdir() + '/' + NS
  const gitConfig = {
    fs: isomorphicGitFsClient,
    dir: isomorphicGitWorkingTreeDir,
    cache: {}
  }
  const gitRemoteConfig = {
    http: isomorphicGitHttpClient,
    corsProxy: proxy,
    url: isomorphicGitUrl
  }
  const gitClone = async () => {
    await clone({
      ...gitConfig,
      ...gitRemoteConfig,
      singleBranch: true,
      noCheckout: !CHECKOUT,
      depth: 1
    })
  }
  
  const gitFastForward = async () => {
    const params = {
      ...gitConfig,
      ...gitRemoteConfig,
      singleBranch: true
      // corsProxy: proxy, we don't need this as it's saved in repo config.
    }
    if (CHECKOUT) {
      await fastForward(params)
    } else if (FETCH) {
      await fetch(params)
    } else {
      throw new Error(
        `${NS}: FastForward failed. Nither fetch, nor checkout are enabled.`
      )
    }
  }
  
  const gitCurrentBranch = async () => {
    try {
      const branch = await currentBranch({
        ...gitConfig,
        fullname: false
      })
      return branch
    } catch (e) {
      if (e.code === 'NotFoundError') {
        return ''
      } else {
        throw e
      }
    }
  }
  
  
  const main = async () => {
    const currentBranch = await gitCurrentBranch()
    if (currentBranch === '') {
      await gitClone()
    } else {
      await gitFastForward()
    }
  
    const addResult = await gitAdd(matrix)
    if (addResult.added.length > 0 || addResult.removed.length > 0) {
      const message =
        GIT_COMMIT_MESSAGE + '\n' + JSON.stringify(addResult, null, 2)
      console.log(message)
      await gitCommit(message)
    } else {
      console.log('Nothing to commit.')
    }
    if (PUSH) {
      await gitPush()
      console.log('Push successful.')
    }
  }
  
  // Bootstrap
  if (import.meta?.url?.endsWith(process.argv[1])) {
    await main()
  }
  