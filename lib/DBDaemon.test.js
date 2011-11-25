/**
 * Created by IntelliJ IDEA.
 * User: gzhang
 * Date: 11/9/11
 * Time: 10:50 AM
 * To change this template use File | Settings | File Templates.
 */


var Daemon = require('./DBDaemon.js');

//todo need a right test case...
module.exports = {
  testDaemon: function() {
    var daemon = new Daemon('collietest', '1234', 'root', 'localhost', '3306');
    console.log(daemon.bash('cache', true, ['t_Note', 't_User']));
    console.log(daemon.bash('restore', false, ['t_Note', 't_User']));
    console.log(daemon.bash('diff', false, ['t_Note', 't_User']));
    console.log(daemon.bash('restore', false, []));
    daemon.cache(function(res) {
      console.log(res==0 ? "success" : "fail");
    }, ['t_Note', 't_User']);
    daemon.cache(function(res, stdout, stderr) {
      console.log(res==0 ? "success" : "fail");
    });
    daemon.diffTable(function(code, stdout, stderr){
      console.log(stdout);
    }, 't_Note')
  }
};