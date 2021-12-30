#!/bin/bash
# GITREPO="git@gitlab.com:tdps/td-courseware.git"
# ed25519="----PRIVATE KEY----$AbxAGFp0"
set -euo pipefail

REPONAME=`basename "$GITREPO"`
REPOCANONICAL=${REPONAME/.git}
RAWPATH=${GITREPO##*:}
REPODIR="${HOME}/git/${RAWPATH/.git}"
SANDBOXDIR='/sandbox'
git config --global user.email "${EMAIL}"
git config --global user.name "CodeSandbox"

mkdir -p "$HOME/.ssh"
echo "${ed25519}" | tr '$' '\n' > "$HOME/.ssh/id_ed25519"  
chmod 700 "$HOME/.ssh"
chmod 600 "$HOME/.ssh/id_ed25519"

if ! grep "$(ssh-keyscan gitlab.com 2>/dev/null)" ~/.ssh/known_hosts > /dev/null; then
    ssh-keyscan gitlab.com >> ~/.ssh/known_hosts
    ssh-keygen -y -f ~/.ssh/id_ed25519 > ~/.ssh/id_ed25519.pub
fi

mkdir -p "${REPODIR}"
if [ -d "$REPODIR/.git" ]; then
  echo 'updating repo.'
  cd "${REPODIR}"
  git pull
else
  echo 'creating repo.'
  git clone "${GITREPO}" "${REPODIR}"
fi

cd "${REPODIR}"
# cp -a /sandbox/package.json .
#git add -A
#git commit -m 'CodeSandbox checkpoint' || :
#git push

cd "${SANDBOXDIR}"
#mkdir -p courses
#cp -a "${WIKIDIR}/"* "${SANDBOXDIR}/courses"

set -m
npm run post-git-start


