(function() {
'use strict';
module.exports = function(mongoose){
  return { 
    'Run': require('./services/Run')(mongoose),
    'Cmd': require('./services/Cmd')(mongoose)
  };
};
})();
