/**
 * Things handlers.
 * 
 */

/**
 * Dependencies.
 */
import _db from './db.js';
import tokens from './tokens.js';


/**
 * Define the handlers.
 */
let things = {};


/**
 * Users. Handles API method "things".
 * @param {object} data HTTP data object.
 * @param {Function} callback The function runs after data is checked when all checks are passed.
 */
things.handlers = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    things._handlers[data.method](data, callback);
  } else {
    callback(405);
  }
};


/**
 * Container for the things methods
*/
things._handlers = {};


/**
 * Creates a record of a new thing in the database. The thing is available for an hour.
 * API method - "things". HTTP method - POST.
 * @param {object} data HTTP data object.
 * Required data: none.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
things._handlers.post = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;
  // Get thingId
  let thingId = typeof(data.payload.thingId) == 'number' && data.payload.thingId >= 100000 && data.payload.thingId <= 999999 ? data.payload.thingId : false;

  if (!thingId) {
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
 * Retrieves records with things data from the database.
 * API method - "things". HTTP method - GET.
 * Only let an authenticated user access their object. Don't let them access anyone elses.
 * @param {object} data HTTP data object.
 * Required data: none.
 * Optional data: thingId.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
things._handlers.get = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;
  let thingId = typeof(data.queryStringObject.thingId) == 'string' && data.queryStringObject.thingId.trim().length == 6 ? int(data.queryStringObject.thingId.trim()) : false;

  if (!thingId) {
    callback(400, { 'Error': 'Missing required fields' });
    return;
  }

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
 * Changes/updates records of thing data in the database.
 * API method - "things". HTTP method - PUT.
 * Only let an authenticated user access their object. Don't let them update anyone elses.
 * @param {object} data HTTP data object.
 * Required data: none.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
things._handlers.put = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;
  // Get thingId
  let thingId = typeof(data.payload.thingId) == 'number' && data.payload.thingId >= 100000 && data.payload.thingId <= 999999 ? data.payload.thingId : false;

  if (!thingId) {
    callback(400, { 'Error': 'Missing required fields' });
    return;
  }

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
 * Deletes/hides records of an thing from/in the database.
 * API method - "users". HTTP method - DELETE.
 * Only let an authenticated user access their object. Don't let them access anyone elses.
 * @param {object} data HTTP data object.
 * Required data: none.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
things._handlers.delete = (data, callback) => {
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;
  // Get thingId
  let thingId = typeof(data.queryStringObject.thingId) == 'string' && data.queryStringObject.thingId.trim().length == 6 ? int(data.queryStringObject.thingId.trim()) : false;

  if (!thingId) {
    callback(400, { 'Error': 'Missing required fields' });
    return;
  }

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
export default things;
