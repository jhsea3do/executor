(function(){

  var Shell = function(data, done) {
    var conn = require('ssh2').Client();
    var fs   = require('fs');
    var path = require('path');
    var dest = {
      "host": data.node.addr,
      "port": 22,
      "username": data.cred.user,
      "password": data.cred.pass
      // "privateKey": fs.readFileSync('/home/jhsea3do/.ssh/cloudm.pem')
    };
    return {
      'exec': function() {
         var cmd = data.exec;
         var ret = { 'out': null, 'err': null, 'num': -1 }
         conn.on('ready', function() {
           conn.exec(cmd, function(err, stream) {
             if (err) throw err;
             stream.on('close', function(code, signal) { 
               // console.log(['code', code]);
               // console.log(['signal', signal]);
               ret.num = code;
               conn.end();
               if(done) done(null, ret);
             }).on('error', function(error) {
                err = error;
                conn.end();
                if(done) done(err, null);
             }).on('data', function(data) {
               ret.out = data;
               // console.log([ 'out', done ]);
               // if(done) done(null, data);
               // console.log('STDOUT: ' + String(data).trim());
             }).stderr.on('data', function(data) {
               ret.err = data;
               // console.log([ 'err', done ]);
               // if(done) done(data, null);
               // console.log('STDERR: ' + String(data).trim());
             });
           });
         }).connect( dest );
      },
      'sftp': function() {
         var filePath = data.exec;
         var sourcePath = data.file;
         // var text = data.text;
         conn.on('ready', function() {
           conn.sftp(function(err, sftp) {
             if (err) throw err;
             var options = options || {};
             options.autoClose = true;
             var write = sftp.createWriteStream(filePath, options);
             write.on('error', function(error) {
               err = error;
               conn.end();
               if(done) done(err, null);
             }).on('finish', function() {
               conn.end();
               if(done) done(null, filePath);
               // if(done) done(null, { 'out': { 'msg': filePath } });
             });
             try {
               fs.createReadStream(sourcePath).pipe(write);
               // write.end(fs.readFileSync(sourcePath));
             } catch (e) {
               write.end();
             }
           });

         }).connect( dest );
      },
      'sget': function() {
        var filePath = data.exec;
        var destPath = data.file;
        console.log([ filePath, destPath ]);
        conn.on('ready', function() {
          conn.sftp(function(err, sftp) {
            if (err) throw err;
            var options = options || {};
            options.autoClose = true;
            var read = sftp.createReadStream(filePath, options);
            read.on('error', function(error) {
              err = error;
              conn.end();
              if(done) done(err, null);
            }).on('end', function() {
              conn.end();
              if(done) done(null, filePath);
              // if(done) done(null, { 'out': { 'msg': filePath } });
            });
            try {
              var ws = fs.createWriteStream(destPath);
              read.pipe(ws);
            } catch(e) {
              read.end(); 
            }
          });
        }).connect( dest );
      }

    };

  }

  module.exports = Shell;
})();
