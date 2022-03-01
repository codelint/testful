/**
 * Created by IntelliJ IDEA.
 * User: gzhang
 * Date: 11/9/11
 * Time: 9:43 AM
 * To change this template use File | Settings | File Templates.
 */
let lang = require('lang');
let lint = lang.lint;
let path = require('path'), util = require('util'), fs = require('fs'), child = require('child_process');

/*
 *  DBDaemon :
 */
//------------------- Event Defined ----------------//
let E = {
};

//------------------- Init Function ----------------//
let DBDaemon = function(dbname, pass, user, host, port) {
    this.cmd = {
        dump_table: "mysqldump --opt --extended-insert=false -h%s -u%s -p%s -P%s %s %s >> %s;",
        exec_sql_file: 'mysql -h%s -u%s -p%s -P%s %s -e "source %s";',
        dump_db: "mysqldump --opt --add-drop-table --extended-insert=false -h%s -u%s -p%s -P%s %s > %s;",
        truncate: 'echo "TRUNCATE \\`%s\\`;" > %s;',
        diff: 'diff "%s" "%s";'
    };
    this.dbname = dbname;
    this.pass = pass;
    this.host = host || "localhost";
    this.port = port || 3306;
    this.user = user || "root";
    this.cacheDir = path.join(__dirname, util.format('./.%s@%s', this.user, this.host));
    for (let c in this.cmd) {
        switch (c) {
            case 'dump_table':
            case 'exec_sql_file':
            case 'dump_db':
                this.cmd[c] = util.format(this.cmd[c], this.host, this.user, this.pass, this.port, this.dbname);
                break;
            default:
        }
        util.debug(this.cmd[c]);
    }
    init.apply(this);
};

function init() {
    // setup up cache dir
    try {
        fs.mkdirSync(this.cacheDir, "777");
    } catch(e) {
        util.debug(e.message);
    }
    // backup all the table

}

let runBash = lint.bashing;
//------------------ Public Interface --------------//
let iface = {
    //flag will make the data store to different file
    //file format: .dbname.table.flag.sql / .dbname.table.sql / .dbname.sql
    _cache: function(flag, tables, callback) {
        return runBash(this.bash("cache", flag, tables), callback);
    },
    //usage: cache(callback(code, stdout, stderr), 't1','t2',...)
    cache: function(callback) {
        let tables = Array.prototype.slice.apply(arguments, [1]);
        tables = (lint.typeOf(tables[0]) == "Array") ? tables[0] : tables;
        return this._cache(null, tables, callback);
    },
    //restore(tb1, tb2, tb3 ...)
    restore: function(callback, table) {
        let tables = Array.prototype.slice.apply(arguments, [1]);
        return runBash(this.bash("restore", null, tables), callback);
    },
    //diff(tb1, tb2, ...), can't diff total table
    diffTable: function(callback, table) {
        let self = this;
        let tables = Array.prototype.slice.apply(arguments, [1]);
        return this._cache(true, tables, function(code, stdout, stderr) {
            if (!code) {
                runBash(self.bash('diff', null, tables), callback);
            } else {
                callback(code, stdout, stderr);
            }
        });
    },
    // create the bash script string....
    bash: function(op, flag, tables) {
        let i, tn = tables.length;
        let filename = path.join(this.cacheDir, this.dbname);
        filename += ((tn > 0) ? ".%s" : "");
        let xfilename = filename + ".x.sql";
        filename += ".sql";
        filename = flag ? xfilename : filename;
        let str = "";

        let fn, tb; // template variable to save runtime filename, table name
        switch (op) {
            case "cache" :
                if (tn) {
                    for (i = 0; i < tn; i++) {
                        tb = tables[i];
                        fn = util.format(filename, tb);
                        str += util.format(this.cmd.truncate, tb, fn);
                        str += util.format(this.cmd.dump_table, tb, fn);
                        str += "\n";
                    }
                    return str;
                } else {
                    //add truncate all the table's operation
                    return util.format(this.cmd.dump_db, filename);
                }
                break;
            case "restore":
                if (tn) {
                    for (i = 0; i < tn; i++) {
                        fn = util.format(filename, tables[i]);
                        str += util.format(this.cmd.exec_sql_file, fn);
                        str += "\n";
                    }
                    return str;
                } else {
                    return util.format(this.cmd.exec_sql_file, filename);
                }
                break;
            case "diff":
                if (tn) {
                    for (i = 0; i < tn; i++) {
                        tb = tables[i];
                        let f1 = util.format(filename, tb);
                        let f2 = util.format(xfilename, tb);
                        str += util.format(this.cmd.diff, f1, f2);
                    }
                    return str;
                } else {
                    return util.format(this.cmd.diff, filename, xfilename);
                }
                break;
            default:
                return "";
        }
    }
};

//------------------ Return Class Instance ---------//
DBDaemon.E = E;

DBDaemon.prototype = iface;

module.exports = DBDaemon;

