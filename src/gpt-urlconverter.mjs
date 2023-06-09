// URLConverter.js
import { URL } from 'url';

export default class URLConverter {
  constructor(inputUrl) {
    this.inputUrl = inputUrl;
    this.url = new URL(inputUrl);
  }

  convertToGitCLIUrl() {
    if (this.url.host !== 'github.com') {
      throw new Error('The URL must be a GitHub URL');
    }

    const pathParts = this.url.pathname.split('/').filter(part => part);

    if (pathParts.length < 2) {
      throw new Error('The URL is not a valid GitHub repository or subfolder URL');
    }

    let gitUrl = `git://github.com/${pathParts[0]}/${pathParts[1]}.git`;

    if (pathParts[2] === 'tree' && pathParts.length >= 5) {
      gitUrl += `#${pathParts[3]}:${pathParts.slice(4).join('/')}`;
    } else if (pathParts[2] === 'pull' && pathParts.length >= 4) {
      gitUrl += `#pull/${pathParts[3]}/head`;
    }

    return gitUrl;
  }
}
