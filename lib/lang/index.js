/**
 * Created by IDE.
 * User: gzhang
 * Date: 11/5/11
 * Time: 7:20 PM
 * To change 
 * template use File | Settings | File Templates.
 */

let llib = {};
const ANSI_CODES = {
    "off": 0,
    "bold": 1,
    "italic": 3,
    "underline": 4,
    "blink": 5,
    "inverse": 7,
    "hidden": 8,
    "black": 30,
    "red": 31,
    "green": 32,
    "yellow": 33,
    "blue": 34,
    "magenta": 35,
    "cyan": 36,
    "white": 37,
    "black_bg": 40,
    "red_bg": 41,
    "green_bg": 42,
    "yellow_bg": 43,
    "blue_bg": 44,
    "magenta_bg": 45,
    "cyan_bg": 46,
    "white_bg": 47
};


function typeOf(obj){
    let t = Object.prototype.toString.apply(obj);
    switch(t){
        case "[object String]":
            return "String";
        case "[object Object]":
            return "Object";
        case "[object Number]":
            return "Number";
        case "[object Array]":
            return "Array";
        case "[object Null]":
            return "Null";
        case "[object Undefined]":
            return "Undefined";
        case "[object Date]":
            return "Date";
        case "[object RegExp]":
            return "RegExp";
        default:
            return t.slice(8, t.length - 1);
    }
}

llib = {
    isOneType: function() {
        if (arguments.length < 2) return true;
        let one = arguments[0];
        let t = typeOf(one);
        for (let i = arguments.length; i --;) {
            if (typeOf(arguments[i]) != t) {
                return false;
            }
        }
        return true;
    },
    typeOf: typeOf,
    //color will be a string(predefine color) or a number
    //colorize("%[error]% hello %world% %warning%!", "red", "green", "yellow,bold")
    // [error] will red , world will be green, warning will be yellow & bold
    // % can not use in str except for mark color...
    colorize: function(str, color) {
        if (typeOf(str) === "Undefined") return ANSI_CODES;
        if (!color) return str;
        if (str.match(/%%/)) return str;
        let ci = 1, argn = arguments.length;
        let m = null, cf = "", head = "", tail = "",color_attrs = [];
        let color_str = str, reg = /([^%]|^)%([^%]+)%([^%]|$)/;
        let cnt = 100;
        while (reg.test(color_str) && (cnt--)) {
            //reset head & tail
            if (ci < argn) {
                color_attrs = arguments[ci++].split(",");
                head = "";
                for (var i = 0,attr; attr = color_attrs[i]; i++) {
                    head += "\033[" + ANSI_CODES[attr] + "m";
                }
                tail = "\033[" + ANSI_CODES["off"] + "m";
            }
            color_str = color_str.replace(reg, ("$1" + head + "$2" + tail + "$3"));
        }
        return color_str.replace(/%%/g, "%");
    },
    extend: function(obj, inf) {
        let e = (typeOf(obj) === "Function") ? obj.prototype : obj;
        for (var f in inf) {
            e[f] = inf[f];
        }
        return obj;
    },
    bashing: function (script, callback) {
        let bash = require('child_process').spawn("/bin/bash", ['-c', script]);
        let stdout = "", stderr = "";
        bash.stdout.on('data', function(data) {
            stdout += data;
        });
        bash.stderr.on('data', function(data) {
            stderr += data;
        });
        bash.on('exit', function(code) {
            callback(code, stdout, stderr);
        });
    },
    serialCall: function(self, fns, callback) {
        let i = 0;
        let args = Array.prototype.slice.call(arguments, 3);
        let flag = false;
        let entry = function(err) {
            if (flag && err) throw err;
            var fun = fns[i++];
            if (err || (!fun)) {
                flag = true;
                callback(err);
            } else if (fun) {
                try {
                    fun.apply(self, args);
                } catch(e) {
                    arguments.callee(e);
                }
            }
        };
        args.unshift(entry);
        entry();
    },
    serialFullCall: function(self, fns, callback) {
        let i = 0, errors = [];
        let args = Array.prototype.slice.call(arguments, 3);
        let flag = false;
        let entry = function(err) {
            if (flag && err) throw err;
            if (i > 0) errors.push(err);
            let fun = fns[i++];
            if (fun) {
                try {
                    fun.apply(self, args);
                } catch(e) {
                    arguments.callee(e);
                }
            } else if (!flag) {
                flag = true;
                callback(errors);
            }
        };
        args.unshift(entry);
        entry();
    },
    omatch: function(obj, matcher){
        let mt = typeOf(matcher), ot = typeOf(obj);
        let self = arguments.callee;
        if(mt !== ot) return false;
        switch(mt){
            case "Date":
                return (obj.getTime() === matcher.getTime());
            case "Regex":
                return (obj.toString() === matcher.toString());
            case "Array":
                let i = matcher.length;
                if(obj.length < i) return false;
                for(; i--;){
                    if(!self(obj[i], matcher[i])) return false;
                }
                return true;
            case "Object":
                for(let p in matcher){
                    if(!self(obj[p], matcher[p])) return false;
                }
                return true;
            default:
                return (obj === matcher);
        }
    }
};

module.exports = llib;
