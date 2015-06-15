(function(){

var path           = require('path'),
    express        = require('express'),
    bodyParser     = require('body-parser'),
    methodOverride = require('method-override'),
    config         = require('./config');

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
    

if(process && path.basename(process.argv[1]) == 'server.js') {
  port =  config.port || 3000;
  name =  config.name || 'ams';
  run(name, port);
}

module.exports = run;

})();
