/**
 * Helpers for various tasks.
 * 
 */

/**
 * Dependencies.
 */
import { createHmac } from 'crypto';
import config from './config.js';

/**
 * Container for all the helpers.
 */
var helpers = {};


/**
 * Creates a SHA256 hash.
 * @param {string} str A string to hash. 
 * @returns {string|boolean} A hashed string.
 */
helpers.hash = str => {
  if (typeof (str) == 'string' && str.length > 0) {
    let hash = createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

/**
 * // Parses a JSON string to an object in all cases, without throwing.
 * @param {string} str A JSON sting or raw object.
 * @returns {object} A parsed object.
 */
helpers.parseJsonToObject = str => {
  try {
    let obj = JSON.parse(str.replace("\\", ""));
    return obj;
  } catch {
    return {};
  }
};

/**
 * Creates a string of random alphabetic charachters, of a given length.
 * @param {number} strLength The length of the desired random string.
 * @returns {string} A random string.
 */
helpers.createRandomString = strLength => {
  strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible charachters that could g into a string
    const possibleCharachters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-*^_';

    // Start the final string
    let str = '';

    for (let i = 0; i < strLength; i++) {
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

/**
 * Creates a random number between arbirary numbers.
 * @param {number} min The minimal value.
 * @param {number} max The maximum value.
 * @returns {number|boolean} A desired random number.
 */
helpers.createRandomArbitraryNumber = (min, max) => {
  if (typeof (min) == 'number' && typeof (max) == 'number') {
    return Math.floor(Math.random() * (max - min) + min);
  } else {
    return false;
  }
};


// Export the module
export default helpers;
