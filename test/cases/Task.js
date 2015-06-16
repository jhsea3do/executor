(function(){
var should = require('should'),
    uuid   = require('uuid');

module.exports = [

function(client) {
  var d = {
   "name": "tests",
   "jobs": [{
     "name": "test-a", "type": "series", "steps": [{
       "name": "step1", "type": "shell", "exec": "ls -l", 
       "node": {"host": "localhost", "addr": "127.0.0.1"}, 
       "cred": {"user": "cloudm", "addr": "cloudm"}
     }, {
       "name": "step2", "type": "shell", "exec": "who am i", 
       "node": {"host": "localhost", "addr": "127.0.0.1"}, 
       "cred": {"user": "cloudm", "addr": "cloudm"}
     }]
   }, {
     "name": "test-b", "type": "series", "steps": [{
       "name": "step3", "type": "shell", "exec": "echo OK", 
       "node": {"host": "localhost", "addr": "127.0.0.1"}, 
       "cred": {"user": "cloudm", "addr": "cloudm"}
     }]
   }]    
  };
  var m = 'post';
  // var u = '/odata/schedules';
  var u = '/api/v2/run';
  return [ m, u, d, function(err, req, res, obj) {
    console.log([m, u].join(' '));
    // console.log([err, obj]);
    should.not.exist(err);
    client.close();
  }];
},

];

})();
