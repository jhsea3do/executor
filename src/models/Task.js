(function(){
var schema = {
  "name":       String,
  "uuid":       String,
  "created_at": { type: Number, default: Date.now },
  "started_at": Number,
  "updated_at": Number,
  "status":     { type: Number, default: 0 },
  "steps":      { type: Number, default: 0 },
  "total":      { type: Number, default: 0 },
  "result":     { type: Number, default: 0 },
  "jobs": [{
    "name": String,
    "uuid": String,
    "type": { type: String, default: "series" },
    "steps": Array
  }]
};
module.exports = schema;
})();
