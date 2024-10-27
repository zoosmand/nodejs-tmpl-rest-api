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
import config from './config.js';
import * as https from 'https';
import * as querystring from 'querystring';
import { log } from 'console';


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
 * Container for the Payment Provider customer related methods
*/
payments._customerHandlers = {};


/**
 * Creates a record of a new payment in the database. When an order is ready to be paid, the dedicated payment is available for an hour.
 * API method - "orders/payments". HTTP method - POST.
 * @param {object} data HTTP data object.
 * Required data: @mode {enum} ['getCustomerId', 'payOrder'].
 * Optional data: none.
 * @param {function} callback The function runs after data is checked when all checks are passed.
 */
payments._handlers.post = (data, callback) => {
  // Get authorization token
  let token = typeof (data.headers.authorization) == 'string' ? data.headers.authorization : false;
  let orderId = typeof (data.payload.orderId) == 'number' && data.payload.orderId >= 100000 && data.payload.orderId <= 999999 ? data.payload.orderId : false;
  let mode = typeof (data.payload.mode) == 'string' ? data.payload.mode : false;

  // verify token and retrieve user unique ID
  tokens.verifyToken(token, userUid => {
    if (userUid) {
      // code begins
      if (!mode) {
        callback(400, { 'Error': 'Missing required fields', 'Details': { 'Require field': 'mode' } });
        return;
      }
      // collect necessary data for handling Payment Provider payments
      let _data = {
        userUid,
        orderId,
      }
      // enumerate payments mode
      let _customerHandlersModes = ['getCustomerId', 'payOrder'];
      // handle Payment Provider payment
      if (_customerHandlersModes.indexOf(mode) > -1) {
        payments._customerHandlers[mode](_data, callback);
      } else {
        callback(500, { 'Error': 'Given payment mode is incorrect' });
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

  tokens.verifyToken(token, userUid => {
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

  tokens.verifyToken(token, userUid => {
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

  tokens.verifyToken(token, userUid => {
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
 * Creates a customer in the Payment Provider portal if it does not already exist.
 * @param {object} data Unified data object.
 * Required data: {number} @userUid User database table related unique id.
 * Optional data: {number} @orderUid Order database table related unique id.
 * @param {function} callback The function runs after data is checked when all checks are passed.
 */
payments._customerHandlers.getCustomerId = (data, callback) => {
  if (data.userUid) {
    // code begins
    // check if the user has the Strip ID
    let sqlRequest = format(`
        SELECT
          email,
          first_name AS firstName,
          last_name AS lastName,
          address,
          phone,
          payment_provider_id AS paymentProviderId
        FROM users
        WHERE
          uid = %i
      `, data.userUid);

    _db.get(sqlRequest, (err, userData) => {
      if (!err) {
        if (userData.paymentProviderId) {
          // play with Payment Provider
          callback(200, { 'userPaymentProviderId': userData.paymentProviderId });
        } else {
          // create a customer on the Payment Provider portal
          let payloadData = {
            'name': format('%s %s', userData.firstName, userData.lastName),
            'email': userData.email,
            'phone': userData.phone,
          };
          let payloadDataFormatted = querystring.stringify(payloadData);

          // @TODO Separate static request details into the config module.
          let requestDetails = {
            'protocol': 'https:',
            'hostname': config.paymentProviderDomain,
            'method': 'POST',
            'path': '/v1/customers',
            'auth': format('%s:', config.paymentProviderSecretKey),
            'headers': {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(payloadDataFormatted)
            }
          };

          let req = https.request(requestDetails, res => {
            let status = res.statusCode;
            let buffer = '';

            if (status == 200 || status == 201) {
              res.on('data', chunk => {
                buffer += chunk;
              });
              res.on('end', () => {
                // log(buffer);

                let customerData = JSON.parse(buffer);
                if (customerData.id) {
                  
                  // @TODO Separate the block into an independent handler.
                  // --- begin ---
                  // update customer data by saving the customer ID into the database
                  let sqlRequest = format(`
                      UPDATE users SET
                        payment_provider_id = '%s'
                      WHERE
                        uid = %i
                    `, customerData.id, data.userUid);
            
                  _db.execute(sqlRequest, err => {
                    if (!err) {
                      // the end of the handler
                      callback(200, { 'userPaymentProviderId': customerData.id });
                    } else {
                      callback(400, { 'Error': 'Could not update specific user\'s data', 'Details': err });
                    }
                  });
                  // --- end ---

                } else {
                  callback(400, { 'Error': 'Could not retreive specific user\'s data' });
                }
              });
              res.on('error', e => {
                callback(400, { 'Error': 'Could not retreive specific user\'s data', 'Details': e });
              });
            } else {
              res.on('data', chunk => {
                buffer += chunk;
              });
              res.on('end', () => {
                callback(500, { 'Error': 'An exception occurred while trying to process the transaction with the payment provider', 'Details': JSON.parse(buffer) });
              });
              res.on('error', e => {
                callback(500, { 'Error': 'An exception occurred during the transaction with the payment provider', 'Details': e });
              });
            }
          });

          // --- sending data to the payment provider --- 
          req.on('error', e => {
            callback(500, { 'Error': 'An exception occurred at the beginning of the transaction with the payment provider', 'Details': e });
          });
          req.write(payloadDataFormatted);
          req.end();

        }
      } else {
        log(err);
        callback(500, { 'Error': 'Could not retreive user\'s data', 'Details': err });
      }
    });

  } else {
    callback(400, { 'message': 'Cannot create customer', 'Details': '<Something from PaymentProvider>' });
  }
};


/**
 * Sends a payment request to the Payment Provider portal to process payment for a given order.
 * @param {object} data Unified data object.
 * Required data: {number} userUid User database table related unique id.
 * Required data: {number} orderUid Order database table related unique id.
 * Optional data: none.
 * @param {function} callback The function runs after data is checked when all checks are passed.
 */
payments._customerHandlers.payOrder = (data, callback) => {
  if (data.orderId) {
    // code begins
    callback(200, { 'message': format('!!! %i', data.orderId) });
  } else {
    callback(400, { 'Error': 'Missing required fields', 'Details': { 'Require field': 'orderId' } });
  }
};




/** 
 * Export the module
 */
export default payments;
