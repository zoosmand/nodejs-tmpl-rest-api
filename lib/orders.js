/**
 * Order handlers.
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
var orders = {};





/**
 * Users. Handles API method "orders".
 * @param {object} data HTTP data object.
 * @param {Function} callback The function runs after data is checked when all checks are passed.
 */
orders.handlers = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    orders._handlers[data.method](data, callback);
  } else {
    callback(405);
  }
};



// tokens.verifyToken(token, function(uid){
//   if(uid){
//     //
//   } else {
//     callback(400, { 'Error': 'Given token is incorrect or has expired' });
//   }
// });



/**
 * Container for the users methods
*/
orders._handlers = {};

/**
 * Creates a record of a new order in the database. Order is available for an hour.
 * API method - "users". HTTP method - POST.
 * @param {object} data HTTP data object.
 * Required data: firstName, lastName, phone, password, tosAgreement.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
orders._handlers.post = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;

  tokens.verifyToken(token, function(uid){
    if(uid){

      // The new order lives 1 hour
      let expiredAt = Date.now() + 1000 * 60 * 60;

      // SQL request
      let sqlRequest = format(`
        SELECT
          COUNT(o.'uid') AS orderCount
        FROM orders AS o
        INNER JOIN users AS u 
          ON u.uid = o.user
        WHERE 
          u.uid = '%s'
        AND
          o.paid = 0
        AND
          o.expired_at < '%s'
        `, uid, expiredAt);

        _db.get(sqlRequest, (err, data) => {
        if (!err && data) {
          if (data.orderCount < 5) {
            let orderId = helpers.createRandomArbitraryNumber(100001, 999999);

            // SQL request
            sqlRequest = format(`
              INSERT INTO orders (
                'user',
                'order',
                'expired_at'
              ) VALUES (
                '%s',
                '%s',
                '%s'
              )
            `, uid, orderId, expiredAt);
      
            // Store the user into database
            _db.execute(sqlRequest, err => {
              if (!err) {
                callback(200);
              } else {
                console.log(err);
                callback(500, { 'Error': 'Could not create the new order', 'Details': err });
              }
            });
      
          } else {
            callback(400, { 'Error': 'A user cannot have more 5 unpaid or expired ordes' }); 
          }
        } else {
          callback(400, { 'Error': 'An order does not exist', 'Details': err });
        }
      });

    } else {
      callback(400, { 'Error': 'Given token is incorrect or has expired' });
    }
  });


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
orders._handlers.get = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;

  tokens.verifyToken(token, function(uid){
    if(uid){
      // SQL request
      let sqlRequest = format(`
      SELECT
        o.'uid',
        o.'order',
        o.paid,
        o.expired_at
      FROM orders AS o
      INNER JOIN users AS u 
        ON u.uid = o.user
      WHERE 
        u.uid = '%s'
      `, uid);

      // Get order ID from the query string. If it is, correct the SQL request 
      var orderId = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 6 ? data.queryStringObject.id.trim() : false;
      if (orderId) {
        sqlRequest += format(" AND o.'order' = '%s'", orderId);
      }
  
      _db.all(sqlRequest, (err, data) => {
        if (!err && data) {
          callback(200, data);
        } else {
          callback(400, { 'Error': 'An order does not exist', 'Details': err });
        }
      });
    } else {
      callback(400, { 'Error': 'Given token is incorrect or has expired' });
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
orders._handlers.put = (data, callback) => {
  // Check fot the rquired field
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // Check for the optional fields
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let address = typeof (data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;



  // Update none-unique fields
  tokens.verifyToken(token, function(uid){
    if (uid && (firstName || lastName || password || address)) {
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
        address,
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
          address = address ? address : data.address;
          hashedPassword = password ? hashedPassword : data.password;
          
          // SQL request - update user in the database
          sqlRequest = format(`
          UPDATE users SET
            first_name = '%s',
            last_name = '%s',
            address = '%s',
            password = '%s'
          WHERE 
            uid = '%s'
          `, firstName, lastName, address, hashedPassword, uid);

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
      callback(403, { 'Error': 'Given token is incorrect or has expired, or missing required filed(s)' });
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
orders._handlers.delete = (data, callback) => {
  // Check the phone number is valid
  // let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;

  tokens.verifyToken(token, function(uid){
    if (uid) {
      // SQL request - get the user from the database
      let sqlRequest = format(`
      SELECT
        email,
        phone
      FROM users
      WHERE 
        uid = '%s'
      AND
        deleted = 0
      `, uid);

      _db.get(sqlRequest, (err, data) => {
        if (!err && data) {

          let prefix = helpers.createRandomArbitraryNumber(100001, 999999);
          // SQL request
          sqlRequest = format(`
          UPDATE users SET
            email = '%s',
            phone = '%s',
            deleted = 1
          WHERE 
            uid = '%s'
          `, format('%d%s', prefix, data.email), format('%d%d', prefix, data.phone), uid);

          _db.execute(sqlRequest, err => {
            if (!err) {
            sqlRequest = format(`
              UPDATE tokens SET
                deleted = 1
              WHERE 
                user = '%s'
              AND
                deleted = '0'
              `, uid);
    
              _db.execute(sqlRequest, err => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { 'Error': 'Could not delete old token(s)', 'Details': err });
                }
              });
            } else {
              callback(500, { 'Error': 'Could not delete the specified user', 'Details': err });
            }
          });
        } else {
          callback(400, { 'Error': 'Could not find the user', 'Details': err });
        }
      });
    } else {
      callback(400, { 'Error': 'Given token is incorrect or has expired' });
    }
  });
};




/** 
 * Export the module
 */
export default orders;
