/**
 * Primary file for the API
 * 
 */

// Dependency
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');



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


// Instantiate an HTTP server
var httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, function () {
  console.log('The  server is listenning on httpPort ' + config.httpPort + ' now on ' + config.envName + ' mode');
});

// Instantiate an HTTPS server
const httpsServerOptions = {
  'key': fs.readFileSync('./crt/api_server.key'),
  'cert': fs.readFileSync('./crt/api_server.crt')
};
var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function () {
  console.log('The  server is listenning on httpsPort ' + config.httpsPort + ' now on ' + config.envName + ' mode');
});


// All the server logic for the both HTTP and HTTPS server
// The server should respond on all requests with a stirng
var unifiedServer = function (req, res) {
  // Geet the URL and parse it
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  // Get the headers as an object
  var headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });
  req.on('end', function () {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found use the notFuld handler.
    var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construst the data object to send to the handler
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }

    // Route the request to the specified handler
    chosenHandler(data, function (statusCode, payload) {
      // Use the status code called from tha handler, or default status code 200
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the gandler, or default to an empty object
      payload = typeof (payload) == 'object' ? payload : {};

      // Conver the payload to the string
      var payloadString = JSON.stringify(payload);

      // Send the response
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-Zoosman-API-Version', '2023.12');
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


// Define a request router
router = {
  'health': handlers.health,
  'users': handlers.users,
  'tokens': handlers.tokens
}