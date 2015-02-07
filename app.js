var path = require('path');
var SomeHR = require('./src/SomeHR')();
require('colors');

console.log('Please, wait 2 sec to skip warnings'.bgRed.black);
setTimeout(main, 2000);

function main() {
  console.log('------------------------------------------------------------------------------------'.bgBlue.blue);
  console.log('                           Somewhere in big & cool company...                       '.bgBlue.gray);
  console.log('------------------------------------------------------------------------------------'.bgBlue.blue);
  console.log('');
  var getFileNames = function (filePaths) {
    return filePaths.map(function (file) {
      return path.basename(file);
    }).join(', ');
  };

  var pack = __dirname + '/public';
  SomeHR.iHaveCVPack(pack, function (err, files) {
    var Iam = this,
      ParseBoy,
      savedFiles = 0;

    if (err) {
      return Iam.explainError(err);
    }
    if (!files.length) {
      return Iam.nothingToDo();
    }

    SomeHR.say('My stack for today are: ' + getFileNames(files));
    /** @type {ParseBoy} */
    ParseBoy = Iam.needSomeoneToSortCV();

    ParseBoy.willHelpWithPleasure(files, function (PreparedFile) {
      ParseBoy.say('I\'m working with "' + PreparedFile.name + '" now');
      ParseBoy.workingHardOn(PreparedFile, function (Resume) {
        ParseBoy.say('I got Resume for ' + PreparedFile.name + ', now saving...');
        ParseBoy.storeResume(PreparedFile, Resume, __dirname + '/compiled', function (err) {
          if (err) {
            return ParseBoy.explainError(err);
          }

          ParseBoy.say('Resume ' + PreparedFile.name + ' saved');
          savedFiles += 1;

          if (savedFiles == files.length) {
            ParseBoy.say('I finished! Please, check "/compile" folder where you can find each parsed profile in JSON');
            SomeHR.say('Thank you a lot! I can\'t even imagine, what would I do without your help, ParseBoy!');
            ParseBoy.say('You are welcome, have a nice day!');

            console.log('');
            console.log('------------------------------------------------------------------------------------'.bgBlue.blue);
            console.log('                                        The End!                                    '.bgBlue.gray);
            console.log('------------------------------------------------------------------------------------'.bgBlue.blue);
          }
        })
      });
    });
  });
}