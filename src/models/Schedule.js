(function(){
var Task = require('./Task');
var schema = {
  "uuid": String,
  "todo": Task
  /*
  "todo": {
     "name": String,
     "jobs": Array
  }
  */
};
module.exports = schema;
})();
