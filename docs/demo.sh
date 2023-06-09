#!/bin/bash
set -euox pipefail
export npm_config_yes=true 

g4c clone 'https://github.com/piuccio/cowsay.git'
g4c clone 'https://github.com/piuccio/cowsay.git' MOO

cd cowsay
touch grass.md
g4c status

g4c add --all
g4c status

g4c commit -m 'touched grass...'
# git push