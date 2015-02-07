var Speakable = require('./Speakable');
var _ = require('underscore');
var path = require('path');
var processing = require('./libs/processing');
var parser = require('./libs/parser');

/**
 *
 * @constructor
 */
function ParseBoy() {
	Speakable.call(this);
  this.name = 'Parse Boy';
	this.color = 'green';
}

/**
 *
 * @param {Array} files
 * @param cbPreparedFile
 */
ParseBoy.prototype.willHelpWithPleasure = function(files, cbPreparedFile) {
  var type;

	this.say('Hi, i can help you with ' + files.map(function(file) {return path.basename(file);}).join(', '));
	_.forEach(files, function(file) {
    processing.run(file, function (PreparedFile) {
      if (_.isFunction(cbPreparedFile)) {
        cbPreparedFile(PreparedFile);
      } else {
        return console.error('cbPreparedFile should be a function');
      }
    }, type);
	});
};

/**
 *
 * @param PreparedFile
 * @param cbGetResume
 */
ParseBoy.prototype.workingHardOn = function(PreparedFile, cbGetResume) {
  parser.parse(PreparedFile, function(Resume) {
    if (_.isFunction(cbGetResume)) {
      cbGetResume(Resume);
    } else {
      console.error('cbGetResume should be a function');
    }
  });
};

/**
 *
 * @param PreparedFile
 * @param Resume
 * @param path
 * @param cbOnSaved
 */
ParseBoy.prototype.storeResume = function(PreparedFile, Resume, path, cbOnSaved) {
  PreparedFile.addResume(Resume);

  if (!_.isFunction(cbOnSaved)) {
    return console.error('cbOnSaved should be a function');
  }
  PreparedFile.saveResume(path, cbOnSaved);
};

/**
 *
 * @type {ParseBoy}
 */
module.exports = ParseBoy;