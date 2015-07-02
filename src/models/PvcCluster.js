(function(){
var schema = {
  "name":       String,
  "uuid":       String,
  "nodes":      Array,
  "type":       String,
  "options":    Object,
  "created_at": { type: Number, default: Date.now },
  "updated_at": Number,
  "status":     { type: Number, default: 0 }
};
// nodes = [
//   { "uuid": pvcNode1.uuid, "role": "cell",  "addr": "..." }, 
//   { "uuid": pvcNode2.uuid, "role": "stand" }, { "uuid": pvcNode3.uuid }
// ]
// uuid = schedule.uuid
// status = 0
// type in [ 'was', 'db2' ]
module.exports = schema;
})();
