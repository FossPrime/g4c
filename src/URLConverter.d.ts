type GitHost = 'github.com' | 'gitlab.com' | 'bitbucket.org' 
type URLConverterOptions = {
  host?: GitHost
  ref?: string // git commit or tag
  repoPath: string // e.g https://github.com/username/reponame
}
type ParsedGitURL = {
  // repo is the origin URL from the remote git repo
  original: string
  repo: string
  url: string // ssh or https formatted remote URL
  newDirName: string
  piiUrl?: string // ssh or https formatted URL with PII removed
  branch?: string // PR and tree branch names
}
declare class URLConverter {
    constructor(inputUrl: string, options?: URLConverterOptions);
    /* Takes git like URLs and parses them to git repo refs
      1. Takes shortcut urls with gh and returns github.com URLs
      2. Take github website urls and return an object with an HTTPS repo URL
      3. 
    */
    parsePseudoGitUrl(): ParsedGitURL;
    // private method that strips protocols from the input url
    // unless it is a localhost one
    #enforceHttpsProtocol(urlStr: string): string;
    #spreadShortName(urlStr: string): string;
    #appendGitExtension(urlStr: string): string;
}
export { URLConverter }