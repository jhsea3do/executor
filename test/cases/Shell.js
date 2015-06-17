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
    "script-test": {
      "name": "script-test", "type": "shell", "exec": "sh " + path.join(__dirname, '..', 'scripts', 'test.sh'),
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
      "name": "dl-test", "type": "touch", "exec": "/tmp/touch-test.tmp.txt",
      "file": '/tmp/aaa',
      "node": {"host": "localhost", "addr": "127.0.0.1"},
      "cred": {"user": "cloudm", "pass": "123456"}
    }
};

module.exports = [

function(client) {
  return function() {
    var Shell = require('../../src/shell');
    var shell = new Shell(cmds['script-test'], function(err, ret) {
      if(ret) {
        console.log([ret.num, String(ret.err||'').trim(), String(ret.out||'').trim()]);
      } else {
        console.log([err]);
      }
      should.not.exist(err);
      should(ret.num).equal(1);
      should(String(ret.out).trim()).equal('12345');
      // should.not.exist(err);
      // should(String(data).trim()).equal('OK');
    });
    shell.exec();
  }
},

function(client) {
  return function() {
    var Shell = require('../../src/shell');
    var shell = new Shell(cmds['cmd-test'], function(err, ret) {
      if(ret) {
        console.log([ret.num, String(ret.err||'').trim(), String(ret.out||'').trim()]);
      } else {
        console.log([err]);
      }
      should.not.exist(err);
      should(String(ret.out).trim()).equal('OK');
    });
    shell.exec();
  }
},

/*
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
*/
];

})();
