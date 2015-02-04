var fs = require('fs');
var _ = require('underscore');
var ParseBoy = require('./ParseBoy');
var Speakable = require('./Speakable');

/**
 *
 * @constructor
 */
function SomeHR() {
	Speakable.call(this);
  this.name = 'HR manager';
  this.color = 'magenta';
}

/**
 *
 * @param path
 * @param cbAcceptedFiles
 */
SomeHR.prototype.iHaveCVPack = function(path, cbAcceptedFiles) {
  var self = this;

  if (!_.isFunction(cbAcceptedFiles)) {
    return console.error('cbAcceptedFiles should be a function');
  }

	if (!fs.existsSync(path)) {
		return cbAcceptedFiles.call(this, 'no one wants to work with us :(');
	}
  fs.readdir(path, function(err, files) {
    files = files.map(function(file) {
      return path + '/' + file;
    });
    cbAcceptedFiles.call(self, err, files);
  });
};

/**
 *
 * @returns {string}
 */
SomeHR.prototype.nothingToDo = function() {
  return this.say('I haven\'t work! Should I have a date today?');
};

/**
 *
 * @returns {ParseBoy}
 */
SomeHR.prototype.needSomeoneToSortCV = function() {
  return new ParseBoy();
};

/**
 *
 * @type {SomeHR}
 */
module.exports = function() {
  return new SomeHR();
};