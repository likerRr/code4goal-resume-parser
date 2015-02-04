var util = require('util');
require('colors');

var currentSpeaker;

/**
 *
 * @constructor
 */
function Speakable() {
	var self = this;
	this.name = 'UFO';
	this.color = 'red';

	this.speaker = function() {
		if (!this.name) {
			return '';
		} else {
			return this.name + ': ';
		}
	};

	this.say = function(phrase) {
		return util.print(coloredOutput(this.getSpeakerOutput() + '- ' + phrase + "\n"));
	};

	this.explainError = function(err) {
		return util.print(coloredOutput(this.getSpeakerOutput() + '- Sorry, but ' + err + "\n"));
	};

  this.getSpeakerOutput = function() {
    var showName = (currentSpeaker != this.name);

    currentSpeaker = this.name;

    return showName ? this.speaker() + '\n' : '';
  };

	function coloredOutput(output) {
		return (output)[self.color];
	}
}

/**
 *
 * @type {Speakable}
 */
module.exports = Speakable;