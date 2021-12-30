import http from 'http'
import { readFile } from 'fs/promises'
const doc = './README.md'

//create a server object:
http
  .createServer(async (req, res) => {
    res.write(`<!DOCTYPE html>
    <html><head><meta charset="utf-8" /></head><body>
    `)
    const output = await readFile(doc, { encoding: 'utf-8' })
    res.write('<pre>' + output + '</pre>') //write a response to the client
    res.write('</body></html>')
    res.end() //end the response
  })
  .listen(8080) //the server object listens on port 8080
