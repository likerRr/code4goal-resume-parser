# Resume parser
Solution for [Code4Goal - Coding Contest](http://app.crowdsourcehire.com/code4goal/)

Authored and maintained by Lizurchik Alexey, 2015

# The Problem

Often Companies have problems with sorting out large volumes of CVs / Resumes advertising for their job roles. In order to minimise their time in sorting out and have a benchmark way of comparing candidates, you've been tasked with the challenging task of assisting their problem.

# Contest

Develop a parser that is able to parse through CVs / Resumes in the word (.doc or .docx) / RTF / TXT / PDF / HTML format to extract the necessary information in a predefined JSON format. If the CVs / Resumes contain any social media profile links then the solution should also parse the public social profile web-pages and organize the data in JSON format (e.g. Linkedin public profile, Github, etc.)

# Solution

This Resume parser can run throught unlimited number of Resumes and get relevant info from that. With full-feature installation it supports most of the common use formats, provided by [textract](https://github.com/dbashford/textract):

 - HTML
 - PDF
 - DOC
 - RTF
 - DOCX
 - XLS
 - PPTX
 - DXF
 - PNG
 - JPG
 - GIF
 - application/javascript
 - All text/* mime-types.

# Pre-Requirements
Current solution tested on Windows 7 x64 Maximum (with [babun shell](http://babun.github.io/)), but it also may run on OSX, Linux. Application is hard dependend on text extracting library [textract](https://github.com/dbashford/textract).

# Fast install

Project is nodejs cli application with some dependencies. If you already have installed copy of nodejs, you can just clone this repo and run `npm install`:

	git clone git@github.com:likerRr/code4goal-resume-parser.git
	npm install
	
# Step-by-step fresh installation

 - First, go to [nodejs](http://nodejs.org/) site, download and setup it for you platform
 - Then, clone this repo `git clone git@github.com:likerRr/code4goal-resume-parser.git`
 - Run `npm install` in terminal from root folder of project to setup dependencies
 - At this moment application will work fine, but! By default it supports only `.TXT` and `.HTML` text formats. For better performance you should install at least support of `.PDF` (and `.DOC`). Here is instructions, how to do it from [textract README](https://github.com/dbashford/textract#requirements) file:
	 - `PDF` extraction requires `pdftotext` be installed, [link](http://www.foolabs.com/xpdf/download.html)
	 - `DOC` extraction requires `catdoc` be installed, [link](http://www.wagner.pp.ru/~vitus/software/catdoc/), unless on OSX in which case textutil (installed by default) is used.
	 - `DOCX` extraction requires `unzip` be available (e.g. `sudo apt-get install unzip` for Ubuntu)
		
> Please, note, that it's not necessary install support of all formats but preferably. As for me, I didn't get setup `catdoc` for `.DOC` files under Windows 7, so I played only with `.TXT`, `.HTML`, `.PDF` formats, but I know, it will also work with the rest formats :)

# Run

When you finish installation it's time to run application. Just put some Resume files to `/public` (it already has 3 for tests) directory and run in terminal `node app.js` from project's root. Then you can access JSONed results in `/compiled` folder (all file there will represent JSON string of parsed data.

Execution presents as dialog between `HR manager`, that has a lot of Resume to work with, and `ParseBoy`, who volunteered to help with it, i thought that it should have some fun. 

# How it works

Base principle on how parser works, based on dictionary of rules of how to handle Resume file. So we have `/src/dictionary.js` file, where all rules places. It represents javascript object with the following structure:

	{
		titles: {},
		profiles: [],
		inline: {},
		regular: {}
	}

All of these keys `titles`, `profiles`, `inline`, `regular` are converted to regular expressions, that handled by specific conditions:

 - `titles` - fires on each row of file. If string matches title, so it will capture all text between current title and next title except current. For example we have such dictionary file:
	 
		{
			 titles: {
			   // values are the signs of the key that possibly may appears in the Resume
				 objective: ['objective', 'objectives'],
				 summary: ['summary'],
			 }
		}
	
	And next Resume text is:
	
> OBJECTIVE
>
> Seeking a challenging position to use my software Web development and process optimization skills.
>
> SUMMARY
>
> I worked on a wide range of products including building advanced dynamic multi language web sites, internal and external API's, well as creating new internal workflows.

If we now run application it will go through next Application Loop (AL):
    
- Remove unnecessary Resume file from any \n\r\t and trim all lines
- Compile rules to regular expressions
- Split file into lines, delimited by \n
- Check each line for a match for each title rules
- When match found, parse text between current title and next title into `titles` or until EOF
- Save parsed text (if found) under title key (`objective` or (and) `summary`)
    
So, according to this loop in the end we will have following JSON file:

	{
		objective: 'Seeking a challenging position to use my software Web development and process optimization skills.'
		summary: 'I worked on a wide range of products including building advanced dynamic multi language web sites, internal and external API's, well as creating new internal workflows.'
	}


- `profiles` - fires on each row of file. If profile rule represent an array, so first key will be the name of key and second key will be an handler. If profile rule just a string, parser will try to found matched url without parsing it. Example:

      profiles: [
        ['github.com', function(url, Resume, profilesWatcher) {
          download(url, function(data, err) {
            if (data) {
              var $ = cheerio.load(data),
                fullName = $('.vcard-fullname').text(),
                location = $('.octicon-location').parent().text(),
                mail = $('.octicon-mail').parent().text(),
                link = $('.octicon-link').parent().text(),
                clock = $('.octicon-clock').parent().text(),
                company = $('.octicon-organization').parent().text();

              Resume.addObject('github', {
                name: fullName,
                location: location,
                email: mail,
                link: link,
                joined: clock,
                company: company
              });
            } else {
              return console.log(err);
            }
            //profilesInProgress--;
            profilesWatcher.inProgress--;
          });
        }],
        'stackoverflow.com'
      ],
    
It looks quite a big, but very flexible.

So here we can see, that profiles contains two rules: `github.com` with callback and `stackoverflow.com`. When profile rule enters Application Loop (AL) and it has valid callback, so it will try to request profile page from Internet and parse data on requested page, according to rules in callback. Then it places all data into `Resume` object under the represented key (`github` in out case). If rule is just a string and it meets match in AL row, so it simple puts profile link to `profile` key in `Resume` object.

- `inline` - fires on each row of file. It converts to regular expression, that matches all data after that:

`expr+":?[\\s]*(.*)"`

Example:

    inline: {
      skype: 'skype'
    },
    
Text:

> skype: sweet-liker

Result will be `skype` key with `sweet-liker` value in `Resume` object. So it can be extended with simple lines of data, e.g. `address` or `first name` or whatever.

> Note, that these rules are unreliable, cause can touch sensitive data from context, e.g. "I don't have a skype, but I have IM". After parsing that string data in `Resume` will be as key `skype` and value `but I have IM`. So use on your own risk.

- `regular` - fires on full data of file. It just search the first matches by regular expression, e.g:

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

Will try find `name`, `email`, `phone` by expression sign.

# Generic format
This solution hasn't generic output format of JSON string, cause it filled if rule in dictionary match the condition. So, the full possible data, that may be extracted from Resume may have such format:

    {
      objective: '',
      summary: '',
      technology: '',
      experience: '',
      education: '',
      skills: '',
      languages: '',
      cources: '',
      projects: '',
      links: '',
      contacts: '',
      positions: '',
      profiles: '',
      awards: '',
      honors: '',
      additional: '',
      certification: '',
      interests: '',
      github: {
        name: '',
        location: '',
        email: '',
        link: '',
        joined: '',
        company: ''
      },
      linkedin: {
        summary: '',
        name: '',
        positions: [],
        languages: [],
        skills: [],
        educations: [],
        volunteering: [],
        volunteeringOpportunities: []
      },
      skype: '',
      name: '',
      email: '',
      phone: ''
    }

# Extending
All 'action' are by building `dictionary.js` file. For now it has only basics rules, that I met while develop this solution, but it's very flexible (although a bit complicated) and extensible. Just put your rule according to existing and following main principles and enjoy!

# Vocabulary
- `Resume` object is a place, where all parsed data saves. After parsing whole document it will stringify to JSON and save on into `/compile` folder.
- AL - Application Loop:
    - Remove unnecessary Resume file from any \n\r\t and trim all lines
    - Compile rules to regular expressions (under hood)
    - Split file into lines, delimited by \n
    - Check each line for a match for each title rules
    - When match found, parse text between current title and next title into `titles` or until EOF
    - Save parsed text (if found) under title key (`objective` or (and) `summary`)
    
# Technologies / References
Application built on javascript with [nodejs 0.10.31](http://nodejs.org/) under Windows 7 x64
This [application on github](https://github.com/likerRr/code4goal-resume-parser)

Dependencies are:
- [cheerio](https://github.com/cheeriojs/cheerio)
- [colors](https://github.com/Marak/colors.js)
- [mime](https://github.com/broofa/node-mime)
- [request](https://github.com/request/request)
- [textract](https://github.com/dbashford/textract)
- [underscore](https://github.com/jashkenas/underscore)
    
# In action
![In action](/docs/result.png?raw=true "In action")