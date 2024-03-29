/**
 * Date: 2022/3/8
 * Time: 18:58
 * Author: Ray.Zhang <inotseeyou@foxmail.com>
 */

let bodyParser = require('body-parser');
let express = require('express');
let HttpClient = require('./http')
let URL = require('url').URL;
let fs = require('fs')
// let cors = require('cors')

function generator(port, caseDir) {

    let app = express()
    let tic = 1
    let client = new HttpClient({})

    function upperCase(str)
    {
        const re = /(^|[^a-zA-Z0-9])([a-z])/g
        return str.replace(re, function($0, $1) {
            return $0.toUpperCase()
        })
    }

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
    // app.use(bodyParser.json())
    // app.use(bodyParser.urlencoded());
    // app.use(bodyParser.urlencoded({ extended: true });
    app.use(bodyParser.raw({ type: '*/*' }))
    // app.use(cors())
    // app.use((req, res, next) => {
    //     res.set({
    //         'Access-Control-Allow-Credentials': true, 
    //         'Access-Control-Max-Age': 1728000, 
    //         'Access-Control-Allow-Origin': req.headers.origin || '*', 
    //         'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type,IOT-Country,IOT-Language,IOT-Shop', 
    //         'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS', 
    //         'Content-Type': 'application/json; charset=utf-8'
    //     })
    //     req.method == "OPTIONS" ? (function(){
    //         // res.status(200)
    //         res.send("ok")
    //         res.end()
    //     })() : next()
    // })

    app.all('/*', (req, res, next) => {
        
        // console.log(req.body);
        // let i_headers = ['accept'];
        // let r_headers = ['content-type'];

        // res.header('Access-Control-Allow-Origin', "*");
        // res.header('Access-Control-Allow-Methods','PUT,POST,GET,DELETE,OPTIONS,HEAD');

        /**
         * @type {string|URL}
         */
        let url = req.url

        if(url.startsWith('/http')) {
            url = url.replace(/^\/http\//, 'http://')
            url = url.replace(/^\/https\//, 'https://')
            url = new URL(url)
        }else{
            url = new URL(`http://${req.hostname}${url}`)
        }
        console.log(`[${req.method}] ${url.toString()}`)
        let input = {
            'protocol': url.protocol,
            'host': url.hostname,
            'url': url.toString(),
            'search': url.search,
            'path': url.pathname,
            'method': req.method,
            'headers': req.headers,
            'agent': req.userAgent,
            'body': req.method === 'GET' ? '' : req.body
        }

        client.setHeaders(input.headers)

        client.call(input.url, input.method, input.body, (err, msg) => {
            if(err){
                // console.log(JSON.stringify(req.stre))
                console.log(`[ERROR] ${err.message}`);
                return next();
            }
            let testCase = {
                'cookie': 1,
                'sort': tic++,
                'title': `[${tic - 1}] ${url}`,
                'input': input,
                'expect': {
                    'statusCode': msg.statusCode,
                    'headers': msg.headers,
                    'body': msg.body
                },
                'error': err
            }
            let outputDir = caseDir + '/' + url.hostname ;

            if(!fs.existsSync(outputDir)){
                fs.mkdirSync(outputDir)
            }

            fs.writeFileSync(outputDir + '/' + (new Date()).getTime() + '.case.json', JSON.stringify(testCase))

            
            if(input.method === 'GET' || input.method === 'POST') {
                res.status(msg.statusCode)
                for(let f in msg.headers) {
                    res.set(upperCase(f), msg.headers[f])
                }
                res.send(msg.body)
            }else{
                // if(res.method == "OPTIONS") {
                //     res.status(204).end()
                // }
                
                res.set({
                    'Access-Control-Allow-Credentials': true, 
                    'Access-Control-Max-Age': 1728000, 
                    'Access-Control-Allow-Origin': req.headers.origin || '*', 
                    'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type,IOT-Country,IOT-Language,IOT-Shop', 
                    'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS', 
                    'Content-Type': 'text/html; charset=UTF-8'
                })
                res.status(204).end()
                // res.send('OK')
            }
            next()
        })


    })

    if(port){
        app.listen(port);
    }
    return app;
}

module.exports = generator;
