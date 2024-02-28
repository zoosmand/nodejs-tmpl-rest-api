/**
 * dbrary for storing end editing data
 * 
 */


/**
 * Dependencies.
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import helpers from './helpers.js';
import sqlite3 from 'sqlite3';
import { format } from 'util';

/**
 * Container for the database object.
 */
var _db = {};

/**
 *  Path th the database file.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
_db.database = join(__dirname, '../.data/db.sqlite');


/**
 * Checks the database's existence. If exists, open, otherwise create a new database, and fill it with the tables.
 * @param {Function} callback The function runs after data is checked when all checks are passed.
 * @returns {sqlite3.Database|boolean} The SQLite database object. 
 */
_db.open = (callback) => {
  let db = new sqlite3.Database(_db.database, sqlite3.OPEN_READWRITE, err => {
    if (!err) {
      callback(false);
    } else {
      db = new sqlite3.Database(_db.database, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, err => {
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
            )`, [], err => {
            if (!err) {

              // create indexes for table 'users'
              db.run(`CREATE UNIQUE INDEX phone_UIDX ON users (phone)`, [], err => {
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
                    )`, [], (err) => {
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
};


/**
 * Closes the database
 * @param {sqlite3.Database} database The SQLite database object.
 * @param {Function} callback The function runs after data is checked when all checks are passed.
 */
_db.close = (database, callback) => {
  database.close(err => {
    if (!err) {
      callback(false);
    } else {
      callback('Cannot close databease, ' + err.message);
    }
  });
};




/**
 * Container for the module (to be exported).
 */
var db = {};


/**
 * Executes an SQL request for the database.
 * @param {string} sqlRequest An SQL request passed to the datadase.
 * @param {function} callback The function runs after data is checked when all checks are passed.
 */
db.execute = (sqlRequest, callback) => {
  let dbConn = _db.open(err => {
    if (!err) {
        dbConn.run(sqlRequest, [], err => {
          if (!err) {
            // Success
            // Close database connection
            _db.close(dbConn, err => {
              if (!err) {
                callback(false);
              } else {
                callback(err);
              }
            });

          } else {
            // Fail
            // Close database connection
            _db.close(dbConn, closeErr => {
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


/**
 * Executes an SQL request for the database and retrieves data.
 * @param {string} sqlRequest An SQL request passed to the datadase.
 * @param {function} callback The function runs after data is checked when all checks are passed.
 */
db.get = (sqlRequest, callback) => {
  let dbConn = _db.open(err => {
    if (!err) {
      dbConn.get(sqlRequest, [], (err, sqlData) => {
        if (!err) {
          // Success
          // Close database connection
          _db.close(dbConn, err => {
            if (!err) {
              callback(false, sqlData);
            } else {
              callback(err);
            }
          });

        } else {
          // Fail
          // Close database connection
          _db.close(dbConn, closeErr => {
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


/**
 * Export the module
 */
export default db;
