optimist
========

testful is a node.js test framework for restful service test.
Just to give the expect http response, and the http call options.
It will test for you, compare the expect result & actual result.

What you need to do is to construct the test data for http request.

installation
============

With [npm](http://github.com/isaacs/npm), just do:

    npm install -g testful

or clone this project on github:

    git clone https://github.com/codelint/testful.git

To run the sample test case:
just do:

    ./do_sample_test


examples
========

You just give the case data like below:
-------------------------------------------------------------------

./sample/get_post_timeout.js:

```javascript
// file[./sample/get_post_timeout.js] is a sample
// ---------------------------- test cases defines --------------------------- //
 //input & expect is require
var Cases = {
  "test1 title": Case,
  "test2 title": Case,
  ...
}
var Case = {
  result: true / false        //after test will fill by tester
  input:{
      host: "localhost",      //optional
      port: 5555,             //optional
      method: "POST"/"GET",
      headers:{},
      path:"/url/to/call/api?param1=1&param2=2"
      body:{}                 //for post
  },
  expect:{
      statusCode: 200,
      headers:{},
      body:{}
  },
  actual: {                   //after test will fill by tester
      statusCode: 200,
      headers: {},
      body: {}
  },
  error: {                    //if error occur during testing, tester will fill this field
  }
  before: Function(next, title, case),          //optional
  after: Function(next, title, case),           //optional
  setup: Function(next, title, case),           //optional
  teardown: Function(next, title, case)         //optional
}
// ------- test server's context ------------ //
var context = {
  //if give the server, tester will start server auto;
  //if not give, you must confirm the host:port you give is startup
  server: nodejs-server,
  host: 'localhost',
  port: 5555,
  timeout: 500,
  encoding: 'utf8'
}
// init : function(cases, next),
// close : function(cases, next)
```


contact author
===========
````
email: codelint@foxmail.com
````
