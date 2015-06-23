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
      } else if (data.type
        && ( data.type == 'hosts' || data.type == 'shos' ) ) {
        // var shell = new Shell(data, cb);
        // return shell.sftp();
        var fs     = require('fs');
        var path   = require('path');
        var tmp    = '/tmp/tcloud2';
        if(!fs.existsSync(tmp)) fs.mkdirSync(tmp);
        var text   = '';
        if(data.hosts) {
          _.each(data.hosts, function(host) {
            var line = [ host.addr, host.host ].join("\t");
            text += (line + "\n");
          });
          // console.log(text);
        } else if (data.text) {
          text = data.text;
        }
        var file   = path.join( tmp, data.uuid + '.hosts' );
        var bool   = true;
        try {
          var fd = fs.openSync(file, 'w');
          fs.writeSync(fd, text.trim());
          fs.closeSync(fd);
        } catch (e) {
          bool = false;
          return cb('err, hosts failed', null);
        }
        var func1 = function(cb) {
          var f1Data =  { "async": false,  "name": "hosts scp", 
            "type": "sput", "exec": "/tmp/" + data.uuid + ".hosts" };
          f1Data.file = file;
          f1Data.node = data.node; f1Data.cred = data.cred;
          var shell = new Shell(f1Data, cb)
          return shell.sftp();
        }
        var func2 = function(cb) {
          var shFile = path.join(__dirname, '..', '..', 'shell', 'hosts.helper.sh');
          var f2Data =  { "async": false,  "name": "hosts tool scp", 
            "type": "sput", "exec": "/tmp/hosts.helper.sh", "file": shFile };
          f2Data.node = data.node; f2Data.cred = data.cred;
          var shell = new Shell(f2Data, cb)
          return shell.sftp();
        }
        var func3 = function(cb) {
          var shExec = "sh /tmp/hosts.helper.sh /tmp/" + data.uuid + ".hosts /etc/hosts";
          var f3Data = { "async": false,  "name": "hosts tool run", 
            "type": "scmd", "exec": shExec };
          f3Data.node = data.node; f3Data.cred = data.cred;
          var shell = new Shell(f3Data, cb)
          return shell.exec();
        }
        return async.series([func1, func2, func3], function(err, obj) {
          // if(obj) cb(null, obj);
          // else cb('not support', null);
          // console.log(obj);
          if(obj && obj.length == 3) {
            cb(null, obj[2]);
          } else {
            cb('modify hosts for ' + data.node.host + ' failed', null);
          }
        });
        
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
            var out = recv( obj, function(err, ret) {
              if(data.type == 'shell' || data.type == 'scmd') {
                var httpCode = 201;
                if(err) {
                  httpCode = 500;
                  ret = { "err": String(err), "out": null, "num": -1 };
                }
                if(ret.num == 127) {
                  httpCode = 500;
                } else if (ret.num == 126) {
                  httpCode = 400;
                }
                var msg = null;
                msg = [ String(ret.err===null?'':ret.err)
                      , String(ret.out===null?'':ret.out) ].join('\n').trim();
                res.status(httpCode).json({"msg": msg, "num": ret.num });
              } else {
                if(err) {
                  res.status(500).json({"msg": String(err).trim()});
                } else {
                  res.status(201).json({"msg": String(ret).trim()});
                }
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
