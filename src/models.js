(function(){
'use strict';
var fs       = require('fs'),
    path     = require('path'),
    _        = require('lodash'),
    mongoose = require('mongoose');

var dir = path.join(__dirname, 'models');

var services = {
  '__db__': function(mongoose) {
    return mongoose;
  }
};

var addModel = function(file) {
  if(!file.match(/\.js$/)) return;
  var model  = file.replace(/\.js$/, '');
  var schema = require([ '.', 'models', model].join('/'));
  services[model] = function(mongoose) {
    return mongoose.model(model, mongoose.Schema(schema));
  };
};

fs.readdirSync(dir).map(addModel);

module.exports = function(mongoose) { 
  return _.transform(services, function(r,s,n){
    r[n] = s(mongoose);
  });
};

})();
