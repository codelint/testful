/**
 * Created by IDE.
 * User: gzhang
 * Date: 11/7/11
 * Time: 10:50 PM
 * To change this template use File | Settings | File Templates.
 */


var bodyParser = require('body-parser');
var express = require('express');

function mock(port) {
    var testServer = express();
    testServer.use(bodyParser());

    testServer.get("/api/for/test/get", function(req, res) {
        res.send({
            id: 1,
            name: "inotseeyou",
            email: "inotseeyou@gmail.com",
            headers: req.headers
        });
    });
    testServer.get("/api/for/test/timeout", function(req, res) {
    });
    testServer.post("/api/for/test/post", function(req, res) {
        res.send(req.body);
    });
    if(port){
        testServer.listen(port);
    }
    return testServer;
}

module.exports = mock;
