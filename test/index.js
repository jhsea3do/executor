(function(){
var _       = require('lodash'),
    restify = require('restify'),
    request = require('request'),
    async   = require('async');

var apiTests   = _.union( 
  // require('./cases/Test'),
  // require('./cases/Task'),
);

var helpTests  = _.union(
  require('./cases/Shell')
);

// async.series();
  
var apiCases = apiTests.map(function(t) {
  return function() {
    var client = require('../src/client')('ams', 3000);
    var args = t(client);
    client[ args.shift() ].apply( client, args );
  }
});



var helpCases = helpTests.map(function(t) {
  return t();
});

// console.log(helpCases);
async.parallel(helpCases);
async.parallel(apiCases);

})();
