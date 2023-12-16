/**
 * Helpers for various tasks
 * 
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for all the helpers
var helpers = {};


// Create a SHA256 hash
helpers.hash = function (str) {
  if (typeof (str) == 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch {
    return {};
  }
};

// Create a string of random alphabetic charachters, of a given length
helpers.createRandomString = function (strLength) {
  strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible charachters that could g into a string
    const possibleCharachters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-*^_';

    // Start the final string
    var str = '';

    for (i = 0; i < strLength; i++) {
      // Get a random charachter from the possible charachters
      var randomCharachter = possibleCharachters.charAt(Math.floor(Math.random() * possibleCharachters.length));
      // Append thi charachter to the final strin
      str += randomCharachter;
    }
    return str;

  } else {
    return false;
  }
};

// Creates a random number between arbirary numbers
helpers.createRandomArbitraryNumber = function(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};


// Export the module
module.exports = helpers;
