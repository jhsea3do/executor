(function(){
var schema = {
  "uuid":       String,
  "created_at": { type: Number, default: Date.now },
  "started_at": Number,
  "updated_at": Number,
  "status":     { type: Number, default: 0 },
  "result":     String,
  "retnum":     { type: Number, default: -1 },
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
