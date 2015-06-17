(function(){
var should = require('should'),
    uuid   = require('uuid'),
    path   = require('path');
  
var cmds = {
    "cmd-test": {
      "name": "cmd-test", "type": "shell", "exec": "sleep 5 && echo OK",
      "node": {"host": "localhost", "addr": "127.0.0.1"},
      "cred": {"user": "cloudm", "pass": "123456"}
    },
    "touch-test": {
      "name": "touch-test", "type": "touch", "exec": "/tmp/touch-test.tmp.txt",
      "file": path.join(__dirname, 'Shell.js'),
      "node": {"host": "localhost", "addr": "127.0.0.1"},
      "cred": {"user": "cloudm", "pass": "123456"}
    },
    "dl-test": {
      "name": "touch-test", "type": "touch", "exec": "/tmp/touch-test.tmp.txt",
      "file": '/tmp/aaa',
      "node": {"host": "localhost", "addr": "127.0.0.1"},
      "cred": {"user": "cloudm", "pass": "123456"}
    }
};

module.exports = [

function(client) {
  return function() {
    var Shell = require('../../src/shell');
    var shell = new Shell(cmds['cmd-test'], function(err, data) {
      console.log([String(err||'').trim(), String(data||'').trim()]);
      should.not.exist(err);
      should(String(data).trim()).equal('OK');
    });
    shell.exec();
  }
},

function(client) {
  return function() {
    var Shell = require('../../src/shell');
    var shell = new Shell(cmds['touch-test'], function(err, data) {
      // console.log('done sftp');
      console.log([err, data]);
      should.not.exist(err);
      should(data).equal('/tmp/touch-test.tmp.txt');
    });
    shell.sftp();
  }
},

function(client) {
  return function() {
    var Shell = require('../../src/shell');
    var shell = new Shell(cmds['dl-test'], function(err, data) {
      console.log([err, data]);
      should.not.exist(err);
      // should(data).equal('/tmp/touch-test.tmp.txt');
    });
    shell.sget();
  }
}

];

})();
