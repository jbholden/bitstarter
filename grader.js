#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var buildfn = function(filename) {
	console.log("buildfn filename=" + filename);
    var response2file = function(result, response) {
            console.error("inside response2file")
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            console.error("Wrote %s", filename);
            fs.writeFileSync(filename, result);
        }
    };
    return response2file;
};

var buildfn_old = function(csvfile, headers) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            console.error("Wrote %s", csvfile);
            fs.writeFileSync(csvfile, result);
            //csv2console(csvfile, headers);
        }
    };
    return response2console;
};

var buildfn3 = function(file_to_check,checks_file) {
	var urlrequestdone = function(result, response) {
		console.error("inside response2file")
		if (result instanceof Error) {
			console.error('Error:');
		} else {
			fs.writeFileSync(file_to_check, result);
    			var checkJson = checkHtmlFile(file_to_check, checks_file);
    			var outJson = JSON.stringify(checkJson, null, 4);
    			console.log(outJson);
		}
	};
	return urlrequestdone;
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <address>', 'URL of file to run') 
        .parse(process.argv);
    var file_to_check = program.file
    if (program.url != undefined) { 
	file_to_check = "urlfile.txt";
	urlrequestdone = buildfn3(file_to_check,program.checks);
	rest.get(program.url).on('complete',urlrequestdone);
    } else {
    	var checkJson = checkHtmlFile(file_to_check, program.checks);
    	var outJson = JSON.stringify(checkJson, null, 4);
    	console.log(outJson);
	}
} else {
    exports.checkHtmlFile = checkHtmlFile;
}