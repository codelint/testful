/**
 * Created by IntelliJ IDEA.
 * User: gzhang
 * Date: 11/20/11
 * Time: 10:41 PM
 * To change this template use File | Settings | File Templates.
 */

// require('colors');


module.exports = {
    "test get": {
        cookie: 1,
        sort: 2,
        input: {
            method: "GET",
            path:"/api/for/test/get",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1"
            }
        },
        expect: {
            statusCode: 200,
            body:{
                id: 1,
                name: "inotseeyou",
                email: "inotseeyou@gmail.com",
                headers: {
                    "content-type": "application/json"
                }
            },
            headers:{
                "content-type": "application/json; charset=utf-8"
            }
        },
        setup: function(next, title, cs) {
            console.log("[i-setup]: function defined in context".grey);
            next();
        },
        teardown: function(next, title, cs) {
            console.log("[i-teardown]: function defined in context".grey);
            next();
        },
        before: function(next, title, cs) {
            console.log("[i-before]: function defined in context".grey);
            next();
        },
        after: function(next, title, cs) {
            console.log("[i-after]: function defined in context".grey);
            next();
        }
    },
    "test post": {
        cookie: 1,
        sort: 3,
        input: {
            method: "POST",
            path:"/api/for/test/post",
            headers: {
                "content-type": "application/json; charset=utf-8"
            },
            body:{
                abc: 1,
                str: "str"
            }
        },
        expect: {
            statusCode: 200,
            body:{
                abc: 1,
                str: "str"
            },
            headers:{
            }
        },
        errorMessage: "api for test get"
    },
    "test timeout": {
        cookie: 1,
        sort: 1,
        input: {
            method: "GET",
            path: "/api/for/test/timeout"
        },
        expect: {
        }

    }
};