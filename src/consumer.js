(function() {
var _         = require('lodash'),
    should    = require('should'),
    path      = require('path'),
    uuid      = require('uuid'),
    fs        = require('fs'),
    async     = require("async");


var getHandlers = function(client) {
  var doneScan = function(err, obj) { 
    console.log('#### Consumer closing ####');
    client.close(); 
  };
  var doneStep = function(err, steps) {
    if(steps) {
      async.parallel( _.flattenDeep(steps).map(function( step ) {
        console.log(step);
        return function(done) {
          done(null, step);
        };
      }), doneScan );
    }
  };
  var doneTask =  function(err, tasks) {
    if(tasks) {
      async.parallel( _.flattenDeep(tasks).map(function( task ) {
        var urlStep = [ '/odata/steps?', 'sort=task.seq', '&query=',
            JSON.stringify({'task.uuid': task.uuid}) ].join('');
        console.log(urlStep);
        return function(done) {
          var saved = _.cloneDeep(task);
          saved.status = 1;
          saved.result = -1;
          saved.steps  = 1;
          saved.started_at = Date.now();
          saved.updated_at = Date.now();
          var url = '/odata/tasks/' + saved['_id'];
          client.put(url, saved, function(err, req, res, obj) {
            console.log('update task: ' + res.statusCode);
            if(!err) {
              client.get(urlStep, props.step(done) );
            } else {
              doneScan(err, saved);
            }
          });
        };
      }), doneStep );
    }
  };
  var doneSchedule = function(err, schs) {
    if(schs) {
      async.parallel( _.flattenDeep(schs).map(function( sch ) {
        var urlTask = [ '/odata/tasks?', 'query=', 
            JSON.stringify({'uuid': sch.uuid}) ].join('');
        console.log(urlTask);
        return function(done) {
          var saved = _.cloneDeep(sch);
          saved.todo.status = 1;
          // console.log(savedObj);
          // console.log( '/odata/schedules/' + sch['_id']);
          var url = '/odata/schedules/' + saved['_id'];
          client.put(url, saved, function(err, req, res, obj) {
            console.log('update schedule: ' + res.statusCode);
            if(!err) {
              client.get(urlTask, props.task(done) );
            } else {
              doneScan(err, saved);
            }
          });
        };
      }), doneTask );
    }
  };
  var start = function(size) {
    var urlSchedule = ["/odata/schedules?",
    //      "query={\"todo.status\":0}",
          "&limit=" + size ].join('');
    client.get(urlSchedule, props.schedule( doneSchedule ) );
  };
  var props = {
  "start": start,
  "doneScan": doneScan,
  "doneStep": doneStep,
  "doneTask": doneTask,
  "doneSchedule": doneSchedule,
  "step": function(done) {
    return function(err, req, res, obj) {
      if(err) { done(err, null); return; }
      async.parallel([ function(done) {
        if(done) done(err, obj);
      } ], done);
    };
  },
  "task": function(done) {
    return function(err, req, res, obj) {
      if(err) { done(err, null); return; }
      async.parallel([ function(done) {
        if(done) done(err, obj);
      } ], done);
    };
  },
  "schedule": function(done) {
    return function(err, req, res, obj) {
      // console.log(obj);
      if(err) { done(err, null);  return;  }
      async.parallel( (obj||[]).map(function(sch) {
        return function(done) {
          // schedule(client, sch);
          // console.log(sch);
          if(done) done(null, sch);
        }
      }), done);
    };
  }
};
  return props;
};

var Consumer  = function(name, port) {
  var   lock  = false;
  var   work  = false;
  return {
    'lock': function() {
      // sleep(10);
      return lock;
    },
    'work': function(size) {
      size = size || 5;
      if(work) return;
      // console.log('in work');
      work = true;
      // var intv = setInterval(
      (function(){
        console.log('#### Consumer starting ####');
        var client  = require('./client')(name, port);
        var handlers = getHandlers(client);
        var urlSchedule = ["/odata/schedules?",
          "query={\"todo.status\":0}",
          "&limit=" + size ].join('');
        handlers.start(size);
        // console.log(handlers);
        // client.get(urlSchedule, handlers.schedule( handlers.doneSchedule ) );
      })();
      // , 5000);
    }
  }
}

var run = function(name, port) {
  var consumer  = new Consumer(name, port);
  // while(!consumer.lock()) {
    consumer.work(1);
  // }
}

if( path.basename(process.argv[1]) == 'consumer.js' ) {
  run('ams', 3000);
}
module.exports = Consumer;
})();
