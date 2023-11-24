/***
 * Primary file for the API
 * 
 */

// Dependency
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');


// The server should respond on all requests with a stirng
var server = http.createServer(function(req, res){

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
  var headers =  req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data){
    buffer += decoder.write(data);
  });
  req.on('end', function(){
    buffer += decoder.end();

    try {
      buffer = JSON.parse(buffer);
    } catch (e) {
      // return console.error(e);
    } finally {

      // Choose the handler this request should go to. If one is not found use the notFuld handler.
      var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

      // Construst the data object to send to the handler
      var data = {
        'trimmedPath': trimmedPath,
        'queryStringObject': queryStringObject,
        'method': method,
        'headers': headers,
        'payload': buffer
      }

      // Route the request to the specified handler
      chosenHandler(data, function(statusCode, payload){
        // Use the status code called from tha handler, or default status code 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

        // Use the payload called back by the gandler, or default to an empty object
        payload = typeof(payload) == 'object' ? payload : {};

        // Conver the payload to the string
        var payloadString = JSON.stringify(payload);
        
        // Send the response
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);

        // Log the request path
        console.log('Request is received\n\ton path: '+trimmedPath
          +'\n\twith method: '+method
          +'\n\twith query string paramenters: '+JSON.stringify(queryStringObject)
          +'\n\twith these headers: '+JSON.stringify(headers)
          +'\n\twith payload: '+JSON.stringify(buffer)
        );
      });
    }
  });
});

// Start the server and have it listen on port 3000
server.listen(config.port, function(){
  console.log('The  server is listenning on port '+config.port+' now on '+config.envName+' mode');
});

// Define handlers
var handlers = {};

// Sample handler
handlers.sample = function(data, callback){
  // Callback a HTTP status code and a payload object
  callback(406, {'name': 'Sample Handler', 'env': process.env.secVar});
};

// Not found handler
handlers.notFound = function(data, callback){
  callback(404);
};

// Define a request router
router = {
  'sample': handlers.sample
}