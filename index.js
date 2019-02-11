/*
 * Primary file for the API
 */

// Dependencies
const http = require('http')
const https = require('https')
const config = require('./lib/config')
const fs = require('fs')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')

// Instantiate the HTTP server
const httpServer = http.createServer(function(req, res){
  unifiedServer(req,res)
})

// Start the server, and have it listen on port 3000 (staging) or 5000 (production)
httpServer.listen(config.httpPort, function(){
  console.log(`The http server is listening on port ${config.httpPort}`)
})

// Instantiate the HTTPS server
const httpsServiceOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsServiceOptions,function(req, res){
  unifiedServer(req,res)
})

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function(){
  console.log(`The https server is listening on port ${config.httpsPort}`)
})

// All the server logic for bothh the http and https server
const unifiedServer = function(req,res){

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

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8')
  let buffer = ''
  req.on('data', function(data){
    buffer += decoder.write(data)
  })
  req.on('end', function(){
    buffer += decoder.end()

    // Choose thhe handler this request should go to
    // If one is not found, use the notFound handler
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound

    // Construct the data object to send to the handler
    const data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }

    // Route the request to the handler specified in the router
    chosenHandler(data,function(statusCode,payload){

      // Use the status code called back the handler, or set the default status code to 200
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200

      // Use the payload returned from the handler, or set the default payload to an empty object
      payload = typeof(payload) === 'object' ? payload : {}

      // Convert the payload object to string
      const payloadString = JSON.stringify(payload)

      // Return the response
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode)
      res.end(payloadString)

      // Log the request path
      console.log('Returning this response: ', statusCode, payloadString)
    })
  })
}

// Define a request router
const router = {
  'ping': handlers.ping,
  'users': handlers.users
}