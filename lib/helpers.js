/**
 * Helpers for various tasks
 * 
 */

// Dependencies
import { createHmac } from 'crypto';
import config from './config.js';

// Container for all the helpers
var helpers = {};


// Create a SHA256 hash
helpers.hash = str => {
  if (typeof (str) == 'string' && str.length > 0) {
    let hash = createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = str => {
  try {
    let obj = JSON.parse(str);
    return obj;
  } catch {
    return {};
  }
};

// Create a string of random alphabetic charachters, of a given length
helpers.createRandomString = strLength => {
  strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible charachters that could g into a string
    const possibleCharachters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-*^_';

    // Start the final string
    let str = '';

    for (i = 0; i < strLength; i++) {
      // Get a random charachter from the possible charachters
      let randomCharachter = possibleCharachters.charAt(Math.floor(Math.random() * possibleCharachters.length));
      // Append the charachter to the final strin
      str += randomCharachter;
    }
    return str;

  } else {
    return false;
  }
};

// Creates a random number between arbirary numbers
helpers.createRandomArbitraryNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};


// Export the module
export default helpers;
