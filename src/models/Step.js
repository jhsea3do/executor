(function(){
var schema = {
  "uuid":       String,
  "task":       { 'uuid': String, 'seq': Number  },
  "job":        { 'uuid': String, 'seq': Number  },
  "name":       { type: String, required: true   },
  "type":       { type: String, default: 'shell' },
  "exec":       { type: String, required: true   },
  "node":       { type: Object, required: true   }, 
  "cred":       { type: Object, required: true   }
};
module.exports = schema;
})();
