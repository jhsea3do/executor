(function(){
var should = require('should'),
    uuid   = require('uuid');

module.exports = [

function(client) {
  var d = { "name": uuid.v4() }
  var m = 'post';
  var u = '/odata/tests';
  return [ m, u, d, function(err, req, res, obj) {
    console.log([m, u].join(' '));
    // console.log([err, obj]);
    should.not.exist(err);
    client.close();
  }];
},
function(client) {
  var d = { "a": uuid.v4() }
  var m = 'post';
  var u = '/odata/tests';
  return [ m, u, d, function(err, req, res, obj) {
    console.log([m, u].join(' '));
    should.exist(err);
    should(res.statusCode).equal(401);
    client.close();
  }];
},
function(client) {
  var m = 'get';
  var u = '/odata/tests';
  return [ m, u, function(err, req, res, obj) {
    console.log([m, u].join(' '));
    should.not.exist(err);
    client.close();
  }];
},
function(client) {
  var m = 'del';
  var u = '/odata/tests';
  return [ m, u, function(err, req, res) {
    console.log([m, u].join(' '));
    should.not.exist(err);
    should(res).have.property('statusCode');
    should(res.statusCode).equal(204);
    client.close();
  }];
}

];

})();
