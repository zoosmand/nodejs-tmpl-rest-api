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
 * API method - "orders". HTTP method - POST.
 * @param {object} data HTTP data object.
 * Required data: none.
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
          o.expired_at BETWEEN '%s' AND '%s'
        `, uid, Date.now(), expiredAt);

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
      
            // Store the order into database
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
 * Retrieves records with orders data from the database.
 * API method - "orders". HTTP method - GET.
 * Only let an authenticated user access their object. Don't let them access anyone elses.
 * @param {object} data HTTP data object.
 * Required data: none.
 * Optional data: orderId.
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
        AND
          o.expired_at > '%s'
        AND
          o.paid = 0
      `, uid, Date.now());

      // Get order ID from the query string. If it is, correct the SQL request 
      var orderId = typeof (data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.trim().length == 6 ? data.queryStringObject.orderId.trim() : false;
      if (orderId) {
        sqlRequest += format(" AND o.'order' = '%s'", orderId);
      }
  
      _db.all(sqlRequest, (err, data) => {
        if (!err && data) {
          callback(200, data);
        } else {
          callback(400, { 'Error': 'An order does not exist or already paid or expired', 'Details': err });
        }
      });
    } else {
      callback(400, { 'Error': 'Given token is incorrect or has expired' });
    }
  });
};




/**
 * Changes/updates records of order data in the database.
 * API method - "orders". HTTP method - PUT.
 * Only let an authenticated user access their object. Don't let them update anyone elses.
 * @param {object} data HTTP data object.
 * Required data: orderId, itemId, itemQuantity.
 * Optional data: .
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
orders._handlers.put = (data, callback) => {
  // Get authorization token
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;

  tokens.verifyToken(token, function(uid){
    if(uid){
      let orderId = typeof(data.payload.orderId) == 'number' ? data.payload.orderId : false;
      let itemId = typeof(data.payload.itemId) == 'number' ? data.payload.itemId : false;
      let itemQuantity = typeof(data.payload.itemQuantity) == 'number' && data.payload.itemQuantity >= -10 && data.payload.itemQuantity <= 10 ? data.payload.itemQuantity : false;
      
      if (!itemQuantity) {
        callback(400, { 'Error': 'The quantiry of an item cannot be more than 10 in a single order' });
        return;
      }

      if (orderId && itemId && itemQuantity) {

        let sqlRequest = format(`
          SELECT
            o.uid,
            o.expired_at AS expiredAt
          FROM orders AS o
          INNER JOIN users AS u
            ON u.uid = o.user
          WHERE 
            u.uid = '%s'
          AND
            o.'order' = '%s'
        `, uid, orderId);
  
        _db.get(sqlRequest, (err, orderData) => {
          if (!err && orderData) {
            // An order lives for 1 hour
            if (orderData.expiredAt <= Date.now()) {
              callback(400, { 'Error': format('The order %s has expired', orderId) });
              return;
            }

            // Check if item exists
            let sqlRequest = format(`
              SELECT
                uid
              FROM items
              WHERE 
                id = '%d'
            `, itemId);

            _db.get(sqlRequest, (err, ItemsData) => {
              if (err || (!err && !Boolean(ItemsData) )) {
                callback(400, { 'Error': format('Item %s does not exist', itemId) });
                return; 
              } else {

                // Retrieve items from the order
                // No more than 10 items in a single order
                sqlRequest = format(`
                  SELECT COUNT(uid) AS orderSize FROM (
                    SELECT 
                      o.uid, 
                      oi.item, 
                      SUM(oi.quantity) AS quantity 
                    FROM order_items AS oi 
                      INNER JOIN orders AS o ON o.uid = oi.'order' 
                        AND o.uid = '%s' 
                    GROUP BY 
                      oi.'order', 
                      oi.item 
                    HAVING SUM(oi.quantity) > 0
                  )
                `, orderData.uid);

                _db.get(sqlRequest, (err, orderItemCountData) => {
                  if (!err && orderItemCountData) {

                    if (orderItemCountData.orderSize >= 10) {
                      callback(400, { 'Error': 'You have reached the limit of items (10) in a single order' });
                      return;
                    } else {
                      // Retrieve order items
                      sqlRequest = format(`
                        INSERT INTO order_items (
                          'order', 
                          'item', 
                          'quantity'
                        ) VALUES (
                          '%d',
                          '%d',
                          '%d'
                        )
                      `, orderData.uid, itemData.uid, itemQuantity);

                      _db.execute(sqlRequest, (err) => {
                        if (!err) {
                          callback(200);
                        } else {
                          callback(400, { 'Error': format('Cannot add item %s to order %s', itemId, orderId), 'Details': err });
                        }
                      });
                    }
                  } else {
                    callback(400, { 'Error': format('Cannot add item %s to order %s', itemId, orderId), 'Details': err });    
                  }
                });
              }
            });
          } else {
            callback(400, { 'Error': format('Cannot create the order %d', orderId), 'Details': err });
          }
        });  
      } else {
        callback(400, { 'Error': 'Missing required fields' });
      }
    } else {
      callback(403, { 'Error': 'Given token is incorrect or has expired, or missing required filed(s)' });
    }
  });
};




/**
 * Deletes/hides records of an order from/in the database.
 * API method - "users". HTTP method - DELETE.
 * Only let an authenticated user access their object. Don't let them access anyone elses.
 * @param {object} data HTTP data object.
 * Required data: none.
 * Optional data: none.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
orders._handlers.delete = (data, callback) => {
  // Check the phone number is valid
  // let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  let token = typeof(data.headers.authorization) == 'string' ? data.headers.authorization : false;

  tokens.verifyToken(token, function(uid){
    if (uid) {
      // Get the order Id
      var orderId = typeof (data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.trim().length == 6 ? data.queryStringObject.orderId.trim() : false;

      if (!orderId) {
        callback(400, { 'Error': 'You have to define the order Id' });
        return;
      }
      // SQL request
      let sqlRequest = format(`
        SELECT
          o.'uid'
        FROM orders AS o
        INNER JOIN users AS u 
          ON u.uid = o.user
        WHERE 
          u.uid = '%s'
        AND
          o.expired_at > '%s'
        AND
          o.paid = 0
        AND o.'order' = '%s'
      `, uid, Date.now(), orderId);
  
      _db.get(sqlRequest, (err, data) => {
        if (!err && data) {
          sqlRequest = format(`
            UPDATE orders SET 
              paid = '2'
            WHERE uid = '%s'
          `, data.uid);
          _db.execute(sqlRequest, (err) => {
            if (!err && data) {
              callback(200);
            } else {
              allback(400, { 'Error': format('Cannon remove the order %s', orderId), 'Details': err });
            }
          });
        } else {
          callback(400, { 'Error': format('Given order %s does not exist, already paid, or expired', orderId) });
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
