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
    let tic = 1
    let client = new HttpClient({})

    function array_only(arr, keys) {
        let ret = {}
        keys.forEach((key) => {
            if(typeOf(arr[key]) === 'Undefined') {
                return;
            }
            ret[key] = arr[key]
        })
        return ret;
    }

    /**
     * @param t
     * @returns {string|null}
     */
    function typeOf(t) {
        let str = Object.prototype.toString.call(t).split(' ')[1];
        return str ? str.split(']')[0] : null
    }

    // testServer.use(bodyParser.raw());
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded());
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

    app.all('/case/*', (req, res, next) => {
        console.log(req.body);
        let i_headers = ['accept'];
        let r_headers = ['content-type'];

        let url = req.url.substr(6)
        url = url.replace(/^http\//, 'http://')
        url = url.replace(/^https\//, 'https://')
        url = new URL(url)

        let input = {
            'protocol': url.protocol,
            'host': url.hostname,
            'url': url.toString(),
            'path': url.pathname,
            'method': req.method,
            'headers': i_headers ? array_only(req.headers, i_headers) : req.headers,
            'agent': req.userAgent,
            'body': req.method === 'GET' ? '' : req.body
        }

        client.call('https://www.baidu.com', req.method, '', (err, msg) => {
            res.send({
                'case': {
                    'cookie': 1,
                    'sort': tic++,
                    'title': '...',
                    'input': input,
                    'expect': {
                        'statusCode': msg.statusCode,
                        'headers': r_headers ? array_only(msg.headers, r_headers) : msg.headers,
                        'body' : msg.body
                    },
                    'error': err
                }
            })
            // res.send(msg.body)
            next()
        })


    })

    if(port){
        app.listen(port);
    }
    return app;
}

module.exports = mock;
