(function() {
'use strict';
module.exports = function(mongoose){
  return { 
    'Run': require('./services/Run')(mongoose)
  };
};
})();
