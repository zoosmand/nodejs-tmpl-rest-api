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
 * Container for the Stripe customer related methods
*/
payments._customerHandlers = {};


/**
 * Creates a record of a new payment in the database. When an order is ready to be paid, the dedicated payment is available for an hour.
 * API method - "orders/payments". HTTP method - POST.
 * @param {object} data HTTP data object.
 * Required data: @mode {enum} ['createCustomer', 'payOrder'].
 * Optional data: none.
 * @param {function} callback The function runs after data is checked when all checks are passed.
 */
payments._handlers.post = (data, callback) => {
  // Get authorization token
  let token = typeof (data.headers.authorization) == 'string' ? data.headers.authorization : false;
  let orderId = typeof(data.payload.orderId) == 'number' && data.payload.orderId >= 100000 && data.payload.orderId <= 999999 ? data.payload.orderId : false;
  let mode = typeof (data.payload.mode) == 'string' ? data.payload.mode : false;

  // if (!orderId) {
  //   callback(400, { 'Error': 'Missing required fields' });
  //   return;
  // }

  tokens.verifyToken(token, (userUid) => {
    if (userUid) {
      // code begins
      if (!mode) {
        callback(400, { 'Error': 'Missing required fields', 'Details': { 'Require field': 'mode' } });
        return;
      }
      let _data = {
        userUid,
        orderId,
      }

      let _customerHandlersModes = ['createCustomer', 'payOrder'];
      if (_customerHandlersModes.indexOf(mode) > -1) {
        let result = payments._customerHandlers[mode](_data);
        if (result.status) {
          callback(200, {'Details': result.message});
        } else {
          callback(500, {'Error': 'An error occurs during payment mode handling', 'Details': result.message});
        }
      } else {
        callback(500, {'Error': 'Given payment mode is incorrect'});
      }

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
 * @param {function} callback The function runs after data is checked when all checks are passed.
 */
payments._handlers.get = (data, callback) => {
  // Get authorization token
  let token = typeof (data.headers.authorization) == 'string' ? data.headers.authorization : false;
  let paymentId = typeof (data.queryStringObject.paymentId) == 'string' && data.queryStringObject.paymentId.trim().length == 6 ? data.queryStringObject.paymentId.trim() : false;

  tokens.verifyToken(token, (userUid) => {
    if (userUid) {
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
 * @param {function} callback The function runs after data is checked when all checks are passed.
 */
payments._handlers.put = (data, callback) => {
  // Get authorization token
  let token = typeof (data.headers.authorization) == 'string' ? data.headers.authorization : false;

  tokens.verifyToken(token, (userUid) => {
    if (userUid) {
      // code begins
      callback(403);

    } else {
      callback(400, { 'Error': 'Given token is incorrect or has expired' });
    }
  });
};


/**
 * Deletes/hides records of an payment from/in the database.
 * API method - "payments". HTTP method - DELETE.
 * Only let an authenticated user access their object. Don't let them access anyone elses.
 * @param {object} data HTTP data object.
 * Required data: none.
 * Optional data: none.
 * @param {function} callback The function runs after data is checked when all checks are passed.
 */
payments._handlers.delete = (data, callback) => {
  // Check the phone number is valid
  // let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  let token = typeof (data.headers.authorization) == 'string' ? data.headers.authorization : false;
  let paymentId = typeof (data.queryStringObject.paymentId) == 'string' && data.queryStringObject.paymentId.trim().length == 6 ? data.queryStringObject.paymentId.trim() : false;

  tokens.verifyToken(token, (userUid) => {
    if (userUid) {
      // code begins
      callback(403);

    } else {
      callback(400, { 'Error': 'Given token is incorrect or has expired' });
    }
  });
};




// --------------------------------------------------------------------------


/**
 * Creates a customer in the Stripe portal if it does not already exist.
 * @param {object} data Unified data object.
 * Required data: {number} @userUid User database table related unique id.
 * Optional data: {number} @orderUid Order database table related unique id.
 * @param {function} callback The function runs after data is checked when all checks are passed.
 * @return {object} @status Status of the Strip portal operation, @message Dedicated text message. 
 */
payments._customerHandlers.createCustomer = (data, callback) => {
  if (data.userUid) {
    return {status: data.userUid, message: '!!!'};
  }
  
  return {status: false, message: 'NO user UID'};
};


/**
 * Sends a payment request to the Stripe portal to process payment for a given order.
 * @param {object} data Unified data object.
 * Required data: {number} userUid User database table related unique id.
 * Required data: {number} orderUid Order database table related unique id.
 * Optional data: none.
 * @param {function} callback The function runs after data is checked when all checks are passed.
 * @return {object} @status Status of the Strip portal operation, @message Dedicated text message. 
 */
payments._customerHandlers.payOrder = (data, callback) => {
  if (data.orderId) {
    return {status: data.orderId, message: '!!!'};
  }
  
  return {status: false, message: 'NO order ID'};
};




/** 
 * Export the module
 */
export default payments;
