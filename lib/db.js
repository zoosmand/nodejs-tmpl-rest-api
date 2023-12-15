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

// Base directory of the database file
_db.database = path.join(__dirname, '../.data/db.sqlite');


// Check the database's existence. If exists, open, otherwise create a new database, and fill it with the tables
_db.open = function (callback) {
  var db = new sqlite3.Database(_db.database, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (err) {
    if (!err) {
      // chech if tables exist
      db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], function(err, tables){
        if(!err) {
          for (i = 0; i < tables.length; i++) {
            if (tables[i].name == 'users') {
              callback(false);
              break;
            } else {

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
            }
          }
        } else {
          callback('Cannot check database, ' + err.message);
        }
      });

    } else {
      callback('Error creating new database, ' + err.message);
      return false;
    }
  });
  return db;
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
  database = _db.open(function(err){
    if (!err) {

      // @TODO Realise the logic
      sql = util.format(`
        INSERT INTO %s VALUES
        'phone' = '%s',
        'first_name' = '%s',
        'last_name' = '%s',
        'password' = '%s',
        'tos_agreement' = '%s'
      `, table, id, data.firstName, data.lastName, data.hashedPassword, data.tosAgreement);

      database.run(sql, [], function(err){

      });

      _db.close(database, function(err){
        if (!err){
          // callback(sql);
          callback(false);
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });

};

// Read data from the database
db.read = function (table, id, callback) {
};

// Update data inside the database
db.update = function (table, id, data, callback) {
};

// Deleting data from the database
db.delete = function (table, id, callback) {
};



// Export the module
module.exports = db;