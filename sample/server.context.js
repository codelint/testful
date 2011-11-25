/**
 * Created by IntelliJ IDEA.
 * User: gzhang
 * Date: 11/20/11
 * Time: 10:44 PM
 * To change this template use File | Settings | File Templates.
 */

module.exports = {
    server: require("../lib/server.mock.js")(),
    port: 5555,
    timeout: 600,
    encoding: 'utf8'
};