/**
 * Library for storing and editing data
 * 
 */

// Dependencies
var fs = require ('fs');
var path = require ('path');
var helpers = require ('./helpers');

// Container for the module (to be exported)
var lib = {};

// Base directory of the data folder
lib.baseDir = path.join (__dirname, '/../.data/');

// Write data to a file
lib.create = function (dir, file, data, callback) {
	// Open the file for writing
	fs.open (this.baseDir + dir + '/' + file + '.json', 'wx', function (err, fileDescriptor){
		if (!err && fileDescriptor) {
			// Convert data to string
			var stringData = JSON.stringify (data);

			// Write to file and close it
			fs.writeFile (fileDescriptor, stringData, function (err) {
				if (!err) {
					// Close the file
					fs.close (fileDescriptor, function (err) {
						if (!err) {
							callback (false);
						}
						else {
							callback ('Error closing new file');
						}
					});
				}
				else {
					callback ('Error writing to new file');
				}
			});
		}
		else {
			callback ('Could not create new file, it may already exist');
		}
	});
};

// Read data from a file
lib.read = function (dir, fileName, callback) {
	fs.readFile(this.baseDir + dir + '/' + fileName + '.json', 'utf-8', function (err, data){
		if (!err && data) {
			var parsedData = helpers.parseJsonToObject (data);
			callback (false, parsedData);
		}
		else {
			callback (err, data);
		}
	});
};

// Update data inside a file
lib.update = function (dir, fileName, data, callback) {
	// Open the file for writing
	fs.open (this.baseDir + dir + '/' + fileName + '.json', 'r+', function (err, fileDescriptor) {
		if (!err && fileDescriptor) {
			// Convert data to string
			var stringData = JSON.stringify (data);

			// Truncate the file
			fs.truncate (fileDescriptor, function (err) {
				if (!err) {
					// Write to file and close it
					fs.writeFile (fileDescriptor, stringData, function (err){
						if (!err) {
							fs.close (fileDescriptor, function (err){
								if (!err) {
									callback (false);
								}
								else {
									callback ('There was an error closing the file');
								}
							});
						}
						else {
							callback ('Error writing to existing file');
						}
					});
				}
				else {
					callback ('Could not truncate the file');
				}
			});
		}
		else {
			callback ('Could not open the file for updating, it may not exist yet');
		}
	});
};

// Delete a file
lib.delete = function (dir, fileName, callback){
	// Unlink the file
	fs.unlink (this.baseDir + dir + '/' + fileName + '.json', function (err){
		if (!err) {
			callback (false);
		}
		else {
			callback ('Could not unlink the file');
		}
	});
};
// Export the module
module.exports = lib;