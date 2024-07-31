/**
 * Common handlers.
 * 
 */

/**
 * Dependencies.
 */


/**
 * Define the handlers.
 */
var common = {};





/**
 * Checks the health status.
 * API method - "health". HTTP method - GET.
 * @param {object} data HTTP data object.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
common.health = (data, callback) => {
  // Callback a HTTP status code and a payload object
  if (data.method.toUpperCase() == "GET") {
    callback(200, { 'status': 'The server is healthy' });
  } else {
    callback(405);
  }
};




/**
 * Returns "Not found" response.
 * @param {object} data HTTP data object.
 * @param {functiion} callback The function runs after data is checked when all checks are passed.
 */
common.notFound = (data, callback) => {
  callback(404, { 'Error': 'The requested resource is not found' });
};




/** 
 * Export the module
 */
export default common;
