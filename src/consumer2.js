(function() {
  var EventEmitter2 = require('eventemitter2').EventEmitter2;
  var _ = require('lodash');

  var Consumer = function(options) {
    var emitter = new EventEmitter2();
    var core    = function() {
    };
    var methods = {};
    methods.run = function() {
      console.log([this.name, 'run']);
      return this;
    };
    methods.on = function(name, handle) {
      emitter.on(name, handle.bind(this));
      return this;
    };
    methods.emit = function(args) {
      emitter.emit(args);
      return this;
    };
    _.extend(core.prototype, methods, options);
    return new core();
  };

  var consumer1 = new Consumer({
    'name': 'con1'
  });
  var consumer2 = new Consumer({
    'name': 'con2'
  });
  consumer1.on('test', function() {
    console.log([ this.name, 'test' ]);
  }).run().emit('test');
  consumer2.run().emit('test');
})();
