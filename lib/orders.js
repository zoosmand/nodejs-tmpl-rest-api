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
let orders = {};





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




/**
 * Container for the orders methods
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

  tokens.verifyToken(token, function(userUid){
    if(userUid){
      // Check how many orders are created by the cuttent moment by the user
      orders.getActiveOrderQuantity(userUid, function(activeOrderCount){
        if (activeOrderCount < 5) {
          // The new order lives 1 hour
          let expireAt = Date.now() + 1000 * 60 * 60;
          // Generate the order ID
          let orderId = helpers.createRandomArbitraryNumber(100001, 999999);

          // SQL request
          let sqlRequest = format(`
            INSERT INTO orders (
              'user',
              'order',
              'expire_at'
            ) VALUES (
              '%s',
              '%s',
              '%s'
            )
          `, userUid, orderId, expireAt);
    
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
          callback(400, { 'Error': 'Only 5 active orders are allowed for a moment for a user. To continue, pay or close some orders, please.' }); 
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

  tokens.verifyToken(token, function(userUid){
    if(userUid){
      // SQL request
      let sqlRequest = ''
      let orderId = typeof(data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.trim().length == 6 ? data.queryStringObject.orderId.trim() : false;
      let orderTotal = typeof(data.queryStringObject.total) != 'undefined' ? true : false;

      if (orderId) {
        // Check order status
        orders.getOrderStatus(orderId, function(orderStatus){
          if (orderStatus.paid) {
            callback(400, { 'Error': 'The order is already paid' });
            return;
          }
          if (orderStatus.expireAt < Date.now()) {
            callback(400, { 'Error': 'The order has expired' });
            return;
          }
        });

        if (orderTotal) {
          // get order total sum 
          sqlRequest = format(`
            SELECT SUM(itemSum) AS totalSum FROM (
              SELECT 
                ROUND(i.price*SUM(oi.quantity), 2) AS itemSum 
              FROM order_items AS oi 
                INNER JOIN orders AS o ON o.uid = oi.'order' 
                  AND o.'order' = '%d' 
                INNER JOIN items AS i ON i.uid = oi.item 
              GROUP BY 
                i.price 
              HAVING SUM(oi.quantity) > 0
            )
          `, orderId);

        } else {
          // get order items
          sqlRequest = format(`
            SELECT 
              i.id AS itemId, 
              i.item,
              i.price,
              SUM(oi.quantity) AS quantity, 
              i.price*SUM(oi.quantity) AS itemSum 
            FROM order_items AS oi 
              INNER JOIN orders AS o ON o.uid = oi.'order' 
                AND o.'order' = '%d'
                AND o.expire_at > '%s'
              INNER JOIN items AS i ON i.uid = oi.item 
            GROUP BY 
              i.id, 
              i.item, 
              i.price 
            HAVING SUM(oi.quantity) > 0
          `, orderId, Date.now());
        }
      } else {
        // get orders
        sqlRequest = format(`
          SELECT
            o.'order' AS orderId,
            o.paid,
            o.expire_at AS expireAt
          FROM orders AS o
          INNER JOIN users AS u 
            ON u.uid = o.user
          WHERE 
            u.uid = '%s'
          AND
            o.expire_at > '%s'
          AND
            o.paid = 0
        `, userUid, Date.now());
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
      let orderId = typeof(data.payload.orderId) == 'number' && data.payload.orderId >= 100000 && data.payload.orderId <= 999999 ? data.payload.orderId : false;
      let itemId = typeof(data.payload.itemId) == 'number' && data.payload.itemId >= 100000 && data.payload.itemId <= 999999 ? data.payload.itemId : false;
      let itemQuantity = typeof(data.payload.itemQuantity) == 'number' && data.payload.itemQuantity >= -10 && data.payload.itemQuantity <= 10 ? data.payload.itemQuantity : false;
      
      if (orderId && itemId && itemQuantity) {
        // stop the workflow if too much items quantity
        if (!itemQuantity) {
          callback(400, { 'Error': 'The quantiry of an item cannot be more than 10 in a single order' });
          return;
        }
  
        let sqlRequest = format(`
          SELECT
            o.uid,
            o.expire_at AS expireAt
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
            if (orderData.expireAt <= Date.now()) {
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

            _db.get(sqlRequest, (err, itemsData) => {
              if (err || (!err && !itemsData )) {
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
                      `, orderData.uid, itemsData.uid, itemQuantity);

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
      let orderId = typeof (data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.trim().length == 6 ? data.queryStringObject.orderId.trim() : false;

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
          o.expire_at > '%s'
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
              callback(400, { 'Error': format('Cannon remove the order %s', orderId), 'Details': err });
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
 * Verifies if a given order id exists for a given user.
 * @param {number} orderUid Order unique ID.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
orders.getOrderStatus = (orderUid, callback) => {
  //Lookup order
  let sqlRequest = format(`
    SELECT
      o.'paid' AS paid,
      o.'expire_at' AS expireAt
    FROM orders AS o
    WHERE 
      o.'order' = '%i'
  `, orderUid);

  _db.get(sqlRequest, (err, data) => {
    if (!err && data) {
      callback(data);
    } else {
      callback(false);
    }
  });
};



/**
 * Verifies if a given order id exists for a given user.
 * @param {number} userUid User unique ID.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
orders.getActiveOrderQuantity = (userUid, callback) => {

  //Lookup order(s)
  let sqlRequest = format(`
    SELECT
      COUNT(o.'uid') AS activeOrderCount
    FROM orders AS o
      INNER JOIN users AS u 
        ON u.uid = o.user
          AND u.uid = '%s'
          AND o.paid = 0
          AND o.expire_at > '%s'
    `, userUid, Date.now());

  _db.get(sqlRequest, (err, data) => {
    if (!err && data) {
      callback(data.activeOrderCount);
    } else {
      callback(false);
    }
  });
};



/** 
 * Export the module
 */
export default orders;
