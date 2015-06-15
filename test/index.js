(function(){
var _       = require('lodash'),
    restify = require('restify'),
    request = require('request'),
    async   = require('async');

var tests   = _.union( 
  require('./cases/Test'),
  require('./cases/Task') 
);

// async.series();
  
var cases = tests.map(function(t) {
  return function() {
    var client = require('../src/client')('ams', 3000);
    var args = t(client);
    client[ args.shift() ].apply( client, args );
  }
});

// async.series(cases);
async.parallel(cases);
})();
