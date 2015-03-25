/**
 * User: unotseeme@foxmail.com
 * Date: 11/20/11
 * Time: 6:39 PM
 */

var Tester = require('../RestTester.js');
var validate = require('lang').validate;
var util = require('util');
var assert = require('assert');
var fs = require('fs');
//var colors = require('colors');


function main(argv, argn) {
    var opts = require('optimist')(argv)
        .usage("Usage: $0 [options] case_files")
        .options('suffix', {
            alias: "s",
            describe: "the cases file's suffix, it will work when '--basedir' specified",
            'default': 'case.js',
            string: true
        }).options('colors', {
            alias: "m",
            describe: "colors mode (broswer or conosle)",
            'default': 'console',
            string: true
        }).options('basedir', {
            alias: "d",
            describe: "the cases files parent's directory",
            string: true
        }).options('custom', {
            alias: "c",
            describe: "remove all default after match & assert"
        }).options('config', {
            alias: "f",
            describe: "server configuration file(js/json), if give json ,then will test a server not start by the tester."
        }).options('host', {
            alias: "h",
            describe: "host to testing, if exist config option, will overwrite the host field of the file(default: 'localhost')"
        }).options('port', {
            alias: "p",
            describe: "port to testing, will overwrite option 'config' setting (default: 5555)"
        }).options('timeout', {
            alias: "t",
            describe: "set timeout to the request, will overwrite option 'config' setting (default: 500)"
        }).options('help', {
            alias: "H",
            describe: "print help info"
        }).options('verbose', {
            alias: "v",
            describe: "verbose output"
        }).boolean(['verbose','v','custom','c','help','H']).wrap(120);
    argv = opts.argv;
    var files = [];
    if (argv.help) {
        opts.showHelp();
        process.exit(0);
    }
    if (argv.colors){
        var enhance = require("../vendor/colors.js");
        enhance(argv.colors);
    }
    var logger = {
        info: function(msg) {
            console.log(util.format("[%s] %s", "info".blue, msg))
        },
        warn: function(msg) {
            console.log(util.format("[%s] %s", "info".yellow, msg))
        },
        error: function(msg) {
            console.log(util.format("[%s] %s", "info".red, msg))
        },
        ok: function(msg) {
            console.log(util.format("[%s] %s", "ok".green, msg))
        },
        fail: function(msg) {
            console.log(util.format("[%s] %s", "ok".red, msg))
        }
    };

    /**
     * find *.case.js file
     * @param callback function(files))
     */
    function initFiles(callback) {
        if (!argv.basedir) {
            files = argv._;
            callback(files);
        } else {//get files from basedir with suffix...
            var rex = new RegExp('.*\\.' + argv.suffix.replace(/\./, "\\.") + '$');
            logger.info(util.format("find files[%s] under directory[%s]...",
                rex.toString().cyan, argv.basedir.cyan));
            var finder = require('findit').find(argv.basedir);
            finder.on("file", function(file) {
                if (!rex.test(file)) return;
                logger.info(util.format("found case file[%s]", file.cyan));
                files.push(file);
            });
            finder.on("end", function() {
                setTimeout(function() {
                    callback(files);
                }, 100);
            })
        }
    }

    /**
     * read json data from file
     * @param file
     * @returns {*}
     */
    function fileToJson(file) {
        var cases;
        var fn = file.replace(/^\./, process.env.PWD);
        try {
            if (fn.match(/.*\.json$/)) {
                cases = JSON.parse(fs.readFileSync(fn, 'utf8').toString());
            } else if (file.match(/.*\.js/)) {
                cases = require(fn);
            } else {//todo user can set this by argv
                cases = JSON.parse(fs.readFileSync(fn, 'utf8').toString());
            }
        } catch(e) {
            logger.warn(util.format("load file[%s] to json fail(%s)", fn.cyan, e.message.red));
            return null;
        }
        return cases;
    }

    /**
     * run the test by case file
     * @param files
     */
    function run(files) {
        var fi = 0;
        var report = {
            success: 0,
            fail: 0,
            total: 0
        };

        var context = argv.config ? fileToJson(argv.config) : {};
        context = {
            server: context.server || null,
            host: argv.host || context.host || "localhost",
            port: argv.port || context.port || 5555,
            timeout: argv.timeout || context.timeout || 500,
            encoding: argv.encoding || context.encoding || "utf8"
        };
        if (context) { // setup test config...
            logger.info(util.format("config://%s:%s?timeout=%s&encoding=%s&config=%s",
                context.host.cyan, context.port.toString().cyan,
                context.timeout.toString().cyan, context.encoding.cyan, (argv.config || "").cyan));
        } else {
            logger.error("there no config information in file[" + argv.config + "], set by --config -f")
        }

        var runTest = function () {
            var callee = arguments.callee;
            if (fi >= files.length) {
                outputReport(report);
                process.exit(report.fail);
            }
            var file = files[fi++];
            var cases = fileToJson(file);
            if (!cases) return callee();
            // start to test....
            var tester = new Tester(cases, context);
            tester.onAfter(function(next, title, _case) {
                assert.ok(validate.omatch(_case.actual, _case.expect), "actual.body do not match the expect.body");
                next();
            });
            tester.onTeardown(function(next, title, _case) {
                var estr = (_case.error && _case.error.message) || "";
                report.total += 1;
                if (_case.result) {
                    report.success += 1;
                } else {
                    report.fail += 1;
                }
                console.log(util.format("[%s] [%s][%s][%s]"),
                    (_case.result ? "ok".green : "fail".red),
                    file.yellow, title.yellow, estr.red);
                next();
            });
            tester.run(cases, function(error, cases) {
//            updateReport(report, cases);
                callee();
            });
        };

        runTest();
    }

    /**
     * output the test report
     * @param report
     */
    function outputReport(report) {
        function s(n) {
            return n.toString();
        }

        console.log(util.format('[%s] total[%s], ok:[%s], fail[%s]',
            "report".green,
            s(report.total),
            s(report.success).green,
            s(report.fail).red))
    }

    initFiles(run);
}

module.exports = {
    main: main
};
// running scripting
