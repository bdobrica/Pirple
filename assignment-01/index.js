/**
 * Primary file for the API
 */

// Dependencies
var http = require ('http');
var https = require ('https');
var url = require ('url');
var StringDecoder = require ('string_decoder').StringDecoder;
var config = require ('./config');
var fs = require ('fs');

// Instantiating the HTTP server
var httpServer = http.createServer (function(res, req){
	unifiedServer(res, req);
});

// Start the HTTP server
httpServer.listen (config.httpPort, function(){
	console.log ('The server is listening on port ' + config.httpPort);
});


// Instantiate the HTTPS server
var httpsServerOptions = {
	'key': fs.readFileSync(config.keyFile),
	'cert': fs.readFileSync(config.certFile)
};
var httpsServer = https.createServer (httpsServerOptions, function(res, req){
	unifiedServer(res, req);
});

// Start the HTTPS server
httpsServer.listen (config.httpsPort, function(){
	console.log ('The server is listening on port ' + config.httpsPort);
});

// All the server logic for both http and https
var unifiedServer = function (req, res){
	// Get the URL and parse it
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
	var decoder = new StringDecoder ('utf-8');
	var buffer = '';
	req.on ('data', function(data){
		buffer += decoder.write(data);
	});
	req.on ('end', function(){
		buffer += decoder.end();

		// Choose the handler this request should go to. If one is not found, use the not-found handler
		var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		// Construct the data object to send to the handler
		var data = {
			'trimmedPath': trimmedPath,
			'queryString': queryStringObject,
			'method': method,
			'headers': headers,
			'payload': buffer
		};

		// Route the request to the handler specified in the router
		chosenHandler (data, function(statusCode, payload){
			// Use the status code called back by the handler, or default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

			// Use the payload called back by the handler, or default to {}
			payload = typeof(payload) == 'object' ? payload : {};

			// Convert the payload to a string
			var payloadString = JSON.stringify (payload);

			// Return the response
			res.setHeader ('Content-Type', 'application/json');
			res.writeHead (statusCode);
			res.end (payloadString);

			// Log the request path
			console.log ('Returning this response: ', statusCode, payloadString);
		});
	});
};

// Define the handlers
var handlers = {};

// Hello handler
handlers.hello = function (data, callback) {
	// Callback a http status 404 code, and a message
	if (data.method === 'post') {
		callback (200, {'message': 'Welcome!'});
		// Get out of here, all good :-)
		return;
	}
	// Callback a 405 http status code - Method Not Allowed
	callback (405);
};

// Not found handler
handlers.notFound = function (data, callback) {
	callback (404);
};

// Define a request router
var router = {
	'hello' : handlers.hello,
};