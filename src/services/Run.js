(function() {
'use strict';
var uuid  = require('uuid'),
    async = require('async'),
    _     = require('lodash');
// var queue = require('../queue');
var Run = function(mongoose) {
  var Schedule = mongoose.model('Schedule'),
      Task     = mongoose.model('Task'),
      Step     = mongoose.model('Step');

  var recv     = function(data) {
    var task = _.cloneDeep(data.todo);
    // console.log(task);
    task.uuid = data.uuid;
    var total = 0;
    var doneStep = function(err, obj) { };
    var doneTask = function(err, obj) { };
    var job_id = 0;
    async.series(task.jobs.map(function(job) {
      return function(cb) {
        var uuids = [];
        job.uuid = uuid.v4();
        job.steps.map(function(step) {
          step.task = {'uuid': task.uuid, 'seq': total };
          step.job  = {'uuid': job.uuid, 'seq': job_id };
          step.uuid = uuid.v4();
          uuids.push({ 'uuid': step.uuid });
          total ++;
          Step.create(step, doneStep);
        });
        job.steps = null;
        job.steps = uuids;
        job_id ++;
        if(cb) cb();
      }
    }), function() {
      task.total = total;
      Task.create(task, doneTask);
    });

    return data;

  };

  return function(req, res, next) {
    var method = req.method.toUpperCase();
    var handlers = {};
    handlers['GET'] = function(req, res, next) {
      // next();
      res.status(200).json({"msg":"in run get"});
    };
    handlers['POST'] = function(req, res, next) {
      try {
        // var job = queue.save('schedule:run', {"a":"b"});
        var payload = req.body || {};
        var data = { "uuid": uuid.v4(), "todo": payload };
        var schedule = Schedule.create(data, function(err, obj) {
          if (!err) {
            var out = recv( data );
            res.status(200).json( obj );
          } else {
            console.log(err);
            res.status(503).json({"msg":"save queue failed 2"});
          }
        });
      } catch (err) {
        console.log(err);
        res.status(400).json({"msg":"save queue failed 1"});
      }
    };
    handlers[method](req, res, next);
  };

};
module.exports = Run;
})();
