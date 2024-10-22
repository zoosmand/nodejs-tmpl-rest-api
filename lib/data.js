/**
 * Library for storing end editing data
 * 
 */

// Dependencies
import { open, writeFile, close, readFile, ftruncate, unlink } from 'fs';
import { join } from 'path';
import helpers from './helpers';
import path from "node:path";

// Container for the module (to be exported)
var lib = {};

// Base directory of the data folder
const __filename = path.file();
const __dirname = path.dirname(__filename);
lib.baseDir = join(__dirname, '../.data/');

// Write data to a file
lib.create = function (dir, file, data, callback) {
  // Open the file for writing
  open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Convert data to a string
      var stringData = JSON.stringify(data);
      // Write to ile and close it
      writeFile(fileDescriptor, stringData, function (err) {
        if (!err) {
          close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file, it may already exist');
    }
  });
};

// Read data from a file
lib.read = function (dir, file, callback) {
  readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function (err, data) {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

// Update data inside a file
lib.update = function (dir, file, data, callback) {
  // Opef the file for writing
  open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Convert data to a string
      var stringData = JSON.stringify(data);
      // Truncate thr file
      ftruncate(fileDescriptor, function (err) {
        if (!err) {
          // Write to ile and close it
          writeFile(fileDescriptor, stringData, function (err) {
            if (!err) {
              close(fileDescriptor, function (err) {
                if (!err) {
                  callback(false);
                } else {
                  callback('Error closing existing file');
                }
              });
            } else {
              callback('Error writing to existing file');
            }
          });
        } else {
          callback('Error truncating file');
        }
      });
    } else {
      callback('Could not open file for updating, it may not exist yet');
    }

  });
};

// Deleting aa file
lib.delete = function (dir, file, callback) {
  unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting file');
    }
  });
};



// Export the module
export default lib;