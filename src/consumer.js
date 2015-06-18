(function() {
var _         = require('lodash'),
    should    = require('should'),
    path      = require('path'),
    uuid      = require('uuid'),
    fs        = require('fs'),
    async     = require("async");


var getHandlers = function(client) {
  // var Shell = require('./shell');

  var recv     = function(data, cb) {
    var step   = data;
    var Shell  = require('./shell');
    if (data.exec) {
      if (data.type
        && (data.type == 'shell' || data.type == 'scmd')) {
        var shell = new Shell(data, cb);
        return shell.exec();
      } else if (data.type && data.text
        && (data.type == 'touch' || data.type == 'scat')) {
        var fs     = require('fs');
        var path   = require('path');
        var tmp    = '/tmp/tcloud2';
        if(!fs.existsSync(tmp)) fs.mkdirSync(tmp);
        var file   = path.join( tmp, data.uuid + '.tmp' );
        var bool   = true;
        try {
          var fd = fs.openSync(file, 'w');
          fs.writeSync(fd, data.text);
          fs.closeSync(fd);
        } catch (e) {
          bool = false;
          return cb('err, touch failed', null);
        }
        if(bool) {
          data.file  = file;
          var shell  = new Shell(data, cb);
          return shell.sftp();
        }
      } else if (data.type
        && ( data.type == 'file' || data.type == 'sput' ) ) {
        var shell = new Shell(data, cb);
        return shell.sftp();
      } else if (data.type && data.type == 'sget') {
        var shell = new Shell(data, cb);
        return shell.sget();
      }
    }
    return cb('err, not supported', null);
  };


  var doneScan = function(err, obj) { 
    console.log('#### Consumer closing ####');
    client.close(); 
  };
  var doneStep = function(err, steps) {
    if(steps) {
      async/*.series*/.parallel( _.flattenDeep(steps).map(function( step ) {
        return function(done) {
          var saved = _.cloneDeep(step);
          saved.status = 1;
          saved.retnum = -1;
          saved.started_at = Date.now();
          saved.updated_at = Date.now();
          var url = '/odata/steps/' + saved['_id'];
          client.put(url, saved, function(err, req, res, obj) {
            console.log('update step: ' + res.statusCode);
            if(!err) {
              recv(step, function(err, ret) {
                if(err) {
                  console.log(err);
                  ret = { "err": String(err), "out": null, "num": -1 };
                }
                var log = null;
                if( ret.out != undefined || ret.err != undefined) {
                    log = [ String(null===ret.out?'':ret.out).trim()
                          , String(null===ret.err?'':ret.err).trim() ].join('\n').trim();
                } else {
                    log = String(ret).trim();
                }
                console.log(['type:', saved.type, saved.exec, 'result:', ret.num, log]);
                saved.status = 2;
                saved.retnum = (ret.num == undefined) ? -1 : ret.num;
                saved.result = log;
                saved.updated_at = Date.now();
                // console.log(['s', saved]);
                client.put(url, saved, function(err, req, res, obj) {
                  // doneScan(null, obj);
                });
              });
              // shell.exec();
              // doneScan(null, step);
            } else {
              doneScan(err, saved);
            }
          });
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
