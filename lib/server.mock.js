/**
 * Created by IDE.
 * User: gzhang
 * Date: 11/7/11
 * Time: 10:50 PM
 * To change this template use File | Settings | File Templates.
 */
let bodyParser = require('body-parser');
let express = require('express');
let HttpClient = require('./http')
let URL = require('url').URL;

function mock(port) {

    let app = express()

    // testServer.use(bodyParser.raw());
    app.use(bodyParser.json())
    // app.use(bodyParser.urlencoded());
    // app.use(bodyParser.urlencoded({ extended: true });

    app.get("/api/for/test/get", function(req, res) {
        res.send({
            id: 1,
            name: "inotseeyou",
            email: "inotseeyou@gmail.com",
            headers: req.headers
        });
    });
    app.get("/api/for/test/timeout", function(req, res) {
    });
    app.post("/api/for/test/post", function(req, res) {
        res.send(req.body);
    });

    if(port){
        app.listen(port);
    }
    return app;
}

module.exports = mock;
