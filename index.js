/*
 * Primary file for the API
 *
 * 
 */

// Dependencies
const http = require('http')
const url = require('url')

// The server should respond to all requests withh a string
const server = http.createServer(function(req, res){

  // Get the URL and parse it
  const parseURL = url.parse(req.url, true)

  // Get the path
  const path = parseURL.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // Send thhe respond
  res.end('Hello world\n')

  // Log the request path
  console.log('Request received on path: ' + trimmedPath)
})

// Start thhe server, and have it listen on port 3000
server.listen(3000, function(){
  console.log('The server is listening on port 3000 now')
})