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

var fs = require('fs')
  , program = require('commander')
  , cheerio = require('cheerio')
  , rest = require('restler')
  , HTMLFILE_DEFAULT = 'index.html'
  , CHECKSFILE_DEFAULT = 'checks.json';

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if ( ! fs.existsSync(instr)) {
    console.log('%s does not exist. Exiting.', instr);
    process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
  }
  return instr;
};




var Check = function(){
  function run_checks(html, checksfile) {
    var $ = cheerio.load(html);
    var checks = JSON.parse(fs.readFileSync(checksfile)).sort();
    var out = {};
    for (var ii in checks) {
      var present = $(checks[ii]).length > 0;
      out[checks[ii]] = present;
    }
    return out;
  }

  function write_output(output_json) {
    var outJson = JSON.stringify(output_json, null, 4);
    console.log(outJson);
  }

  return {
    html_file: function(file, checksfile, output_cb){
      output_cb = output_cb || write_output;

      var results = run_checks(fs.readFileSync(file), checksfile);
      output_cb(results);
    },
    url: function(url, checksfile, output_cb) {
      output_cb = output_cb || write_output;

      rest.get(url).on('complete', function(res){
        if (res instanceof Error) {
          console.error('Error: ' + res.message);
        } else {
          var results = run_checks(res, checksfile);
          output_cb(results);
        }
      });
    }
  };
};




if (require.main === module) {
  program
    .option('-c, --checks <val>', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
    .option('-f, --file <val>', 'Path to index.html', assertFileExists, HTMLFILE_DEFAULT)
    .option('-u, --url <val>', 'please enter a URL')
    .parse(process.argv);

  var check = new Check();
  if (program.url) {
    check.url(program.url, program.checks);
  } else if (program.file) {
    check.html_file(program.file, program.checks);
  }
} else {
  module.exports = new Check();
}