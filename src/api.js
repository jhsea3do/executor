(function() {
'use strict';
var Run = function(req, res, next) {
  res.send('in run');
};
module.exports = {
  'Run': Run
};
})();
