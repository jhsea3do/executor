(function() {

var Echo = function(mongoose) {
  // 
  return function(req, res, next) {
    var method = req.method.toUpperCase();
    if('POST' == method) {
      res.status(201).json(req.body);
    } else {
      res.status(400).json({"msg": "No Supported !"});
    }
  }
};

module.exports = Echo;
})();
