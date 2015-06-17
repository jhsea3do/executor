(function() {
'use strict';
var uuid  = require('uuid'),
    async = require('async'),
    _     = require('lodash');
// var queue = require('../queue');
var Run = function(mongoose) {
  var Step     = mongoose.model('Step');

  var recv     = function(data, cb) {
    var step = data;
    var Shell = require('../shell');
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
        var data = payload;
            data.uuid   = uuid.v4();
            data.task   = null;
            data.job    = null;
            data.status = 2;
            data.result = '';
            data.retnum = 0;
        var step = Step.create(data, function(err, obj) {
          if (!err) {
            var out = recv( obj, function(err, out) {
              if(err) {
                res.status(500).json({"msg": String(err).trim()});
              } else {
                res.status(201).json({"msg": String(out).trim()});
              }
            } );
            // res.status(200).json( obj );
          } else {
            console.log(err);
            res.status(503).json({"msg":"save cmd failed 2"});
          }
        });
      } catch (err) {
        console.log(err);
        res.status(400).json({"msg":"save cmd failed 1"});
      }
    };
    handlers[method](req, res, next);
  };

};
module.exports = Run;
})();
