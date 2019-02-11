/*
 * Primary file for the API
 */

// Dependencies
const http = require('http')
const url = require('url')

// The server should respond to all requests withh a string
const server = http.createServer(function(req, res){

  // Get the URL and parse it
  const parsedURL = url.parse(req.url, true)

  // Get the path
  const path = parsedURL.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // Get the query string as an object
  const queryStringObject = parsedURL.query

  // Get the HTTP method
  const method = req.method.toLowerCase()

  // Get the headers as an object
  const headers = req.headers

  // Send thhe respond
  res.end('Hello world\n')

  // Log the request path
  console.log('Request received with these headers: ', headers)
})

// Start thhe server, and have it listen on port 3000
server.listen(3000, function(){
  console.log('The server is listening on port 3000 now')
})