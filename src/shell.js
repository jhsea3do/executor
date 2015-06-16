(function(){
  var d = { _id: '5580467edc66ac9e0f91110d',
    name: 'step3',
    exec: 'echo OK',
    node: { addr: '127.0.0.1', host: 'localhost' },
    cred: { addr: 'cloudm', user: 'cloudm' },
    uuid: 'd18ee045-26d2-4803-a181-d50ac729ccc2',
    type: 'shell',
    job: { uuid: '2bef17ca-ddbb-405a-b943-a261f80cd37b', seq: 1 },
    task: { uuid: '48e778cf-ab48-4c29-ad2c-24b0156ac26e', seq: 2 },
    result: -1,
    status: 1,
    created_at: 1434470014642,
    __v: 0,
    started_at: 1434470057936,
    updated_at: 1434470057936 
  };

  var Shell = function(data, done) {
    var conn = require('ssh2').Client();
    var fs   = require('fs');
    return {
      'exec': function() {
         var cmd = data.exec;
         conn.on('ready', function() {
           conn.exec(cmd, function(err, stream) {
             if (err) throw err;
             stream.on('close', function(code, signal) {
               conn.end();
             }).on('data', function(data) {
               // console.log([ 'out', done ]);
               if(done) done(null, data);
               // console.log('STDOUT: ' + String(data).trim());
             }).stderr.on('data', function(data) {
               // console.log([ 'err', done ]);
               if(done) done(data, null);
               // console.log('STDERR: ' + String(data).trim());
             });
           });
         }).connect({
           "host": data.node.addr,
           "port": 22,
           "username": data.cred.user,
           "privateKey": fs.readFileSync('/home/jhsea3do/.ssh/cloudm.pem')
         });
      }

    };

  }

  // var shell = new Shell(d);
  // shell.exec();
  // shell = new Shell(d);
  // shell.exec('ls -l');
  // (Shell(d)).exec();
  // (Shell(d)).exec('ls -l');
  module.exports = Shell;
})();
