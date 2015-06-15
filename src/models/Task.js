(function(){
var schema = {
  "name": String,
  "created_at": { type: Number, default: Date.now },
  "status": { type: Number, default: 0 },
  "steps": { type: Number, default: 0 },
  "total": { type: Number },
  "result": { type: Number, default: 0 },
  "jobs": [{
    "name": String,
    "type": { type: String, default: "series" },
    "seqs": [{
      type: String
    }]
  }]
};
module.exports = schema;
})();
