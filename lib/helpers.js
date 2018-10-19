/**
 * Helpers for various tasks
 * 
 */

// Dependencies
var crypto = require ('crypto');
var config = require ('../config');

// Container for all the helpers
var helpers = {};

// Create a SHA256 hash
helpers.hash = function (str) {
	if (typeof (str) == 'string' && str.length > 0) {
		var hash = crypto.createHmac ('sha256', config.hashingSecret).update (str).digest ('hex');
		return hash;
	}
	else {
		return false;
	}
};

// Parse a JSON string to an object in all cases without throwing
helpers.parseJsonToObject = function (str) {
	try {
		var object = JSON.parse (str);
		return object;
	}
	catch (e) {
		return {};
	}
};

// Create a string of random alpha-numeric characters of a given length
helpers.createRandomString = function (stringLength) {
	stringLength = typeof (stringLength) == 'number' && stringLength > 0 ? stringLength : false;
	if (stringLength) {
		// Define all the possible characters that could go into a string
		var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz01234567890';

		// Start the final string
		var str = '';
		for (var i = 0; i < stringLength; i++) {
			// Get a random character from the possibleCharacters tring
			var randomCharacter = possibleCharacters.charAt(Math.floor (Math.random () * possibleCharacters.length));
			// Append this character to the final string
			str += randomCharacter;
		}

		// Return the final string
		return str;
	}
	else {
		return false;
	}
};

// Export the module
module.exports = helpers;