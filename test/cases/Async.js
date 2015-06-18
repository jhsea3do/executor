(function() {
  var async  = require('async');
  
  var tests = function() {
    var log  = function(err, obj) {
     var method = String(this);
     if(obj) {
       console.log([method, 'msg', obj]);
     } else {
       console.log([method, 'msg', 'err call']);
     }
    };
    var Client   = function(name, port) {
      return require('../../src/client')('ams', 3000);
    };
    var close = function(client) { client.close(); }
    var echo = function(client, method, num, done) {
      // var client   = require('../../src/client')('ams', 3000);
      var msg      = { 'msg': num };
      var callback = function(err, req, res, obj) {
        setTimeout(function() {
          log.bind('################### in ' + method)(err, obj);
          // done = done || log;
          if(done) done.bind(method)( err, obj);
        }, 100);
        // client.close();
      }
      client.post('/api/v2/echo', msg, callback);
    }
    var nums = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
    var seqm = function() {
      client = new Client();
      nums.map(function(num) {
        echo(client, 'seq', num, function(err, obj) {
          log(err, obj);
          close(client);
        });
      });
    };
    var serm = function() {
      var client = new Client();
      async.series(nums.map(function(num) {
        return function(cb) {
          return echo(client, 'ser', num, cb);
        };
      }), function(err, rsts) {
        log(err, rsts);
        close(client);
      });
    };
    /*
    async.parallel(nums.map(function(num) {
      return function(cb) {
        return echo('par', num, cb);
      };
    }), log);
    */
     seqm();
     serm();
  };

  tests();
})();
