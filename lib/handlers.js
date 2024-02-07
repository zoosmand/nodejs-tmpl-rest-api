/**
 * Request handlers.
 * 
 */

/**
 * Dependencies.
 */
import _db from './db.js';
import helpers from './helpers.js';
import { format } from 'util';


/**
 * Define the handlers.
 */
var handlers = {};


/**
 * Users. Handles API method "users".
 * @param {object} data HTTP data object.
 * @param {Function} callback The function runs after data is checked when all checks are passed.
 */
handlers.users = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};


/**
 * Container for the users methods
*/
handlers._users = {};

/**
 * Creates a record of a new user in the database.
 * API method - "users". HTTP method - POST.
 * @param {object} data HTTP data object.
 * Required data: firstName, lastName, phone, password, tosAgreement.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  let tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;


  if (!tosAgreement) {
    callback(203, { 'Error': 'Terms of Service must be accepted.' });
    return;
  }

  // Hash the password
  let hashedPassword = helpers.hash(password);
  if (!hashedPassword) {
    callback(500, { 'Error': 'Could not hash the user\'s password' });
    return;
  }
  
  if (firstName && lastName && phone) {
    // SQL reuest
    let sqlRequest = format(`
      INSERT INTO users (
        'phone',
        'first_name',
        'last_name',
        'password',
        'tos_agreement'
      ) VALUES (
        '%s',
        '%s',
        '%s',
        '%s',
        '%s'
      )
    `, phone, firstName, lastName, hashedPassword, (tosAgreement ? 1 : 0));

    // Store the user into database
    _db.execcute(sqlRequest, err => {
      if (!err) {
        callback(200);
      } else {
        console.log(err);
        callback(500, { 'Error': 'Could not create the new user', 'Details': err });
      }
    });

  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
};


/**
 * Retrieves records with user data from the database.
 * API method - "users". HTTP method - GET.
 * Only let an authenticated user access their object. Don't let them access anyone elses.
 * @param {object} data HTTP data object.
 * Required data: phone.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers._users.get = (data, callback) => {
  // Check the phone number is valid
  let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // // Get the token from the headers
    // var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // // Verify that the given token is valid for the phone number
    // handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
    //   if(tokenIsValid){
    //     // Lookup the user
    //     _db.read('users', phone, function (err, data) {
    //       if (!err && data) {
    //         // Remove the hashed password from the user object before returning it to the requester
    //         delete (data.hashedPassword);
    //         callback(200, data);
    //       } else {
    //         callback(400, { 'Error': 'A user with that phone number does not exist' });
    //       }
    //     });
    //   } else {
    //     callback(403, {'Error': 'Missing required token in header, or token is invalid'});
    //   }
    // });
    _db.read('users', phone, (err, data) => {
      if (!err && data) {
        // Remove the hashed password from the user object before returning it to the requester
        // delete (data.password);
        callback(200, data);
      } else {
        callback(400, { 'Error': 'A user with that phone number does not exist' });
      }
    });

  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
};


/**
 * Changes/updates records of user data in the database.
 * API method - "users". HTTP method - PUT.
 * Only let an authenticated user access their object. Don't let them update anyone elses.
 * @param {object} data HTTP data object.
 * Required data: phone.
 * Optional data: firstName, lastName, password (at least one must be specified).
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers._users.put = (data, callback) => {
  // Check fot the rquired field
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // Check for the optional fields
  // var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  // var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  // var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  let userObject = {
    firstName: typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false,
    lastName: typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false,
    password: typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
  }

  // Error if the phone is valid
  if (phone) {
    // Error if nothing us sent to update
    // if (firstName || lastName || password) {
    // // Get the token from the headers
    // var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // // Verify that the given token is valid for the phone number
    //   handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
    //     if(tokenIsValid){
    //       // Lookup the user
    //       _db.read('users', phone, function (err, userData) {
    //         if (!err && userData) {
    //           // Update the fields necessary
    //           if (firstName) {
    //             userData.firstName = firstName;
    //           }
    //           if (lastName) {
    //             userData.lastName = lastName;
    //           }
    //           if (password) {
    //             userData.hashedPassword = helpers.hash(password);
    //           }
    //           // Store the new updates
    //           _db.update('users', phone, userData, function (err) {
    //             if (!err) {
    //               callback(200);

    //             } else {
    //               console.log(err);
    //               callback(500, { 'Error': 'Could not update the user' });
    //             }
    //           });
    //         } else {
    //           callback(400, { 'Error': 'The specifued used does not exist' });
    //         }
    //       });
    //     } else {
    //       callback(403, {'Error': 'Missing required token in header, or token is invalid'});
    //     }
    //   });

    _db.update('users', phone, userObject, err => {
      if (!err) {
        callback(200);

      } else {
        console.log(err);
        callback(500, { 'Error': 'Could not update the user', 'Details': err });
      }
    });

    // } else {
    //   callback(400, { 'Error': 'Missing fields to update' });
    // }
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
};


// @TODO Cleanup (delete) any othr data assiciated with this user 
/**
 * Deletes/hides records of a user from/in the database.
 * API method - "users". HTTP method - DELETE.
 * Only let an authenticated user access their object. Don't let them access anyone elses.
 * @param {object} data HTTP data object.
 * Required data: phone.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers._users.delete = (data, callback) => {
  // Check the phone number is valid
  let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // // Get the token from the headers
    // var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // // Verify that the given token is valid for the phone number
    // handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
    //   if(tokenIsValid){
    //     // Lookup the user
    //     _db.read('users', phone, function (err, data) {
    //       if (!err && data) {
    //         _db.delete('users', phone, function (err) {
    //           if (!err) {
    //             callback(200);
    //           } else {
    //             callback(500, { 'Error': 'Could not delete the specified user' });
    //           }

    //         });
    //       } else {
    //         callback(400, { 'Error': 'Could not find the specified user' });
    //       }
    //     });
    //   } else {
    //     callback(403, {'Error': 'Missing required token in header, or token is invalid'});
    //   }
    // });
    _db.delete('users', phone, err => {
      if (!err) {
        callback(200);
      } else {
        callback(500, { 'Error': 'Could not delete the specified user', 'Details': err });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
};



/**
 * Tokens. Handles API method "tokens".
 * @param {object} data HTTP data object.
 * @param {functiion} callback @param {*} callback The function runs after data is checked when all checks are passed.
 */
handlers.tokens = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};


/**
 * Container for all the tokens methods
 */
handlers._tokens = {};

/**
 * Creates a new record with a user token in the database.
 * API method - "tokens". HTTP method - POST.
 * @param {object} data HTTP data object.
 * Required data: phone, password.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers._tokens.post = (data, callback) => {
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    // Lookup the user matches that phone number
    _db.read('users', phone, function (err, userData) {
      if (!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user object
        let hashedPassword = helpers.hash(password);

        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a random name. Set expiration date 1 hour in the future
          let tokenId = helpers.createRandomString(20);
          let expires = Date.now() + 1000 * 60 * 60;
          let tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          };

          // Store the token
          _db.create('tokens', tokenId, tokenObject, err => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { 'Error': 'Could not create the new tokrn' });
            }
          });

        } else {
          callback(400, { 'Error': 'Password did not match the specified user\'s stored password' });
        }

      } else {
        callback(400, { 'Error': 'Could not fund the specified user' });
      }
    });

  } else {
    callback(404, { 'Error': 'Missing required field(s)' });
  }
};

/**
 * Retrieves record with user token data from the database.
 * API method - "tokens". HTTP method - GET.
 * @param {object} data HTTP data object.
 * Required data: tokenId.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers._tokens.get = (data, callback) => {
  // Check that token Id is valid
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _db.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(400);
      }
    });

  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
};

// Tokens - PUT
// Required data: id, extend
// Optional data: none
/**
 * Changes/updates records of user token data in the database. Extends user token expiry.
 * API method - "tokens". HTTP method - PUT.
 * @param {object} data HTTP data object.
 * Required data: tokenId, extend.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers._tokens.put = (data, callback) => {
  let id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  let extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

  if (id && extend) {
    // lookup the token
    _db.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check to the make sure the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the exriration
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _db.update('tokens', id, tokenData, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { 'Error': 'Could not update the token\'s expiration' });
            }
          });
        } else {
          callback(400, { 'Error': 'The token has already expired, and cannot be extended' });
        }
      } else {
        callback(400, { 'Error': 'Specified token deos not exist' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field(s) or field(s) are invalid' })
  }
};

/**
 * Deletes/hides records of a user token from/in the database.
 * API method - "tokens". HTTP method - DELETE.
 * @param {object} data HTTP data object.
 * Required data: tokenId.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers._tokens.delete = (data, callback) => {
  // Check the phone number is valid
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _db.read('tokens', id, (err, data) => {
      if (!err && data) {
        _db.delete('tokens', id, err => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { 'Error': 'Could not delete the specified token' });
          }
        });
      } else {
        callback(400, { 'Error': 'Could not fund the specified token' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
};


/**
 * Verifies if a given token id is currently valid for a given user.
 * @param {string} id Token ID.
 * @param {string} phone Phone Number (as it is a unique identificator). 
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers._tokens.verifyToken = (id, phone, callback) => {
  //Lookup the token
  _db.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};



/**
 * Checks the health status.
 * API method - "health". HTTP method - GET.
 * @param {object} data HTTP data object.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers.health = (data, callback) => {
  // Callback a HTTP status code and a payload object
  if (data.method == "GET") {
    callback(200, { 'status': 'The server is healthy', 'env': process.env.secVar });
  } else {
    callback(405);
  }
};

/**
 * Returns "Not found" response.
 * @param {object} data HTTP data object.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers.notFound = (data, callback) => {
  callback(404, { 'Error': 'The requested resource is not found' });
};


/** 
 * Export the module
 */
export default handlers;
