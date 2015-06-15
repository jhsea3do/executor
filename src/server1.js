(function(){
  var restify   = require('restify'),
      config    = require('./config'),
      routes    = require('./routes'),
      Api       = require('./api');

  var    api    = new Api(config);
  var server    = restify.createServer(api);
  routes(api, server, restify, function(server) {
    server.listen(3003, function(){
      console.log('Api server [%s] listening at %s',
        server.name, server.url);
    });
  });
  
})();
