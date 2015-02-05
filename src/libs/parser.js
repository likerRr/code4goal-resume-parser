var _ = require('underscore');
var resume = require('../Resume');
var fs = require('fs');
var http = require("http");
var cheerio = require("cheerio");
var request = require("request");

var profilesInProgress = 0;


function download(url, callback) {
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(body);
    } else {
      callback(error)
    }
  });
}

module.exports = {
  parse: parse
};

var dictionary = {
  titles: {
    objective: ['objective', 'objectives'],
    summary: ['summary'],
    //technology: ['technology', 'technologies'],
    experience: ['experience'],
    education: ['education'],
    skills: ['skills', 'Skills & Expertise', 'technology', 'technologies'],
    languages: ['languages'],
    courses: ['courses'],
    projects: ['projects'],
    links: ['links'],
    contacts: ['contacts'],
    positions: ['positions', 'position'],
    profiles: ['profiles', 'social connect', 'social-profiles', 'social profiles'],
    awards: ['awards'],
    honors: ['honors'],
    additional: ['additional'],
    certification: ['certification', 'certifications'],
    interests: ['interests']
  },
  profiles: [
    ['github.com', function(url, Resume) {
      // TODO parse github page
      download(url, function(data) {
        if (data) {
          var $ = cheerio.load(data);
          console.log($('.vcard-fullname').text());
          console.log($('.octicon-location').parent().text());
          console.log($('.octicon-mail').parent().text());
          console.log($('.octicon-link').parent().text());
          console.log($('.octicon-clock').parent().text());
          Resume.addKey('company', $('.octicon-organization').parent().text());
          console.log("done");
        } else {
          console.log(data);
        }
        profilesInProgress--;
      });

    }],
    'linkedin.com',
    'facebook.com',
    'bitbucket.org',
    'stackoverflow.com'
  ],
  // TODO
  inline: [
    'address',
    //'phone',
    'skype'
  ],
  regular: {
    name: [
      /([A-Z][a-z]*)(\s[A-Z][a-z]*)/
    ],
    email: [
      /([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})/
    ],
    phone: [
      /((?:\+?\d{1,3}[\s-])?\(?\d{2,3}\)?[\s.-]?\d{3}[\s.-]\d{4,5})/
    ]
  }
};

function makeRegExpFromDictionary() {
  var regularRules = {
    titles: {},
    profiles: [],
    inline: []
  };

  _.forEach(dictionary.titles, function(titles, key) {
    regularRules.titles[key] = [];
    _.forEach(titles, function(title) {
      regularRules.titles[key].push(title.toUpperCase());
      regularRules.titles[key].push(title[0].toUpperCase() + title.substr(1, title.length));
    });
  });

  _.forEach(dictionary.profiles, function(profile) {
    var profileHandler,
      profileExpr;

    if (_.isArray(profile)) {
      if (_.isFunction(profile[1])) {
        profileHandler = profile[1];
      }
      profile = profile[0];
    }
    profileExpr = "(https?:\/\/(?:www\\.)?"+profile.replace('.', "\\.")+"[\/\\w \\.-]*)";
    if (_.isFunction(profileHandler)) {
      regularRules.profiles.push([profileExpr, profileHandler]);
    } else {
      regularRules.profiles.push(profileExpr);
    }
  });

  _.forEach(dictionary.inline, function(line) {
    regularRules.inline.push(line+":?[\\s]*(.*)");
  });

  return _.extend(dictionary, regularRules);
}

// dictionary is object, so it will be extended by referrence
makeRegExpFromDictionary();

function parse(PreparedFile, cbReturnResume) {
  var rawFileData = PreparedFile.raw,
    Resume = new resume(),
    rows = rawFileData.split("\n"),
    row;

  // save prepared file text (for debug)
  fs.writeFileSync('./parsed/'+PreparedFile.name + '.txt', rawFileData);

  // 1 parse regulars
  parseDictionaryRegular(rawFileData, Resume);

  for (var i = 0; i < rows.length; i++) {
    row = rows[i];

    // 2 parse profiles
    row = rows[i] = parseDictionaryProfiles(row, Resume);
    // 3 parse titles
    parseDictionaryTitles(Resume, rows, i);
  }

  if (_.isFunction(cbReturnResume)) {
    // wait until download and handle internet profile
    var checkTimer = setInterval(function() {
      if (profilesInProgress === 0) {
        cbReturnResume(Resume);
        clearInterval(checkTimer);
      }
    }, 200);
  } else {
    return console.error('cbReturnResume should be a function');
  }
}

/**
 * Make text from @rowNum index of @allRows to the end of @allRows
 * @param rowNum
 * @param allRows
 * @returns {string}
 */
function restoreTextByRows(rowNum, allRows) {
  rowNum = rowNum - 1;
  var rows = [];

  do {
    rows.push(allRows[rowNum]);
    rowNum++;
  } while(rowNum < allRows.length);

  return rows.join("\n");
}

/**
 * Count words in string
 * @param str
 * @returns {Number}
 */
function countWords(str) {
  return str.split(' ').length;
}

/**
 *
 * @param data
 * @param Resume
 */
function parseDictionaryRegular(data, Resume) {
  var regularDictionary = dictionary.regular,
    find;

  _.forEach(regularDictionary, function(expressions, key) {
    _.forEach(expressions, function(expression) {
      find = new RegExp(expression).exec(data);
      if (find) {
        Resume.addKey(key.toLowerCase(), find[0]);
      }
    });
  });
}

/**
 *
 * @param Resume
 * @param rows
 * @param rowIdx
 */
function parseDictionaryTitles(Resume, rows, rowIdx) {
  var allTitles = _.flatten(_.toArray(dictionary.titles)).join('|'),
    searchExpression = '',
    row = rows[rowIdx],
    ruleExpression,
    isRuleFound,
    result;

  _.forEach(dictionary.titles, function(expressions, key) {
    expressions = expressions || [];
    // means, that titled row is less than 5 words
    if (countWords(row) <= 5) {
      _.forEach(expressions, function(expression) {
        ruleExpression = new RegExp(expression);
        isRuleFound = ruleExpression.test(row);

        if (isRuleFound) {
          allTitles = _.without(allTitles.split('|'), key).join('|');
          searchExpression = '(?:' + expression + ')((.*\n)+?)(?:'+allTitles+'|{end})';
          // restore remaining text to search in relevant part of text
          result = new RegExp(searchExpression, 'gm').exec(restoreTextByRows(rowIdx, rows));

          if (result) {
            Resume.addKey(key, result[1]);
          }
        }
      });
    }
  });
}

/**
 *
 * @param row
 * @param Resume
 * @returns {*}
 */
function parseDictionaryProfiles(row, Resume) {
  var regularDictionary = dictionary.profiles,
    find,
    modifiedRow = row;

  _.forEach(regularDictionary, function(expression) {
    var expressionHandler;

    if (_.isArray(expression)) {
      if (_.isFunction(expression[1])) {
        expressionHandler = expression[1];
      }
      expression = expression[0];
    }
    find = new RegExp(expression).exec(row);
    if (find) {
      Resume.addKey('profiles', find[0] + "\n");
      modifiedRow = row.replace(find[0], '');
      if (_.isFunction(expressionHandler)) {
        profilesInProgress++;
        expressionHandler(find[0], Resume);
      }
    }
  });

  return modifiedRow;
}