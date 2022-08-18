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
  
  const makeMapReversible = (map) => map.forEach((v, k, m) => m.set(v, k))
  const HEAD_STATUS = new Map([
    ['absent', 0],
    ['present', 1]
  ])
  const WORKDIR_STATUS = new Map([
    ['absent', 0],
    ['identical_to_head', 1],
    ['different_from_head', 2]
  ])
  const STAGE_STATUS = new Map([
    ['absent', 0],
    ['identical_to_head', 1],
    ['identical_to_workdir', 2],
    ['different_from_workdir', 3]
  ])
  const STATUS_MAPS = [HEAD_STATUS, WORKDIR_STATUS, STAGE_STATUS]
  STATUS_MAPS.forEach(makeMapReversible)
  const gitStatus = async () => {
    const matrix = await statusMatrix({
      ...gitConfig,
      filter: (f) => !f.startsWith('SECRETS.')
    })
    return matrix
  }
  
  const gitAdd = async (matrix) => {
    const result = {
      unchanged: 0,
      added: [],
      removed: [],
      other: []
    }
    for (const status of matrix) {
      const [filePath, headStatus, workdirStatus, stageStatus] = status
      if (workdirStatus === WORKDIR_STATUS.get('different_from_head')) {
        result.added.push(filePath)
        add({
          ...gitConfig,
          filepath: filePath
        })
      } else if (
        headStatus === HEAD_STATUS.get('present') &&
        workdirStatus === WORKDIR_STATUS.get('identical_to_head')
      ) {
        result.unchanged++
        add({
          // isomorphic-git's commit function will delete anything not in stage
          ...gitConfig,
          filepath: filePath
        })
      } else if (
        headStatus === HEAD_STATUS.get('present') &&
        workdirStatus === WORKDIR_STATUS.get('absent')
      ) {
        // remove not neccessary due to isomorphic-git quirk
        result.removed.push(filePath)
      } else {
        result.other.push(status)
      }
    }
  
    if (result.other.length > 0) {
      const prettyOther = result.other.map(
        ([filePath, headStatus, workdirStatus, stageStatus]) => {
          console.log({
            filePath,
            headStatus: HEAD_STATUS.get(headStatus),
            workdirStatus: WORKDIR_STATUS.get(workdirStatus),
            stageStatus: STAGE_STATUS.get(stageStatus)
          })
        }
      )
      console.warn(
        `${NS}: addMatrix: stage is in an unexpected state. Please stash your changes to the stage.`,
        JSON.stringify(prettyOther, null, 2)
      )
    }
  
    return result
  }
  
  const gitCommit = async (message) => {
    const sha = await commit({
      ...gitConfig,
      author: {
        name: author,
        email: email
      },
      message
    })
    return sha
  }
  
  const gitPush = async () => {
    const pushResult = await push({
      ...gitConfig,
      ...gitRemoteConfig,
      remote: 'origin' // probably unnecesary
    })
    return pushResult
  }
  
  const main = async () => {
    const currentBranch = await gitCurrentBranch()
    if (currentBranch === '') {
      await gitClone()
    } else {
      await gitFastForward()
    }
  
    const matrix = await gitStatus()
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
  