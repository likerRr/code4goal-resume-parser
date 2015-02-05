var path = require('path');
/** @type {Command} */
var program = require('commander');
var SomeHR = require('./src/SomeHR')();

program
  .version('1.0.0')
  .option('-f, --file <file_name>', 'File to parse')
  .parse(process.argv);

var getFileNames = function(filePaths) {
  return filePaths.map(function(file) { return path.basename(file); }).join(', ');
};

var pack = __dirname + '/public';
SomeHR.iHaveCVPack(pack, function(err, files) {
  var Iam = this,
    ParseBoy;

  if (err) {
    return Iam.explainError(err);
  }
  if (!files.length) {
    return Iam.nothingToDo();
  }

	SomeHR.say('My stack for today are: ' + getFileNames(files));
  /** @type {ParseBoy} */
  ParseBoy = Iam.needSomeoneToSortCV();

  ParseBoy.willHelpWithPleasure(files, function(PreparedFile) {
    ParseBoy.say('I\'m working with "' + PreparedFile.name + '" now');
    ParseBoy.workingHardOn(PreparedFile, function(Resume) {

      ParseBoy.say('Here Resume for ' + PreparedFile.name + ':');
      //console.dir(Resume);
    });
  });
});