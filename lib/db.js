/**
 * dbrary for storing end editing data
 * 
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');
const sqlite3 = require('sqlite3');
const util = require('util');

// Container for the database object
var _db = {};

// Path th the database file
_db.database = path.join(__dirname, '../.data/db.sqlite');


// Check the database's existence. If exists, open, otherwise create a new database, and fill it with the tables
_db.open = function (callback) {
  var db = new sqlite3.Database(_db.database, sqlite3.OPEN_READWRITE, function (err) {
    if (!err) {
      callback(false);
    } else {
      var db = new sqlite3.Database(_db.database, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (err) {
        if (!err) {
          // create table 'users'
          db.run(`
            CREATE TABLE users (
              uid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
              phone VARCHAR(64) NOT NULL,
              first_name VARCHAR(255),
              last_name VARCHAR(255),
              password VARCHAR(256) NOT NULL,
              tos_agreement INTEGER(1) NOT NULL,
              deleted INTEGER(1) NOT NULL DEFAULT 0
            )`, [], function (err) {
            if (!err) {

              // create indexes for table 'users'
              db.run(`CREATE UNIQUE INDEX phone_UIDX ON users (phone)`, [], function (err) {
                if (!err) {

                  // create table 'tokens'
                  db.run(`
                    CREATE TABLE tokens (
                        uid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                        user INTEGER NOT NULL,
                        token INTEGER NOT NULL,
                        expired_at DATETIME NOT NULL,
                        deleted INTEGER(1) NOT NULL DEFAULT 0,
                        FOREIGN KEY(user) REFERENCES users(uid)
                    )`, [], function (err) {
                    if (!err) {
                      callback(false);
                    } else {
                      callback('Cannot create indexes table \'tokens\', ' + err.message);
                      return false;
                    }
                  });
                } else {
                  callback('Cannot create indexes for table \'users\', ' + err.message);
                  return false;
                }
              });
            } else {
              callback('Cannot create table \'users\', ' + err.message);
              return false;
            }
          });
        } else {
          callback('Error creating new database, ' + err.message);
          return false;
        }
      });
    }
  });
  return db;
  // Chech the table named 'users' exists
  // `SELECT name FROM sqlite_master WHERE type='table'`
};

// Close the database
_db.close = function (database, callback) {
  database.close(function (err) {
    if (!err) {
      callback(false);
    } else {
      callback('Cannot close databease, ' + err.message);
    }
  });
}



// Container for the module (to be exported)
var db = {};


// Write data to the database
db.create = function (table, id, data, callback) {
  dbConn = _db.open(function (err) {
    if (!err) {

      sql = util.format(`
        INSERT INTO %s (
          'phone',
          'first_name',
          'last_name',
          'password',
          'tos_agreement'
        ) VALUES (
          '%s',
          '%s',
          '%s',
          '%s',
          '%s'
        )
      `, table, id, data.firstName, data.lastName, data.hashedPassword, (data.tosAgreement ? 1 : 0));

      dbConn.run(sql, [], function(err){
        if (!err){
          // Success
          // Close database connection
          _db.close(dbConn, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback(err);
            }
          });

        } else {
          // Fail
          // Close database connection
          _db.close(dbConn, function (closeErr) {
            if (!closeErr) {
              callback(err.message);
            } else {
              callback(closeErr + ', ' + err.message);
            }
          });
        }
      });

    } else {
      callback(err);
    }
  });

};

// Read data from the database
db.read = function (table, id, callback) {
  dbConn = _db.open(function (err) {
    if (!err) {
      sql = util.format(`
      SELECT
        uid,
        phone,
        first_name AS firstName,
        last_name AS lastName
      FROM %s 
      WHERE 
        phone = '%s'
      AND
        deleted = 0
      `, table, id);
      
      dbConn.get(sql, [], function(err, sqlData){
        if(!err){
          // Success
          // Close database connection
          _db.close(dbConn, function (err) {
            if (!err) {
              callback(false, sqlData);
            } else {
              callback(err);
            }
          });

        }else{
          // Fail
          // Close database connection
          _db.close(dbConn, function (closeErr) {
            if (!closeErr) {
              callback(err.message);
            } else {
              callback(closeErr + ', ' + err.message);
            }
          });
        }
      });

    } else {
      callback(err);
    }
  });
};

// Update data inside the database
db.update = function (table, id, data, callback) {
};

// Deleting data from the database
db.delete = function (table, id, callback) {
};



// Export the module
module.exports = db;