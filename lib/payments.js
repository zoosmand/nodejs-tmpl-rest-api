/**
 * Payments handlers.
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
let payments = {};


/**
 * Users. Handles API method "payments".
 * @param {object} data HTTP data object.
 * @param {Function} callback The function runs after data is checked when all checks are passed.
 */
payments.handlers = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    payments._handlers[data.method](data, callback);
  } else {
    callback(405);
  }
};


/**
 * Container for the payments methods
*/
payments._handlers = {};


/**
 * Creates a record of a new payment in the database. The payment is available for an hour.
 * API method - "payments". HTTP method - POST.
 * @param {object} data HTTP data object.
 * Required data: none.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
payments._handlers.post = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;
  let orderId = typeof(data.payload.orderId) == 'number' && data.payload.orderId >= 100000 && data.payload.orderId <= 999999 ? data.payload.orderId : false;

  if (!orderId) {
    callback(400, { 'Error': 'Missing required fields' });
    return;
  }

  tokens.verifyToken(token, function(userUid){
    if (userUid) {
      // code begins
      callback(403, { 'Error': 'Then Xero' });

    } else {
      callback(400, { 'Error': 'Given token is incorrect or has expired' });
    }
  });
};


/**
 * Retrieves records with payments data from the database.
 * API method - "payments". HTTP method - GET.
 * Only let an authenticated user access their object. Don't let them access anyone elses.
 * @param {object} data HTTP data object.
 * Required data: none.
 * Optional data: orderId.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
payments._handlers.get = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;
  let paymentId = typeof(data.queryStringObject.paymentId) == 'string' && data.queryStringObject.paymentId.trim().length == 6 ? data.queryStringObject.paymentId.trim() : false;

  tokens.verifyToken(token, function(userUid){
    if(userUid){
      // code begins
      callback(403);

    } else {
      callback(400, { 'Error': 'Given token is incorrect or has expired' });
    }
  });
};


/**
 * Changes/updates records of payment data in the database.
 * API method - "payments". HTTP method - PUT.
 * Only let an authenticated user access their object. Don't let them update anyone elses.
 * @param {object} data HTTP data object.
 * Required data: paymentId.
 * Optional data: .
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
payments._handlers.put = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;

  tokens.verifyToken(token, function(userUid){
    if(userUid){
      // code begins
      callback(403);

    } else {
      callback(400, { 'Error': 'Given token is incorrect or has expired' });
    }
  });
};


/**
 * Deletes/hides records of an payment from/in the database.
 * API method - "users". HTTP method - DELETE.
 * Only let an authenticated user access their object. Don't let them access anyone elses.
 * @param {object} data HTTP data object.
 * Required data: none.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
payments._handlers.delete = (data, callback) => {
  // Check the phone number is valid
  // let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;
  let paymentId = typeof(data.queryStringObject.paymentId) == 'string' && data.queryStringObject.paymentId.trim().length == 6 ? data.queryStringObject.paymentId.trim() : false;

  tokens.verifyToken(token, function(userUid){
    if(userUid){
      // code begins
      callback(403);

    } else {
      callback(400, { 'Error': 'Given token is incorrect or has expired' });
    }
  });
};



/** 
 * Export the module
 */
export default payments;
