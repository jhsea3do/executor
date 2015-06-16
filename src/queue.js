(function(){
  var kue = require('kue');
  var q = null;
  var h = {};
  h.open = function() {
    try {
      q = kue.createQueue();
    } catch (e) { q = null; } 
    return q;
  };
  h.save = function(name, json, priority) {
    if(null == q) h.open();
    priority = priority || 'normal';
    var job = null;
    try {
      job = q.create(name, json).priority(priority).save();
    } catch (e) { 
      throw 'save queue failed!'; 
    }
    return job;
  };
  h.proc = function(name, handler, count) {
    if(null == q) h.open();
    // count = count || 5;
    try {
      q.process(name, handler);
    } catch (e) { 
      throw 'save queue failed!';
    }
  };
  module.exports = h;
})();
