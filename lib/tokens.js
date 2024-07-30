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
var tokens = {};







/* ************************************************************************************************************* */
/* *******************************************         TOKENS         ****************************************** */
/* ************************************************************************************************************* */

/**
 * Tokens. Handles API method "tokens".
 * @param {object} data HTTP data object.
 * @param {functiion} callback @param {*} callback The function runs after data is checked when all checks are passed.
 */
tokens.handlers = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    tokens._handlers[data.method](data, callback);
  } else {
    callback(405);
  }
};




/**
 * Container for all the tokens methods
 */
tokens._handlers = {};

/**
 * Creates a new record with a user token in the database.
 * API method - "tokens". HTTP method - POST.
 * @param {object} data HTTP data object.
 * Required data: phone, password.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
tokens._handlers.post = (data, callback) => {
  let email = typeof (data.payload.email) == 'string' && data.payload.email.trim().indexOf("@") > -1 && data.payload.email.trim().indexOf(".") > -1 ? data.payload.email.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  
  // Hash the password
  let hashedPassword = helpers.hash(password);
  if (!hashedPassword) {
    callback(500, { 'Error': 'Could not hash the user\'s password' });
    return;
  }
  
  if (email) {
    // Lookup the user matches that phone number
    let sqlRequest = format(`
    SELECT
      uid
    FROM users
    WHERE 
      email = '%s'
    AND
      password = '%s'
    AND
      deleted = 0
    `, email, hashedPassword);

    _db.get(sqlRequest, (err, data) => {
      if (!err && data) {
        let token = helpers.createRandomString(20);

        if (!token) {
          callback(500, { 'Error': 'Could not generate the token for the specifued user' });
          return;
        }
        sqlRequest = format(`
        UPDATE tokens SET
          deleted = '1'
        WHERE 
          user = '%s'
        AND deleted = '0'
        `, data.uid);

        _db.execute(sqlRequest, (err) => {
          if (!err) {
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
            callback(500, { 'Error': 'Could not delete the old token', 'Details': err });
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
tokens._handlers.get = (data, callback) => {
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
tokens._handlers.put = (data, callback) => {
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
tokens._handlers.delete = (data, callback) => {
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
 * @param {string} token Authorizatiion token.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
tokens.verifyToken = (token, callback) => {
  //Lookup the token
  let sqlRequest = format(`
  SELECT
    u.uid AS user_uid,
    t.uid AS token_uid
  FROM users AS u
    INNER JOIN tokens AS t ON t.user = u.uid
  WHERE 
    t.token = '%s'
  AND
    u.deleted = 0
  AND
    t.deleted = 0
  AND
    t.expired_at > %s
  `, token, Date.now());

  _db.get(sqlRequest, (err, data) => {
    if (!err && data) {
      callback(data.user_uid);
    } else {
      callback(false);
    }
  });
};




/** 
 * Export the module
 */
export default tokens;
