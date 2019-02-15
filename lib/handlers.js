/*
 * Request handlers
 */

// Dependencies
const _data = require('./data')
const helpers = require('./helpers')

// Define the handlers
let handlers = {}

// Users
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  acceptableMethods.indexOf(data.method) > -1
  ? handlers._users[data.method](data, callback)
  : callback(405)
}

// Container for the users submethods
handlers._users = {}

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0
  ? data.payload.firstName.trim()
  : false

  const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0
  ? data.payload.lastName.trim()
  : false

  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 8
  ? data.payload.phone.trim()
  : false

  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0
  ? data.payload.password.trim()
  : false

  const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true
  ? true
  : false

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user dosen't already exist
    _data.read('users', phone, (err, data) => {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password)

        // Create the user object
        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            'tosAgreement': true
          }
  
          // Store the user
          _data.create('users', phone, userObject, (err) => {
            if (!err) {
              callback(200)
            } else {
              console.log(err)
              callback(500, { 'Error': 'Could not create the new user' })
            }
          })
        } else {
          callback(500, { 'Error': 'Could not hash the user\'s password' })
        }
      } else {
        callback(400, { 'Error': 'A user with that phone number already exists' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required fields' })
  }
}

// Users - get
// Required data: phone
// Optional data: none
// @TODO: Only let an authenticated user access their object. Don't let them access anyone elses.
handlers._users.get = (data, callback) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 8 ? data.queryStringObject.phone.trim() : false
  if (phone) {
    // Lookup the user
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        // Remove the hashed password from the user user object before returning it to the requester
        delete data.hashedPassword
        callback(200, data)
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
}

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO: Only let an authenticated user up their object. Dont let them access update elses.
handlers._users.put = (data, callback) => {
  // Check for the required field
  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 8 ? data.payload.phone.trim() : false

  // Check for the option fields
  const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  // Error if the phone is invalid
  if (phone) {
    // Error if noting is sent to update
    if (firstName || lastName || password) {
      // Lookup the user
      _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
          // Update the fields necessary
          if (firstName) {
            userData.firstName = firstName
          }
          if (lastName) {
            userData.lastName = lastName
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password)
          }
          // Store the new update
          _data.update('users', phone, userData, (err) => {
            if (!err) {
              callback(200)
            } else {
              console.log(err)
              callback(500, { 'Error': 'Could not update the user' })
            }
          })
        } else {
          callback(400, { 'Error': 'The specified user dose not exist' })
        }
      })
    } else {
      callback(400, { 'Error': 'Missing fields to update' })
    }
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
}

// Users - delete
// Required data: phone
// @TODO: Only let an authenticated user delete their object. Dont let them delete update elses.
// @TODO: Cleanup (delete) any other data files associated with the user
handlers._users.delete = (data, callback) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 8 ? data.queryStringObject.phone.trim() : false
  if (phone) {
    // Lookup the user
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        _data.delete('users', phone, (err) => {
          !err ? callback(200) : callback(500, { 'Error': 'Could not delete the specified user' })
        })
      } else {
        callback(400, { 'Error': 'Could not find the specified user' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
}

// Tokens
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  acceptableMethods.indexOf(data.method) > -1
  ? handlers._tokens[data.method](data, callback)
  : callback(405)
}

// Container for all the tokens methods
handlers._tokens = {}

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 8 ? data.payload.phone.trim() : false
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  if (phone && password) {
    // Lookup the user who matches that phone number
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // Hash the sent password, and compare the password stored in the user object
        const hashedPassword = helpers.hash(password)
        if (hashedPassword === userData.hashedPassword) {
          // If valid, create a new token with a random name of length 20
          const tokenId = helpers.createRandomString(20)
          // Set an expiration date 1 hour in the future
          const expires = Date.now() + 1000 * 60 * 60

          const tokenObject = {
            phone,
            'id': tokenId,
            expires
          }

          // Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject)
            } else {
              callback(500, { 'Error': 'Could not create the new token' })
            }
          })
        } else {
          callback(400, { 'Error': 'Phone and password is not valid'})
        }
      } else {
        callback(400, { 'Error': 'Could not find the specified user' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field(s)' })
  }
}

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = (data, callback) => {
  // Check if the id is valid
  const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false
  if (id) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      !err && tokenData ? callback(200, tokenData) : callback(404)    
    })
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
}

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = (data, callback) => {
  const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false
  const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false

  if (id && extend) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Make sure the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60
          // Store the new updates
          _data.update('tokens', id, tokenData, (err) => {
            !err ? callback(200) : callback(500, { 'Error' : 'Could not update the token\'s expiration.' })
          })
        } else {
          callback(400, { 'Error' : 'The token has already expired, and cannot be extended.' })
        }
      } else {
        callback(400, { 'Error' : 'Specified token does not exist' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required fields(s) or field(s) are invalid' })
  }
}

// Tokens - delete
handlers._tokens.delete = (data, callback) => {
  
}

// Ping handler
handlers.ping = (data, callback) => {
  callback(200)
}

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404)
}

// Export the module
module.exports = handlers
