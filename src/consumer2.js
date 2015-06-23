(function() {
  var EventEmitter = require('./events').EventEmitter;
  var Client       = require('./client');
  var _            = require('lodash');
  var Promise      = require('bluebird');
  var async        = require('async');
  var ConsumerMethods = {
    "start": function() {
      this.emitter.emit('start');
      // console.log([ this.name, 'start' ]);
      this.ready();
      return this;
    },
    "ready": function() {
      this.emitter.emit('ready');
      // console.log([ this.name, 'ready' ]);
      this.run();
      return this;
    },
    "close": function() {
      // console.log([ this.name, 'close' ]);
      this.emitter.emit('close');
      this.client.close();
      return this;
    },
    "updateSchedule": function(cb, query, updated) {
      var url = [ '/odata/schedules?', 'query=', JSON.stringify(query) ].join('');
      var self = this;
      this.client.get(url, function(err, req, res, objs) {
        if(!objs) {
          return;
        }
        async.parallel(objs.map(function(obj) {
          return function(cb) {
            var url = [ '/odata/schedules/', obj._id ].join('');
            self.client.put(url, updated, function( error, req, res, result) {
              console.log(['update schedule', result.todo.status]);
              if(cb) cb(error, result);
            });
          };
        }), cb);
      });
      return this;
    },
    "updateTask": function(cb, query, updated) {
      var url  = [ '/odata/tasks?', 'query=', JSON.stringify(query) ].join('');
      var self = this;
      this.client.get(url, function(err, req, res, objs) {
        if(!objs) {
          return;
        }
        async.parallel(objs.map(function(obj) {
          return function(cb) {
            var url = [ '/odata/tasks/', obj._id ].join('');
            self.client.put(url, updated, function( error, req, res, result) {
              console.log(['update task', result.steps]);
              if(cb) cb(error, result);
            });
          };
        }), cb);
      });
      return this;
    },
    "updateStep": function(cb, query, updated) {
      var url = [ '/odata/steps?', 'query=', JSON.stringify(query) ].join('');
      var self = this;
      this.client.get(url, function(err, req, res, objs) {
        if(!objs) {
          return;
        }
        async.parallel(objs.map(function(obj) {
          return function(cb) {
            var url = [ '/odata/steps/', obj._id ].join('');
            self.client.put(url, updated, function( error, req, res, result) {
              console.log(['update step', result.task.seq, result.status, result.retnum, result.result ]);
              if(cb) cb(error, result);
            });
          };
        }), cb);
      });
      return this;
    },
    "loadSchedules": function(cb, size) {
      size = size || 5;
      var url  = ["/odata/schedules?",
        "query={\"todo.status\":0}",
        // "query={\"uuid\": \"a6cbd91f-6100-4737-9e2c-a993b7f379c5\"}",
        "&limit=" + size ].join('');
      var done = function(err, obj) {
        
        if(cb) cb(err, obj);
      };
      var self = this;
      this.client.get(url, function(err, req, res, obj) {
        if(!err) {
          var schedules = obj;
          async.parallel(schedules.map(function(schedule) {
            return function(cb) {
              // console.log([ 'schedule', schedule.uuid ]);
              self.loadTasks(cb, schedule);
            }
          }), done);
        } else {
          if(cb) cb('failed on load schedules', null);
        }
      });
      return this;
    },
    "loadTasks": function(cb, schedule) {
      var url = ['/odata/tasks?', 'query=', 
        JSON.stringify({'uuid': schedule.uuid}) ].join('');
      var done = function(err, obj) {
        console.log([ 'done', 'tasks']);
        if(cb) cb(err, obj);
      };
      var self = this;
      this.client.get(url, function(err, req, res, obj) {
        if(!err) {
          var tasks = obj;
          self.updateSchedule(function() {
          }, { 'uuid': schedule.uuid}, { "$set": {
            "todo.status": 1
          } });
          async.parallel(tasks.map(function(task) {
            return function(cb) {
              self.updateTask(function(err, obj) {
                // TODO
                self.loadSteps(cb, task);
              }, { 'uuid': task.uuid }, { "$set": {
                "status": 1,
                "steps": 0, 
                "started_at": Date.now(),
                "updated_at": Date.now()
              } });
              // self.loadSteps(cb, task);
            }
          }), done);
        } else {
          if(cb) cb('failed on load tasks', null);
        }
      });
      return this;
    },
    "loadSteps": function(cb, task) {
      var url = ['/odata/steps?', 'query=',
        JSON.stringify({'task.uuid': task.uuid}),
        '&sort=task.seq' ].join('');
      /*
      var done = function(err, obj) {
        console.log(['done', 'steps', err, obj]);
        if(cb) cb(err, obj);
      };
      */
      var done = function(err, steps) {
        var updated = null;
        if(err) {
          var msg = (err && err.message) ? String(err.message) : String(err);
          updated = { "$set": {
            "status": 2,
            "result": 1,
            "message": msg,
            "updated_at": Date.now()
          } };
        } else {
          updated = { "$set": {
            "status": 2,
            "result": 0,
            "steps":  steps.length,
            "updated_at": Date.now()
          } };
        }
        self.updateTask(function(err, obj) {
          if(err) {
            if(cb) cb('failed update task of ' + step.task.uuid, null);
          } else {
            if(cb) cb(err, obj);
          }
        }, { 'uuid': task.uuid }, updated);
         
      };
      var self = this;
      this.client.get(url, function(err, req, res, obj) {
        if(!err) {
          var steps = obj;
          async.series(steps.map(function(step) {
            // var offset = (100 * (step.task.seq + 1));
            var offset = 10;
            return function(cb) {
              // self.loadSteps(task, cb);
              setTimeout(function() {
                console.log([ 'step', step.task.seq, step.task.uuid]);
                // if(cb) cb(null, step);
                var data = _.cloneDeep(step);
                var proc = data.type;
                if(self[proc]) {
                  self.updateTask(function(err, obj) {
                    if(err) {
                      if(cb) cb('failed update task of ' + step.task.uuid, null);
                    }
                  }, { 'uuid': step.task.uuid }, { "$set": {
                    "steps": step.task.seq,
                    "updated_at": Date.now()
                  } });
                  self.updateStep(function(err, obj) {
                    if(err) {
                      if(cb) cb('failed update step of ' + step.uuid, null);
                    } else {
                      self[proc](cb, data);
                    }
                    // self[proc](cb, data);
                  }, { 'uuid': step.uuid}, { "$set": {
                    "status": 1,
                    "retnum": -1,
                    "result": '',
                    "started_at": Date.now(),
                    "updated_at": Date.now()
                  } });
                  // self[proc](cb, data);
                } else {
                  if(cb) cb('failed on proc step using: ' + proc, null);
                }
              }, offset);
            }
          }), done);
        } else {
          if(cb) cb('failed on load tasks', null);
        }
      });
      return this;
    },
    "scat": function(cb, data) {
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
      data.type = 'sput';
      data.file = file;
      var self = this;
      var done = function(err, obj) {
        self.updateStep(function(err, obj) {
          if(err) {
            if(cb) cb('failed update step of ' + step.uuid, null);
          } else {
            // if(cb) cb(err, obj);
          }
        }, { 'uuid': data.uuid}, { "$set": {
          "status": 2,
          "retnum": err ? 127 : 0,
          "result": String(obj),
          "updated_at": Date.now()
        } });
        if(cb) cb(err, obj);
      };
      // console.log(['scat', data.task.seq, data.task.uuid]);
      var shell = new require('./shell')(data, done);
      shell.sftp();
      // var result = data;
      // if(cb) cb(null, result);
      return this;
    }, 
    "sput": function(cb, data) {
      // console.log(['sput', data.task.seq, data.task.uuid]);
      // var result = data;
      // if(cb) cb(null, result);
      var self  = this;
      var done = function(err, obj) {
        self.updateStep(function(err, obj) {
          if(err) {
            if(cb) cb('failed update step of ' + step.uuid, null);
          } else {
          }
        }, { 'uuid': data.uuid}, { "$set": {
          "status": 2,
          "retnum": err ? 127 : 0,
          "result": String(obj),
          "updated_at": Date.now()
        } });
        if(cb) cb(err, obj);
      };
      var shell = new require('./shell')(data, done);
      shell.sftp();
      return this;
    }, 
    "scmd": function(cb, data) {
      var self = this;
      var done = function(err, ret) { 
        // console.log(['done ret', ret]);
        var retnum = ret.num;
        // console.log(['retnum', retnum]);
        var strerr = (undefined==ret.err||null==ret.err)?"":String(ret.err);
        var strout = (undefined==ret.out||null==ret.out)?"":String(ret.out);
        var result = [ strerr, strout ].join("\n").trim();
        self.updateStep(function(err, obj) {
          if(err) {
            if(cb) cb('failed update step of ' + step.uuid, null);
          } else {
            if(cb) cb(err, ret);
          }
        }, { 'uuid': data.uuid}, { "$set": {
          "status": 2,
          "retnum": retnum,
          "result": result,
          "updated_at": Date.now()
        } });
        // if(cb) cb(err, ret);
      };
      var shell = new require('./shell')(data, done);
      shell.exec();
      return this;
    },
    "proc": function() {
      var done = function() {
        this.close();
      }.bind(this);
      this.emitter.emit('test');
      this.loadSchedules(done, 1);
      return this;
    }, 
    "run": function() {
      console.log([ this.name, 'run' ]);
      this.procAsync().then(function(err, obj) {
        // console.log([ 'after proc', arguments]);
        // this.runAsync();
      });
      return this;
    },
    "on": function(name, handle) {
      this.emitter.on(name, handle.bind(this));
      return this;
    },
    "emit": function(args) {
      this.emitter.emit(args);
      return this;
    }
  };  
  var Consumer  = function(options) {
    var emitter = new EventEmitter();
    var core    = function() {
      // TODO
      this.emitter = emitter;
      this.client  = new Client('ams-client-' + this.name, 3000);
    };
    _.extend(core.prototype, ConsumerMethods, options);
    return new core();
  };
  
  
  var consumer1 = new Consumer({
    'name': 'con1'
  });
  var consumer2 = new Consumer({
    'name': 'con2'
  });
  /*
  Promise.promisifyAll(consumer1).on('test', function() {
    console.log([ this.name, 'test' ]);
  }).start();
  */
  Promise.promisifyAll(consumer2).on('test', function() {
    console.log([ this.name, 'test' ]);
  }).start();
})();
