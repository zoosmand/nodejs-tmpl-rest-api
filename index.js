/**
 * Primary file for the API
 * 
 */

/**
 * Dependency.
 */
import { createServer } from 'http';
import { createServer as _createServer } from 'https';
import { parse } from 'url';
import { StringDecoder } from 'string_decoder';
import config from './lib/config.js';
import { readFileSync } from 'fs';
import common from './lib/common.js';
import users from './lib/users.js';
import tokens from './lib/tokens.js';
import helpers from './lib/helpers.js';



// TEST
// @TODO delete this
// const _data = require('./lib/data');
// 
// _data.create('test', 'newFile', {'foo': 'bar'}, function(err){
//   console.log('This was the error:', err);
// });
// _data.read('test', 'newFile', function(err, data){
//   console.log('This was the error:', err, 'and this was the data', data);
// });
// _data.update('test', 'newFile', {'doo': 'bass'}, function(err){
//   console.log('This was the error:', err);
// });
// _data.delete('test', 'newFile', function(err){
//   console.log('This was the error:', err);
// });
//
// const _db = require('./lib/db');
// userData = {
//   'phone': '1234567890',
//   'firstName': 'John',
//   'lastName': 'Smith',
//   'hashedPassword': 'thisIsAPassword',
//   'tosAgreement': true
// };
// _db.create('users', '2222222222', userData, function(err){
//   console.log('This was the error:', err);
// });
//
// const _db = require('./lib/db');
// _db.read('users', '2222222222', function(err){
//   console.log('This was the error:', err);
// });

// const _db = require('./lib/db');
// userData = {
//   'firstName': 'Henry',
//   'lastName': 'Cole',
//   'hashedPassword': 'thisIsAPassword'
// };
// _db.update('users', '2222222222', userData, function(err){
//   console.log('This was the error:', err);
// });


/**
 * Instantiate an HTTP server.
 */
var httpServer = createServer((req, res) => {
  unifiedServer(req, res);
});

/**
 * Start the HTTP server.
 */
httpServer.listen(config.httpPort, () => {
  console.log('The  server is listenning on httpPort ' + config.httpPort + ' now on ' + config.envName + ' mode');
});


/**
 * Instantiate an HTTPS server.
 */
var httpsServerOptions = {
  'key': readFileSync('./crt/api_server.key'),
  'cert': readFileSync('./crt/api_server.crt')
};
var httpsServer = _createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

/**
 * Start the HTTPS server.
 */
httpsServer.listen(config.httpsPort, () => {
  console.log('The  server is listenning on httpsPort ' + config.httpsPort + ' now on ' + config.envName + ' mode');
});


/**
 * Handles HTTP/HTTPS operations on both servers.
 * All the server logic for the both HTTP and HTTPS server.
 * The server should respond on all requests with a stirng.
 * @param {object} req An HTTP request.
 * @param {object} res An HTTP response.
 */
var unifiedServer = (req, res) => {
  // Geet the URL and parse it
  let parsedUrl = parse(req.url, true);

  // Get the path
  let path = parsedUrl.pathname;
  let trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  let queryStringObject = parsedUrl.query;

  // Get the HTTP method
  let method = req.method.toLowerCase();

  // Get the headers as an object
  let headers = req.headers;

  // Get the payload, if any
  let decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });
  req.on('end', function () {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found use the notFuld handler.
    let chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : common.notFound;

    // Construst the data object to send to the handler
    let data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }

    // Route the request to the specified handler
    chosenHandler(data, (statusCode, payload) => {
      // Use the status code called from tha handler, or default status code 200
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the gandler, or default to an empty object
      payload = typeof (payload) == 'object' ? payload : {};

      // Conver the payload to the string
      var payloadString = JSON.stringify(payload);

      // Send the response
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-Zoosman-API-Version', '2024.07');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      console.log('Request is received\n\ton path: ' + trimmedPath
        + '\n\twith method: ' + method
        + '\n\twith query string paramenters: ' + JSON.stringify(queryStringObject)
        + '\n\twith these headers: ' + JSON.stringify(headers)
        + '\n\twith payload: ' + JSON.stringify(buffer)
      );
    });
  });
};


/**
 * Define a request router
 */
var router = {
  'health': common.health,
  'users': users.handlers,
  'tokens': tokens.handlers
}
