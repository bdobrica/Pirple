/**
 * Request handlers
 * 
 */

// Dependencies
var _data = require ('./data');
var helpers = require ('./helpers');

// Define the handlers
var handlers = {};

// Users
handlers.users = function (data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf (data.method) > -1) {
		handlers._users[data.method] (data, callback);
	}
	else {
		callback (405);
	}
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
	// Check that all required fields are filled out
	var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement;

	if (firstName && lastName && phone && password && tosAgreement) {
		// Make sure that the user doesn't already exists
		_data.read ('users', phone, function (err, data) {
			if (err) {
				// Hash the password
				var hashedPassword = helpers.hash (password);
				if (hashedPassword) {
					// Create the user object
					var userObject = {
						'firstName': firstName,
						'lastName': lastName,
						'phone': phone,
						'hashedPassword': hashedPassword,
						'tosAgreement': true
					};

					// Store the user
					_data.create ('users', phone, userObject, function (err) {
						if (!err) {
							callback (200);
						}
						else {
							console.log (err);
							callback (500, {'error': 'Could not create the new user'});
						}
					});
				}
				else {
					callback (500, {'error': 'Could not hash the password'});
				}

			}
			else {
				// User already exists
				callback (400, {'error' : 'A user with that phone number already exists'});
			}
		});
	}
	else {
		callback (400, {'error' : 'Missing required fields'});
	}
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function (data, callback) {
	// Check that the phone number is valid
	var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if (phone) {
		// Get the token from the headers
		var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
		// Verify that the given token is valid for the phone number
		handlers._tokens.verifyToken (token, phone, function (tokenIsValid){
			if (tokenIsValid) {
				// Lookup the user
				_data.read ('users', phone, function (err, userData) {
					if (!err && userData) {
						// Remove the hashed password from the user object before returning it to a requester
						delete userData.hashedPassword;
						callback (200, userData);
					}
					else {
						callback (404, {'error': 'The user does not exist'});
					}
				});
			}
			else {
				callback (403, {'error': 'Missing required token in headers or token is invalid'});
			}
		});
	
	}
	else {
		callback (400, {'error': 'Missing required field'});
	}
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @todo: allow only an authenticated user access their object. Don't let them access anyone else's
handlers._users.put = function (data, callback) {
	// Check that the phone number is valid
	var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	// Check for the optional fields
	var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	if (phone) {
		if (firstName || lastName || password) {
			// Get the token from the headers
			var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
			// Verify that the given token is valid for the phone number
			handlers._tokens.verifyToken (token, phone, function (tokenIsValid){
				if (tokenIsValid) {
					// Lookup the user	
					_data.read ('users', phone, function (err, userData) {
						if (!err && userData) {
							// Update the fields that are necessary
							if (firstName) {
								userData.firstName = firstName;
							}
							if (lastName) {
								userData.lastName = lastName;
							}
							if (password) {
								userData.hashedPassword = helpers.hash (password);
							}
							// Store the new updates
							_data.update ('users', phone, userData, function (err) {
								if (!err) {
									callback (200);
								}
								else {
									console.log (err);
									callback (500, {'error': 'Could not update the user'});
								}
							});
						}
						else {
							// In PUT, we're not using 404
							callback (400, {'error': 'The user does not exist'});
						}
					});
				}
				else {
					callback (403, {'error': 'Missing required token in headers or token is invalid'});
				}
			});
		}
		else {
			callback (400, {'error': 'Missing fields to update'});
		}
	}
	else {
		callback (400, {'error': 'Missing required field'});
	}
};

// Users - delete
// Required field: phone
// Optional fields: none
// @todo: allow only an authenticated user delete their object. Don't let them delete anyone else's
// @todo Cleanup (delete) any other data files associated with this users
handlers._users.delete = function (data, callback) {
	// Check that the phone number is value
	var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if (phone) {
		// Get the token from the headers
		var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
		// Verify that the given token is valid for the phone number
		handlers._tokens.verifyToken (token, phone, function (tokenIsValid){
			if (tokenIsValid) {
				// Lookup the user
				_data.read ('users', phone, function (err, data) {
					if (!err && data) {
						_data.delete ('users', phone, function (err){
							if (!err) {
								callback (200);
							}
							else {
								console.log (err);
								callback (500, {'error': 'Could not delete the specified user'});
							}
						});
					}
					else {
						callback (400, {'error': 'The user does not exist'});
					}
				});
			}
			else {
				callback (403, {'error': 'Missing required token in headers or token is invalid'});
			}
		});
	}
	else {
		callback (400, {'error': 'Missing required field'});
	}
};

// Tokens
handlers.tokens = function (data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf (data.method) > -1) {
		handlers._tokens[data.method] (data, callback);
	}
	else {
		callback (405);
	}
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function (data, callback) {
	var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	if (phone && password) {
		// Lookup the user who matches that phone number
		_data.read ('users', phone, function (err, userData) {
			if (!err && userData) {
				// Hash the password and compare it to the one stored in the userData object
				var hashedPassword = helpers.hash (password);
				if (hashedPassword == userData.hashedPassword) {
					// If valid, create a new token with a random name. Set expiration date 1 hour in the future
					var tokenId = helpers.createRandomString (20);
					var expires = Date.now () + 3600000;
					var tokenObject = {
						'phone': phone,
						'id': tokenId,
						'expires': expires
					};

					// Store the token
					_data.create ('tokens', tokenId, tokenObject, function (err) {
						if (!err) {
							callback (200, tokenObject);
						}
						else {
							callback (500, {'error': 'Could not create the new token'});
						}
					});
				}
				else {
					callback (400, {'error': 'Password did not match the specified user\'s stored password'});
				}
			}
			else {
				callback (400, {'error': 'Could not find the specified user'});
			}
		});
	}
	else {
		callback (400, {'error': 'Missing required fields'});
	}
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
	// Check that the id sent is valid
	var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if (id) {
		// Lookup the token
		_data.read ('tokens', id, function (err, tokenData) {
			if (!err && tokenData) {
				callback (200, tokenData);
			}
			else {
				callback (404, {'error': 'The token does not exist'});
			}
		});
	}
	else {
		callback (400, {'error': 'Missing required field'});
	}
};

// Tokens - put
// Required fields: id, extend
// Optional fields: none
handlers._tokens.put = function (data, callback) {
	// Check that the id is valid
	var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	// Check if extended is set
	var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend;


	if (id && extend) {
		// Lookup the token
		_data.read ('tokens', id, function (err, tokenData) {
			if (!err && tokenData) {
				// Check to make sure the token isn't expired
				if (tokenData.expires > Date.now ()) {
					// Set the expiration date 1 hour from now
					tokenData.expires = Date.now () + 3600000;
					
					// Store the new updates
					_data.update ('tokens', id, tokenData, function (err) {
						if (!err) {
							callback (200);
						}
						else {
							console.log (err);
							callback (500, {'error': 'Could not update the token'});
						}
					});
				}
				else {
					callback (400, {'error': 'The token has already expired and cannot be extended'});
				}
			}
			else {
				// In PUT, we're not using 404
				callback (400, {'error': 'The specified token does not exist'});
			}
		});
	}
	else {
		callback (400, {'error': 'Missing required field(s) or field(s) are invalid'});
	}
};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
	// Check that the id is valid
	var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if (id) {
		// Lookup the user
		_data.read ('tokens', id, function (err, data) {
			if (!err && data) {
				_data.delete ('tokens', id, function (err){
					if (!err) {
						callback (200);
					}
					else {
						console.log (err);
						callback (500, {'error': 'Could not delete the specified token'});
					}
				});
			}
			else {
				callback (400, {'error': 'The token does not exist'});
			}
		});
	}
	else {
		callback (400, {'error': 'Missing required field'});
	}
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
	// Lookup the token
	_data.read ('tokens', id, function (err, tokenData) {
		if (!err && tokenData) {
			// Check if the token is for the given user and has not expired
			if (tokenData.phone == phone && tokenData.expires > Date.now()) {
				callback (true);
			}
			else {
				callback (false);
			}
		}
		else {
			callback (false);
		}
	});
};

// Ping handler
handlers.ping = function (data, callback) {
	callback (200);
};

// Not found handler
handlers.notFound = function (data, callback) {
	callback (404);
};

// Export the module
module.exports = handlers;