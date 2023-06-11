export npm_config_yes=true 
DEMODIR=DEMO-`date +%FT%TZ`
mkdir $DEMODIR
cd $DEMODIR
sleep 1

g4c clone 'https://github.com/piuccio/cowsay.git'

sleep 1
g4c clone 'https://github.com/piuccio/cowsay.git' MOO

cd cowsay
touch grass.md
sleep 1
g4c status
sleep 1

g4c add --all
sleep 1

g4c status
sleep 1

cd "../../$DEMODIR"
echo "cloning LowDB in place"
g4c clone 'https://github.com/typicode/lowdb' './'

g4c commit -m 'touched grass...'
# git push