var _ = require('underscore');
var resume = require('../Resume');
var fs = require('fs');

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
    ['github.com', function() {
      // TODO parse github page
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
    regularRules.profiles.push("(https?:\/\/(?:www\\.)?"+profile.replace('.', "\\.")+"[\/\\w \\.-]*)");
  });

  _.forEach(dictionary.inline, function(line) {
    regularRules.inline.push(line+":?[\\s]*(.*)");
  });

  return _.extend(dictionary, regularRules);
}

var regularRules = makeRegExpFromDictionary();

function parse(PreparedFile, cbReturnResume) {
  var rawFileData = PreparedFile.raw,
    Resume = new resume(),
    rules = regularRules,
    ruleExpression,
    isRuleFound,
    searchExpression = '',
    row,
    result,
    rows = rawFileData.split("\n");

  // save prepared file text (for debug)
  fs.writeFileSync('./parsed/'+PreparedFile.name + '.txt', rawFileData);

  var allTitles = _.flatten(_.toArray(rules.titles)).join('|');

  // 1 parse by regulars
  parseDictionaryRegular(rawFileData, Resume);
  // 2 parse by titles
  for (var i = 0; i < rows.length; i++) {
    row = rows[i];

    row = rows[i] = parseDictionaryProfiles(row, Resume);

    _.forEach(rules.titles, function(expressions, key) {
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
            result = new RegExp(searchExpression, 'gm').exec(restoreTextByRows(i, rows));

            if (result) {
              Resume.addKey(key, result[1]);
            }
          }
        });
      }
    });

  }

  if (_.isFunction(cbReturnResume)) {
    cbReturnResume(Resume);
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
 * @param row
 * @param Resume
 * @returns {*}
 */
function parseDictionaryProfiles(row, Resume) {
  var regularDictionary = dictionary.profiles,
    find,
    modifiedRow = row;

  _.forEach(regularDictionary, function(expression) {
    find = new RegExp(expression).exec(row);
    if (find) {
      Resume.addKey('profiles', find[0] + "\n");
      modifiedRow = row.replace(find[0], '');
    }
  });

  return modifiedRow;
}