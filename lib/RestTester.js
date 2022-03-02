/**
 * Created by IDE.
 * User: gzhang
 * Date: 11/7/11
 *
 * Time: 5:07 PM
 */
require('./colors')
// require('colors');
let http = require('http');
let util = require('util'), events = require('events');

/*
 *  RestTester :
 */
//------------------- Event Defined ----------------//
let E = {
    INIT: "r_init",                 //(error, cases)
    CLOSE: "r_close",               //([errors], cases)
    PRECLOSE: "r_preClose",         //([errors], cases)
    SETUP: "r_setup",               //(error, case's title, case)
    TEARDOWN: "r_teardown",         //([errors], case's title, case)
    BEFORE: "r_before",             //(error, case's title, case)
    AFTER: "r_after",               //([errors], case's title, case)
    TESTING: "r_testing"            //(error, title , case)
};

// ---------------------------- test cases defines --------------------------- //
/*  //input & expect is require
*  cases: {
*      "test1 title": case,
*      "test2 title": case,
*      ...
*  }
*  case: {
*      result: true / false        //after test will fill by tester
*      input:{
*          host: "localhost",      //optional
*          port: 5555,             //optional
*          method: "POST"/"GET",
*          headers:{},
*          path:"/url/to/call/api?param1=1&param2=2"
*          body:{}                 //for post
*      },
*      expect:{
*          statusCode: 200,
*          headers:{},
*          body:{}
*      },
*      actual: {                   //after test will fill by tester
*          statusCode: 200,
*          headers: {},
*          body: {}
*      },
*      error: {                    //if error occur during testing, tester will fill this field
*      }
*      before: Function(title, case, next),          //optional
*      after: Function(title, case, next),           //optional
*      setup: Function(title, case, next),           //optional
*      teardown: Function(title, case, next)         //optional
*  },
*  // ------- test server's context ------------ //
*  context: {
*      //if give the server, tester will start server auto;
*      //if not give, you must confirm the host:port you give is startup
*      server: nodejs-server,
*      host: 'localhost',
*      port: 5555,
*      timeout: 500,
*      encoding: 'utf8'
*  },
*  init : function(cases, next),
*  close : function(cases, next)
*/

function eprint(msg) {
    console.log(("[error] " + msg).red);
}

function debug(msg) {
   //
    // console.log(('[trace] ' + msg).grey);
}
function noThrow(handle, block) {
    return function() {
        try {
            block.apply(this, arguments);
        } catch(e) {
            handle(e);
        }
    }
}

// serialCall(obj, func, function(error: Error){})
function serialCall(self, funs, callback) {
    debug("serial call: " + funs.length);
    let i = 0;
    let args = Array.prototype.slice.call(arguments, 3);
    let flag = false;
    function entry(err) {
        if (flag && err) throw err;
        let fun = funs[i++];
        if (err || (!fun)) {
            flag = true;
            callback(err);
        } else if(fun){
            try {
                fun.apply(self, args);
            } catch(e) {
                entry(e);
            }
        }
    }
    args.unshift(entry);
    entry();
}

// serial dependent call...
// serialCall(obj, func, function(errors:[]){})
// please confirm the next call as the last instruction, or will trigger some unknown bug...
function serialDepCall(self, funs, callback) {
    debug("In serialDepCall: " + funs.length);
    let i = 0, errors = [];
    let args = Array.prototype.slice.call(arguments, 3);
    let flag = false;
    function entry(err) {
        if (flag && err) throw err;
        if (err) errors.push(err);
        let fun = funs[i++];
        if (fun) {
            try {
                fun.apply(self, args);
            } catch(e) {
                entry(e);
            }
        } else if (!flag) {
            flag = true;
            callback(errors);
        }
    };
    args.unshift(entry);
    entry();
}

function updateCaseResult(_case, err, actual) {
    if (err) {
        _case.result = false;
        _case.error = {
            message: err.message
        }
    }
    if (actual) {
        _case.actual = actual;
    }
}

function combineErrors(errors) {
    return errors.map(
    function(e) {
        return (e && e.message) || "";
    }).toString();
}

//before/setup/init : first in first run
//after/teardown/close : first in last run
class Tester extends events.EventEmitter {
    constructor(cases, context, callback){
        super();
        let self = this;
        context = context || {};
        // ------------------- members --------------------- //
        this.cases = cases;
        this.context = {
            server: context.server || null,
            host: context.host || "localhost",
            port: context.port || 5555,
            timeout: context.timeout || 500,
            encoding: context.encoding || "utf8"
        };
        this._before = [];
        this._after = [];
        this._setup = [];
        this._teardown = [];
        this._init = [];
        this._close = [];
        this.callback = callback;
        // ----------------------- default listener ----------------------- //
        this.onInit(function(next, cases){
            let ct = this.context;
            let server = ct.server;
            if(server){
                server = server.listen(ct.port, function(){
                    let host = server.address().address;
                    let port = server.address().port;
                    console.log('Start mock server at http://%s:%s', host, port)
                });
            }
            next();
        });
        this.onBefore(function(next, title, _case){
            _case.result = true;
            _case.actual = {};
            _case.error = {};
            next();
        });
        this.on(E.PRECLOSE, function(){//after test close the server
            if(self.context.server){
                //self.context.server.close();
            }
        })
    }

    onBefore(func) {
        this._before.push(func);
    }

    onAfter(func) {
        this._after.unshift(func);
    }

    onSetup(func) {
        this._setup.push(func);
    }

    onTeardown(func) {
        this._teardown.unshift(func);
    }

    onInit(func){
        this._init.push(func);
    }

    onClose(func) {
        this._close.unshift(func);
    }

    run(_cases, callback) {

        debug('start to run test');
        let self = this;
        let cases = _cases || self.cases || [];
        let wraps = [];

        function wrap(t, cs){
            return function(next){
                return self.testOneCase(t, cs, next);
            }
        }

        for(let t in cases){
            cases[t].input && wraps.push(wrap(t, cases[t]));
        }

        function afterTestAll(errors){
            self.emit(E.PRECLOSE, errors, cases);
            serialDepCall(self, self._close, function(errors){
                self.emit(E.CLOSE, errors, cases);
                if(callback){
                    callback(errors, cases);
                }else if(self.callback){
                    self.callback(errors, cases);
                }
            }, cases);
        }

        serialCall(self, self._init, function(err){
            self.emit(E.INIT, err, cases);
            if(err){
                afterTestAll([err]);
            }else{
                serialDepCall(self, wraps, afterTestAll);
            }
        }, cases);
    }

    testOneCase(title, _case, callback) {
        debug("In testOneCase[" + title + "]");
        let self = this;

        function testing(err, actual){
            updateCaseResult(_case, err, actual);
            serialDepCall(self, self._teardown, function teardownEnd(errors){//teardown
                if(_case.teardown){
                    let next = function(e){
                        if(e) errors.push(e);
                        teardownEnd(errors);
                    };
                    let func = noThrow(next, _case.teardown);
                    delete _case.teardown;
                    return func.call(self, next, title, _case);
                }
                self.emit(E.TEARDOWN, errors, title, _case);
                if(errors.length > 0){
                    callback(new Error(combineErrors(errors)));
                }else{
                    callback(new Error('a bug'));
                }
            }, title, _case);
        }

        serialCall(self, self._setup, function setupEnd(err){ //setup
            if((!err) && _case.setup){//todo check if before is not a function
                let func = noThrow(setupEnd, _case.setup);
                delete _case.setup;
                return func.call(self, setupEnd, title, _case);
            }
            self.emit(E.SETUP, err, title, _case);
            if(err){//if setup success then start to test...
                callback(err);
            }else{
                self._testing(title, _case, testing);
            }
        }, title, _case);

    }

    _testing(title, _case, callback){
        let self = this;

        function afterCaseTest(err, actual){
            self.emit(E.TESTING, err, title, _case);
            if(err){
                callback(err);
            }else{
                _case.actual = actual;
                //todo code in after callback like code in teardown callback
                serialDepCall(self, self._after, function afterEnd(errs){//after
                    if(_case.after){
                        let next = function(e){
                            if(e) errs.push(e);
                            afterEnd(errs);
                        };
                        let func = noThrow(next, _case.after);
                        delete _case.after;
                        return func.call(self, next, title, _case);
                    }
                    self.emit(E.AFTER, errs, title, _case);
                    if(errs.length) callback(Error(combineErrors(errs)), actual);
                    else callback(null, actual);
                }, title, _case);
            }
        }

        serialCall(self, self._before, function beforeEnd(err){//before
            if((!err) && _case.before){
                let func = noThrow(beforeEnd, _case.before);
                delete _case.before;
                return func.call(self, beforeEnd, title, _case);
            }
            self.emit(E.BEFORE, err, title, _case);
            if(err){//before running error ...
                debug(err.message)
                callback(err);
            }else{
                self._testCase(_case, afterCaseTest);
            }
        }, title, _case);
    }

    _testCase(_case, callback) {

        let tester = this;
        let ret = {};
        let input = _case.input;
        let env = tester.context;
        let rbody = Object.prototype.toString.call(input.body) == '[object String]' ? input.body : JSON.stringify(input.body);
        let opts = {
            host: input.host || env.host,
            port: input.port ? Number(input.port) : env.port,
            path: input.path,
            method: input.method,
            headers: input.headers
        };
        //send request
        let req = http.request(opts, function(res){
            ret = {
                statusCode: res.statusCode,
                headers: res.headers,
                body: ""
            };
            res.setEncoding(env.encoding);
            res.on('data', function(chunk){
                ret.body += chunk;
            });
            res.on('end', function(){
                let b = ret.body;
                try{
                    ret.body = JSON.parse(ret.body);
                }catch(e){
                    ret.body = b;
                }
                callback(null, ret);
            });
        });
        if(!rbody){
            req.end();
        }else{
            req.write(rbody);
            req.end();
        }
        setTimeout(function(){
            req.destroy()
        }, env.timeout);
        req.on('error', function(e){
            callback(e);
        });
    }
}
// let $ = Tester.prototype;

// ----------------------- public function ----------------------- //
// init - run test cases - close
// $.run = function(_cases, callback) {
//     debug('start to run test');
//     let self = this;
//     let cases = _cases || self.cases || [];
//     let wraps = [];
//
//     function wrap(t, cs) {
//         return function(next) {
//             return self.testOneCase(t, cs, next);
//         }
//     }
//     for (let t in cases) {
//         wraps.push(wrap(t, cases[t]));
//     }
//     function afterTestAll(errors) {
//         self.emit(E.PRECLOSE, errors, cases);
//         serialDepCall(self, self._close, function(errors) {
//             self.emit(E.CLOSE, errors, cases);
//             if (callback) {
//                 callback(errors, cases);
//             } else if (self.callback) {
//                 self.callback(errors, cases);
//             }
//         }, cases);
//     }
//
//     serialCall(self, self._init, function(err) {
//         self.emit(E.INIT, err, cases);
//         if (err) {
//             afterTestAll([err]);
//         } else {
//             serialDepCall(self, wraps, afterTestAll);
//         }
//     }, cases);
// };
// setup - testing - teardown
// $.testOneCase = function(title, _case, callback) {
//     debug("In testOneCase[" + title + "]");
//     let self = this;
//
//     function testing(err, actual) {
//         updateCaseResult(_case, err, actual);
//         serialDepCall(self, self._teardown, function(errors) {//teardown
//             if (_case.teardown) {
//                 let callee = arguments.callee;
//                 let next = function(e) {
//                     if (e) errors.push(e);
//                     callee(errors);
//                 };
//                 let func = noThrow(next, _case.teardown);
//                 delete _case.teardown;
//                 return func.call(self, next, title, _case);
//             }
//             self.emit(E.TEARDOWN, errors, title, _case);
//             if (errors.length > 0) {
//                 callback(new Error(combineErrors(errors)));
//             } else {
//                 callback(new Error('a bug'));
//             }
//         }, title, _case);
//     }
//
//     serialCall(self, self._setup, function(err) { //setup
//         if ((!err) && _case.setup) {//todo check if before is not a function
//             let func = noThrow(arguments.callee, _case.setup);
//             delete _case.setup;
//             return func.call(self,arguments.callee, title, _case);
//         }
//         self.emit(E.SETUP, err, title, _case);
//         if (err) {//if setup success then start to test...
//             callback(err);
//         } else {
//             self._testing(title, _case, testing);
//         }
//     }, title, _case);
// };
// before - testing - after
// callback = function(err, actual);
// $._testing = function(title, _case, callback) {
//     let self = this;
//
//     function afterCaseTest(err, actual) {
//         self.emit(E.TESTING, err, title, _case);
//         if (err) {
//             callback(err);
//         } else {
//             _case.actual = actual;
//             //todo code in after callback like code in teardown callback
//             serialDepCall(self, self._after, function(errs) {//after
//                 if (_case.after) {
//                     let callee = arguments.callee;
//                     let next = function(e) {
//                         if (e) errs.push(e);
//                         callee(errs);
//                     };
//                     let func = noThrow(next, _case.after);
//                     delete _case.after;
//                     return func.call(self, next, title, _case);
//                 }
//                 self.emit(E.AFTER, errs, title, _case);
//                 if(errs.length) callback(Error(combineErrors(errs)), actual);
//                 else callback(null, actual);
//             }, title, _case);
//         }
//     }
//
//     serialCall(self, self._before, function(err) {//before
//         if ((!err) && _case.before) {
//             let func = noThrow(arguments.callee, _case.before);
//             delete _case.before;
//             return func.call(self, arguments.callee, title, _case);
//         }
//         self.emit(E.BEFORE, err, title, _case);
//         if (err) {//before running error ...
//             callback(err);
//         } else {
//             self._testCase(_case, afterCaseTest);
//         }
//     }, title, _case);
// };
// callback: function(err, actual);
// $._testCase = function(_case, callback) {
//     let tester = this;
//     let ret = {};
//     let input = _case.input;
//     let env = tester.context;
//     let rbody = Object.prototype.toString.call(input.body) == '[object String]' ? input.body : JSON.stringify(input.body);
//     let opts = {
//         host: input.host || env.host,
//         port: input.port ? Number(input.port) : env.port,
//         path: input.path,
//         method: input.method,
//         headers: input.headers
//     };
//     //send request
//     let req = http.request(opts, function(res) {
//         ret = {
//             statusCode: res.statusCode,
//             headers : res.headers,
//             body: ""
//         };
//         res.setEncoding(env.encoding);
//         res.on('data', function(chunk) {
//             ret.body += chunk;
//         });
//         res.on('end', function() {
//             let b = ret.body;
//             try {
//                 ret.body = JSON.parse(ret.body);
//             } catch(e) {
//                 ret.body = b;
//             }
//             callback(null, ret);
//         });
//     });
//     if (!rbody) {
//         req.end();
//     } else {
//         req.write(rbody);
//         req.end();
//     }
//     setTimeout(function() {
//         req.abort();
//     }, env.timeout);
//     req.on('error', function(e) {
//         callback(e);
//     });
// };

Tester.E = E;


module.exports = Tester;










