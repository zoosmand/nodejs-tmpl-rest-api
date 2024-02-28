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
    // SQL request
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
    _db.execute(sqlRequest, err => {
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
  let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

  handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
    if(tokenIsValid && phone){
      // SQL request
      let sqlRequest = format(`
      SELECT
        uid,
        phone,
        first_name AS firstName,
        last_name AS lastName
      FROM users
      WHERE 
        phone = '%s'
      AND
        deleted = 0
      `, phone);

      _db.get(sqlRequest, (err, data) => {
        if (!err && data) {
          callback(200, data);
        } else {
          callback(400, { 'Error': 'A user with that phone number does not exist', 'Details': err });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing required fields' });
    }
  });
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
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;


  // Hash the password
  let hashedPassword = helpers.hash(password);
  if (!hashedPassword) {
    callback(500, { 'Error': 'Could not hash the user\'s password' });
    return;
  }

  // Error if the phone is valid
  handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
    if (tokenIsValid && phone) {
      // SQL request - get the user from the database
      let sqlRequest = format(`
      SELECT
        uid
      FROM users
      WHERE 
        phone = '%s'
      AND
        deleted = 0
      `, phone);

      _db.get(sqlRequest, (err, data) => {
        if (!err && data) {
          // SQL request - update user in the database
          sqlRequest = format(`
          UPDATE users SET
            first_name = '%s',
            last_name = '%s',
            password = '%s'
          WHERE 
            uid = '%s'
          `, firstName, lastName, hashedPassword, data.uid);

          _db.execute(sqlRequest, err => {
            if (!err) {
              callback(200);
      
            } else {
              console.log(err);
              callback(500, { 'Error': 'Could not update the user', 'Details': err });
            }
          });
        } else {
          callback(400, { 'Error': 'Could not find the user', 'Details': err });
        }
      });
    } else {
      callback(403, { 'Error': 'Missing required fields' })
    }
  });
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
  let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

  handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
    if (tokenIsValid && phone) {
      // SQL request - get the user from the database
      let sqlRequest = format(`
      SELECT
        uid
      FROM users
      WHERE 
        phone = '%s'
      AND
        deleted = 0
      `, phone);

      _db.get(sqlRequest, (err, data) => {
        if (!err && data) {

          // SQL request
          let sqlRequest = format(`
          UPDATE users SET
            phone = '%s',
            deleted = 1
          WHERE 
            uid = '%s'
          `, format('%d%d', helpers.createRandomArbitraryNumber(100001, 999999), phone), data.uid);

          _db.execute(sqlRequest, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { 'Error': 'Could not delete the specified user', 'Details': err });
            }
          });
        } else {
          callback(400, { 'Error': 'Could not find the user', 'Details': err });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing required fields' });
    }
  });
};





/* ************************************************************************************************************* */
/* *******************************************         TOKENS         ****************************************** */
/* ************************************************************************************************************* */

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
  
  // Hash the password
  let hashedPassword = helpers.hash(password);
  if (!hashedPassword) {
    callback(500, { 'Error': 'Could not hash the user\'s password' });
    return;
  }
  
  if (phone) {
    // Lookup the user matches that phone number
    let sqlRequest = format(`
    SELECT
      uid
    FROM users
    WHERE 
      phone = '%s'
    AND
      password = '%s'
    AND
      deleted = 0
    `, phone, hashedPassword);

    _db.get(sqlRequest, (err, data) => {
      if (!err && data) {
        let token = helpers.createRandomString(20);

        if (!token) {
          callback(500, { 'Error': 'Could not generate the token for the specifued user' });
          return;
        }
        sqlRequest = format(`
        INSERT INTO tokens (
          'user',
          'token',
          'expired_at'
        ) VALUES (
          '%s',
          '%s',
          '%s'
        )
        `, data.uid, token, Date.now() + 1000 * 60 * 60);
  
        _db.execute(sqlRequest, err => {
          if (!err) {
            callback(200, { 'token': token });
          } else {
            callback(500, { 'Error': 'Could not create token for the specified user', 'Details': err });
          }
        });

      } else {
        callback(400, { 'Error': 'Could not find the user'});
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
  let token = typeof (data.queryStringObject.token) == 'string' && data.queryStringObject.token.trim().length == 20 ? data.queryStringObject.token.trim() : false;
  if (token) {
    // Lookup the token
    let sqlRequest = format(`
    SELECT
      uid,
      token,
      expired_at
    FROM tokens
    WHERE 
      token = '%s'
    AND
      deleted = 0
    `, token);

    _db.get(sqlRequest, (err, data) => {
      if (!err && data) {
        callback(200, { 'token': token, 'expired': data.expired_at }); 
      } else {
        callback(400, { 'Details': (err) ? err : 'The token is incorrect or does not exist' });
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
  let token = typeof (data.payload.token) == 'string' && data.payload.token.trim().length == 20 ? data.payload.token.trim() : false;
  let extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

  if (token && extend) {
    // lookup the token
    let sqlRequest = format(`
    SELECT
      uid,
      expired_at
    FROM tokens
    WHERE 
      token = '%s'
    AND
      deleted = 0
    `, token);

    _db.get(sqlRequest, (err, data) => {
      if (!err && data && (data.expired_at > Date.now())) {
        sqlRequest = format(`
        UPDATE tokens SET
          expired_at = '%s'
        WHERE 
          uid = '%s'
        `, Date.now() + 1000 * 60 * 60, data.uid);

        _db.execute(sqlRequest, (err) => {
          if (!err) {
            callback(200); 
          } else {
            callback(500, { 'Error': 'Could not update the token\'s expiration', 'Details': err });
          }
        });
      } else {
        callback(400, { 'Error': 'The token has already expired, and cannot be extended' });
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
  let token = typeof (data.queryStringObject.token) == 'string' && data.queryStringObject.token.trim().length == 20 ? data.queryStringObject.token.trim() : false;
  if (token) {
    // Lookup the token
    let sqlRequest = format(`
    SELECT
      uid
    FROM tokens
    WHERE 
      token = '%s'
    AND
      deleted = 0
    `, token);

    _db.get(sqlRequest, (err, data) => {
      if (!err && data) {
        sqlRequest = format(`
        UPDATE tokens SET
          deleted = '1'
        WHERE 
          uid = '%s'
        `, data.uid);

        _db.execute(sqlRequest, (err) => {
          if (!err) {
            callback(200); 
          } else {
            callback(500, { 'Error': 'Could not delete the token', 'Details': err });
          }
        });
      } else {
        callback(400, { 'Error': 'The token does not exist', 'Details': (err) ? err : 'Possibly invalid token' });
      }
    });

  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
};


/**
 * Verifies if a given token id is currently valid for a given user.
 * @param {string} token Token ID.
 * @param {string} phone Phone Number (as it is a unique identificator). 
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
handlers._tokens.verifyToken = (token, phone, callback) => {
  //Lookup the token
  let sqlRequest = format(`
  SELECT
    u.uid AS user_uid,
    t.uid AS token_uid,
    u.phone,
    t.expired_at
  FROM users AS u
    INNER JOIN tokens AS t ON t.user = u.uid
  WHERE 
    t.token = '%s'
  AND
    u.phone = '%s'
  AND
    u.deleted = 0
  AND
    t.deleted = 0
  `, token, phone);

  _db.get(sqlRequest, (err, data) => {
    if (!err && data) {
      if (data.phone == phone && data.expired_at > Date.now()) {
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
