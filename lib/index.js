/**
 * Created by IDE.
 * User: gzhang
 * Date: 11/7/11
 * Time: 5:07 PM
 * To change this template use File | Settings | File Templates.
 */

var DBDaemon = require('./DBDaemon.js');
var RestTester = require('./RestTester.js');


//start rest server
//run test

module.exports = {
    DBDaemon: DBDaemon,
    RestTester: RestTester,
    client: require('./client')
};