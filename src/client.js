(function() {
var restify = require('restify');
var run     = function(name, port) {
  var host = 'localhost';
  // console.log( ['http://', host, ':', port].join(''));
  return restify.createJsonClient({
    url: ['http://', host, ':', port].join(''),
    retry: false
  });
};

module.exports = run;
})();
