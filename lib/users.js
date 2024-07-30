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
import tokens from './tokens.js';


/**
 * Define the handlers.
 */
var users = {};





/**
 * Users. Handles API method "users".
 * @param {object} data HTTP data object.
 * @param {Function} callback The function runs after data is checked when all checks are passed.
 */
users.handlers = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    users._handlers[data.method](data, callback);
  } else {
    callback(405);
  }
};




/**
 * Container for the users methods
*/
users._handlers = {};

/**
 * Creates a record of a new user in the database.
 * API method - "users". HTTP method - POST.
 * @param {object} data HTTP data object.
 * Required data: firstName, lastName, phone, password, tosAgreement.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
users._handlers.post = (data, callback) => {
  // Check that all required fields are filled out
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  let email = typeof (data.payload.email) == 'string' && data.payload.email.trim().indexOf("@") > -1 && data.payload.email.trim().indexOf(".") > -1 ? data.payload.email.trim() : false;
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
  
  if (firstName && lastName && phone && email) {
    // SQL request
    let sqlRequest = format(`
      INSERT INTO users (
        'phone',
        'email',
        'first_name',
        'last_name',
        'password',
        'tos_agreement'
      ) VALUES (
        '%s',
        '%s',
        '%s',
        '%s',
        '%s',
        '%s'
      )
    `, phone, email, firstName, lastName, hashedPassword, (tosAgreement ? 1 : 0));

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
users._handlers.get = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;

  tokens.verifyToken(token, function(uid){
    if(uid){
      // SQL request
      let sqlRequest = format(`
      SELECT
        uid,
        email,
        phone,
        first_name AS firstName,
        last_name AS lastName
      FROM users
      WHERE 
        uid = '%s'
      AND
        deleted = 0
      `, uid);

      _db.get(sqlRequest, (err, data) => {
        if (!err && data) {
          callback(200, data);
        } else {
          callback(400, { 'Error': 'A user does not exist', 'Details': err });
        }
      });
    } else {
      callback(400, { 'Error': 'Incorrect data received' });
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
users._handlers.put = (data, callback) => {
  // Check fot the rquired field
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // Check for the optional fields
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;



  // Update none-unique fields
  tokens.verifyToken(token, function(uid){
    if (uid && (firstName || lastName || password)) {
      // SQL request - get the user from the database
      let sqlRequest = '';
      let hashedPassword = '';
      
      // Remove token)s) if password changed
      if (password) {

        // Hash the password
        hashedPassword = helpers.hash(password);
        if (!hashedPassword) {
          callback(500, { 'Error': 'Could not hash the user\'s password' });
          return;
        }
        sqlRequest = format(`
        UPDATE tokens SET
          deleted = '1'
        WHERE 
          user = '%s'
        AND deleted = '0'
        `, uid);

        _db.execute(sqlRequest, (err) => {
          if (err) {
            callback(500, { 'Error': 'Could not delete old token(s)', 'Details': err });
          }
        });
      }

      sqlRequest = format(`
      SELECT
        first_name,
        last_name,
        password
      FROM users
      WHERE 
        uid = '%s'
      AND
        deleted = 0
      `, uid);

      _db.get(sqlRequest, (err, data) => {
        if (!err && data) {
          firstName = firstName ? firstName : data.first_name;
          lastName = lastName ? lastName : data.last_name;
          hashedPassword = password ? hashedPassword : data.password;
          
          // SQL request - update user in the database
          sqlRequest = format(`
          UPDATE users SET
            first_name = '%s',
            last_name = '%s',
            password = '%s'
          WHERE 
            uid = '%s'
          `, firstName, lastName, hashedPassword, uid);

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
      callback(403, { 'Error': 'Missing required fields' });
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
users._handlers.delete = (data, callback) => {
  // Check the phone number is valid
  let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

  tokens.verifyToken(token, phone, function(tokenIsValid){
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




/** 
 * Export the module
 */
export default users;
