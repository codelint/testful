/**
 * Date: 2022/3/7
 * Time: 19:15
 * Author: Ray.Zhang <inotseeyou@foxmail.com>
 */
let https = require('https');
let http = require('http');

class HttpClient {
    constructor(option){
        // this.host = option['host']
        this.timeout = option['timeout'] || 30
        this.headers = option['headers'] || []
        this.encoding = option['encoding'] || 'utf8'
        this.cookies = []
    }

    setHeaders(headers) {
        this.headers = headers;
    }

    get(url, callback) {
        this.call(url, 'GET', '', callback)
    }

    post(url, body, callback) {
        this.call(url, 'POST', body, callback)
    }

    call(url, method, body, callback) {
        let ret;
        let u = new URL(url)
        let opts = {
            protocol: u.protocol,
            host: u.hostname,
            port: u.port,
            path: u.href,
            method: method,
            headers: this.headers
        };
        // console.log(opts);
        if(this.cookies.length) {
            this.headers['cookies'] = this.cookies
        }
        //send request
        let req = (u.protocol === 'https:' ? https : http).request(opts, res => {
            ret = {
                statusCode: res.statusCode,
                headers: res.headers,
                body: ""
            };
            res.setEncoding(this.encoding);
            res.on('data', function(chunk){
                ret.body += chunk;
            });

            res.on('end', () => {
                // console.log(res.headers['set-cookie']);
                res.headers['set-cookie'] && res.headers['set-cookie'].forEach(cookieStr => {
                    cookieStr.split(';').forEach(item => {
                        if(!item){
                            return
                        }
                        const arr = item.split('=')
                        const key = arr[0].trim();
                        if(key && arr[1]){
                            this.cookies[key] = arr[1]
                        }
                    })
                })
                let b = ret.body;
                try{
                    ret.body = JSON.parse(ret.body);
                }catch(e){
                    ret.body = b;
                }
                callback(null, ret);
            });
        });
        if(!body){
            req.end();
        }else{
            req.write(body);
            req.end();
        }
        setTimeout(function(){
            req.destroy()
        }, this.timeout);
        req.on('error', function(e){
            callback(e);
        });
    }
}

module.exports = HttpClient