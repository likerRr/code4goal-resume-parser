var _ = require('underscore');

module.exports = function() {
  return new Resume();
};

function Resume() {
  // generic resume format
  this.parts = {};
}

Resume.prototype.addKey = function(key, value) {
  if (_.has(this.parts, key)) {
    value = this.parts[key] + value;
  }

  this.parts[key] = value;
};

