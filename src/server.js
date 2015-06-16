(function(){

var fs             = require('fs'),
    path           = require('path'),
    _              = require('lodash'),
    express        = require('express'),
    bodyParser     = require('body-parser'),
    methodOverride = require('method-override'),
    config         = require('./config');

    config.APP_LIB  = path.join(__dirname);
    config.APP_HOME = path.join(__dirname, '..');
    config.APP_PORT = 3000;
    config.APP_NAME = 'ams';

var server = express();
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.use(methodOverride());

var run = function(name, port) {
    server.use( require('./router') );
    server.listen(port, function() {
      console.log("server [%s] listening on port %s", name, port);
    });
    return server;
}

if(process) {
  // add run time hooks;
  var stderr = path.join(config.APP_HOME, 'ams.err');
  var stdout = path.join(config.APP_HOME, 'ams.out');
  var sprintf = require('sprintf');
  /*
  console.log = function () {
    var data = sprintf.apply(null, arguments);
    var text = [data, "\n"].join('');
    fs.appendFile(stdout, text);
    // process.stdout.write(text);
  };
  */
  process.on('uncaughtException', function (err) {
    var data = [ new Date(), err.stack ].join("\n");
    console.log(data);
  });
};

if(process && path.basename(process.argv[1]) == 'server.js') {
  port =  config.port || config.APP_PORT;
  name =  config.name || config.APP_NAME;
  run(name, port);
}

module.exports = run;

})();
