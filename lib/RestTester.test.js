/**
 * Created by IDE.
 * User: gzhang
 * Date: 11/7/11
 * Time: 7:16 PM
 * To change this template use File | Settings | File Templates.
 */


// create a test server
require('colors');
var RestTester = require('./RestTester.js');
var testServer = require('./server.mock.js')();
var util = require('util'), assert = require('assert');
var validate = require('lang').validate;
var lint = require('lang').lint;

var cases = {
    "test get": {
        input: {
            method: "GET",
            path:"/api/for/test/get",
            headers: {
                "content-type": "application/json"
            }
        },
        expect: {
            statusCode: 200,
            body:{
                id: 1,
                name: "inotseeyou",
                email: "inotseeyou@gmail.com",
                headers: {
                    "content-type": "application/json"
                }
            },
            headers:{
                "content-type": "application/json; charset=utf-8"
            }
        },
        errorMessage: "api for test get",
        setup: function(next, title, cs) {
            console.log("[i-setup]: function defined in context");
            next();
        },
            teardown: function(next, title, cs) {
            console.log("[i-teardown]: function defined in context");
            next();
        },
        before: function(next, title, cs) {
            console.log("[i-before]: function defined in context");
            next();
        },
        after: function(next, title, cs) {
            console.log("[i-after]: function defined in context");
            next();
        }
    },
    "test post": {
        input: {
            method: "POST",
            path:"/api/for/test/post",
            headers: {
                "content-type": "application/json; charset=utf-8"
            },
            body:{
                abc: 1,
                str: "str"
            }
        },
        expect: {
            statusCode: 200,
            body:{
                abc: 1,
                str: "str"
            },
            headers:{
            }
        },
        errorMessage: "api for test get"
    },
    "test timeout": {
        input: {
            method: "GET",
            path: "/api/for/test/timeout"
        },
        expect: {
        }

    }
};

var tester = new RestTester(cases, {
    server: testServer,
    port: 5555,
    timeout: 500
}, function(errors, cases) {
    process.exit(1);
});

tester.onInit(function(cases, next) {
    console.log('[init]: init function');
    next();
});

tester.onInit(function(cases, next) {
    console.log('[init]: init function2');
    next();
});

tester.onSetup(function(title, _case, next) {
    console.log('[serial setup]: ' + title);
    next();
});

tester.onBefore(function(title, _case, next) {
    console.log("[serial before][1]: " + title);
    next();
});
tester.onBefore(function(title, _case, next) {
    console.log("[serial before][2]: " + title);
    next();
});

tester.onAfter(function(title, _case, next) {
    console.log("[serial after][1]: " + title);
//  throw new Error("error");
    next();
});
tester.onAfter(function(title, _case, next) {
    console.log("[serial after][2]: " + title);
    next();
});

tester.onClose(function(cases, next) {
    console.log("[serial close]");
    next();
});

tester.on(RestTester.E.INIT, function(err, cases) {
    console.log("[init]: cases".yellow);
});

tester.on(RestTester.E.SETUP, function(err, title, cs) {
    console.log("[setup]: ".blue + title);
});

tester.on(RestTester.E.TESTING, function(err, title, cs) {
    console.log("[title@testing]: " + title);
    console.log("[err@testing]: ".red + err);
});

tester.on(RestTester.E.BEFORE, function(err, title, cs) {
    console.log("[before]: ".cyan + title);
});

tester.on(RestTester.E.AFTER, function(errs, title, cs) {
    console.log("[after]: ".cyan + title + " - " + errs.length + " error");
});

tester.on(RestTester.E.TEARDOWN, function(err, title, cs) {
    console.log("[teardown]: ".blue + title);
});

tester.on(RestTester.E.PRECLOSE, function(errs, cases) {
    console.log("[preclose]: " + errs.length + " error");
});

tester.on(RestTester.E.CLOSE, function(errs, cases) {
    console.log(("[close]: " + errs.length + " error").yellow);
});

module.exports = {
    "one test" : function() {
        var res = [];
        var ores = {};
        var expect = [ 'init/[object Object]?arguments=[[object Function],[object Object]]',
            'setup/test get?arguments=[[object Function],[object String],[object Object]]',
            'setup/test get?arguments=[[object Function],[object String],[object Object]]',
            'before/test get?arguments=[[object Function],[object String],[object Object]]',
            'after/test get?arguments=[[object Function],[object String],[object Object]]',
            'after/test get?arguments=[[object Function],[object String],[object Object]]',
            'after/test get?arguments=[[object Function],[object String],[object Object]]',
            'teardown/test get?arguments=[[object Function],[object String],[object Object]]',
            'setup/test post?arguments=[[object Function],[object String],[object Object]]',
            'setup/test post?arguments=[[object Function],[object String],[object Object]]',
            'before/test post?arguments=[[object Function],[object String],[object Object]]',
            'after/test post?arguments=[[object Function],[object String],[object Object]]',
            'after/test post?arguments=[[object Function],[object String],[object Object]]',
            'after/test post?arguments=[[object Function],[object String],[object Object]]',
            'teardown/test post?arguments=[[object Function],[object String],[object Object]]',
            'setup/test timeout?arguments=[[object Function],[object String],[object Object]]',
            'setup/test timeout?arguments=[[object Function],[object String],[object Object]]',
            'before/test timeout?arguments=[[object Function],[object String],[object Object]]',
            'teardown/test timeout?arguments=[[object Function],[object String],[object Object]]',
            'close/[object Object]?arguments=[[object Function],[object Object]]',
            'close/[object Object]?arguments=[[object Function],[object Object]]',
            'close/[object Object]?arguments=[[object Function],[object Object]]' ];
        var oexpect = { r_init: [ 'r_init/[object Object]?arguments=[[object Undefined],[object Object]]' ],
            r_setup:
            [ 'r_setup/test get?arguments=[[object Undefined],[object String],[object Object]]',
                'r_setup/test post?arguments=[[object Undefined],[object String],[object Object]]',
                'r_setup/test timeout?arguments=[[object Undefined],[object String],[object Object]]' ],
            r_before:
            [ 'r_before/test get?arguments=[[object Undefined],[object String],[object Object]]',
                'r_before/test post?arguments=[[object Undefined],[object String],[object Object]]',
                'r_before/test timeout?arguments=[[object Undefined],[object String],[object Object]]' ],
            r_after:
            [ 'r_after/test get?arguments=[[object Array],[object String],[object Object]]',
                'r_after/test post?arguments=[[object Array],[object String],[object Object]]' ],
            r_teardown:
            [ 'r_teardown/test get?arguments=[[object Array],[object String],[object Object]]',
                'r_teardown/test post?arguments=[[object Array],[object String],[object Object]]',
                'r_teardown/test timeout?arguments=[[object Array],[object String],[object Object]]' ],
            r_close: [ 'r_close/[object Object]?arguments=[[object Array],[object Object]]' ],
            r_testing: [
                'r_testing/test get?arguments=[[object Null],[object String],[object Object]]',
                'r_testing/test post?arguments=[[object Null],[object String],[object Object]]',
                'r_testing/test timeout?arguments=[[object Error],[object String],[object Object]]'
            ]
        };

        var tester = new RestTester(cases, {
            server: testServer,
            port: 5555,
            timeout: 500
        }, function(errors, cases) {
            assert.deepEqual(0, errors.length);
            assert.deepEqual(expect, res);
            for(var k in oexpect){
                assert.deepEqual(oexpect[k], ores[k], util.format("%s in oexpect no equal...".red, k));
            }

        });

        function gen(period) {
            return function(next, title) {
                var ats = [];
                for (var i = arguments.length; i --;) {
                    ats.unshift(Object.prototype.toString.apply(arguments[i]));
                }
                res.push(util.format("%s/%s?arguments=[%s]", period, title, ats.toString()));
                next();
            }
        }

        function listen(msg) {
            return function(errs, title) {
                var ats = [];
                ores[msg] = ores[msg] ? ores[msg] : [];
                for (var i = arguments.length; i --;) {
                    ats.unshift(Object.prototype.toString.apply(arguments[i]));
                }
                ores[msg].push(util.format("%s/%s?arguments=[%s]", msg, title, ats.toString()));
            }
        }


        tester.onSetup(gen("setup"));
        tester.onSetup(gen("setup"));
        tester.onBefore(gen("before"));
        tester.onAfter(gen("after"));
        tester.onAfter(gen("after"));
        tester.onAfter(gen("after"));
        tester.onTeardown(gen("teardown"));
        tester.onInit(gen('init'));
        tester.onClose(gen('close'));
        tester.onClose(gen('close'));
        tester.onClose(gen('close'));

        function attach(msg) {
            tester.on(msg, listen(msg));
        }

        attach(RestTester.E.INIT);
        attach(RestTester.E.SETUP);
        attach(RestTester.E.BEFORE);
        attach(RestTester.E.AFTER);
        attach(RestTester.E.TEARDOWN);
        attach(RestTester.E.CLOSE);
        attach(RestTester.E.TESTING);

        tester.run();
    },
    "success running": function(){
        //todo
    },
    "fail in before(onBefore)": function(){
        //todo
    },
    "fail in after(onAfter)": function(){
        //todo
    },
    "fail in teardown(onTeardown)": function(){
        //todo
    },
    "fail in setup(onSetup)": function(){
        //todo
    },
    "fail in before(case.before)": function(){
        //todo
    },
    "fail in after(case.after)": function(){
        //todo
    },
    "fail in setup(case.setup)": function(){
        //todo
    },
    "fail in teardown(case.teardown)": function(){
        //todo
    }
};
















