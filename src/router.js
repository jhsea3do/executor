(function(){
'use strict';
var _         = require('lodash'),
    express   = require('express'),
    mongoose  = require('mongoose'),
    erm       = require('express-restify-mongoose'),
    models    = require('./models')(mongoose),
    api       = require('./api')(mongoose);

var sep     = '/';
var router  = express.Router();
var apiver  = 'v2';
var apipre  = ['', 'api', apiver].join(sep);
var odtpre  = ['', 'odata'].join(sep);
// var bf_route = function(req, res, next) { next(); };
// router.use(bf_route);
router.get(sep, function(req, res){
  res.send('tcloud2:ams');
});
// add api
_.each(api, function(f, k) {
  router.use( [apipre, k].join(sep), f );
});
// add models 
_.each(models, function(m, k) {
  if(k.match(/^__.*?__$/)) return;
  erm.serve(router, m, { 'prefix': '/odata', 'version': '' })
});
models['__db__'].connect('mongodb://localhost/ams');
module.exports = router;
})();
