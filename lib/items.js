/**
 * Item handlers.
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
let items = {};







/* ************************************************************************************************************* */
/* *******************************************         TOKENS         ****************************************** */
/* ************************************************************************************************************* */

/**
 * Tokens. Handles API method "tokens".
 * @param {object} data HTTP data object.
 * @param {functiion} callback @param {*} callback The function runs after data is checked when all checks are passed.
 */
items.handlers = (data, callback) => {
  let acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    items._handlers[data.method](data, callback);
  } else {
    callback(405);
  }
};




/**
 * Container for all the tokens methods
 */
items._handlers = {};




/**
 * Retrieves records with item data from the database.
 * API method - "items". HTTP method - GET.
 * Only let an authenticated user access their object. Don't let them access anyone elses.
 * @param {object} data HTTP data object.
 * Required data: phone.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
items._handlers.get = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;

  tokens.verifyToken(token, function(uid){
    if(uid){
      // SQL request
      let sqlRequest = format(`
        SELECT
          item,
          id,
          price,
          description
        FROM items
        WHERE 
          active = '1'
      `);

      // Get item ID from the query string. If it is, correct the SQL request 
      let itemId = typeof(data.queryStringObject.itemId) == 'string' && data.queryStringObject.itemId.trim().length == 6 ? data.queryStringObject.itemId.trim() : false;
      if (itemId) {
        sqlRequest += format(" AND id = '%s'", itemId);
      }

      _db.all(sqlRequest, (err, data) => {
        if (!err && data) {
          callback(200, data);
        } else {
          callback(500, { 'Error': 'Unexpected problem with the items', 'Details': err });
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
export default items;
