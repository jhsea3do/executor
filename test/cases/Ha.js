(function() {

  var _     = require('lodash'),
      fs    = require('fs'),
      path  = require('path');

  var app_home = path.join(__dirname, '..', '..');

  var ftp = [ "ftphost", "ftpuser", "ftppass" ];

  var cluster = { 
    "name": "aix713-db2",
    "nodes": [{ 
      "role": "ha1",
      "addr": "10.58.0.117",
      "host": "aix713-db2-1435922625041"
    }, {
      "role": "ha2",
      "addr": "10.58.0.118",
      "host": "aix713-db2-1435922628295"
    }] 
  };

  var nodes = [ ];

  _.each( cluster.nodes, function(node) {
    nodes.push({ "host": node.host, "addr": node.addr });
  });

  var files = (function(ctg) {
    dir = path.join(app_home, ctg, 'script');
    // console.log( fs.readdirSync(dir) );
    return fs.readdirSync(dir).map(function( file ) {
      return path.join(dir, file)
    });
  })('aix/ahrccb_ha');

  var helpers = {
    'hostname.helper.sh': path.join(app_home, 'shell', 'hostname.helper.sh'),
    'hosts.helper.sh':    path.join(app_home, 'shell', 'hosts.helper.sh')
  };

  var configs = [
  [ "cluster", cluster.name ],
  [ "ha1", _.find(cluster.nodes, {'role': 'ha1'}).host ],
  [ "ha2", _.find(cluster.nodes, {'role': 'ha2'}).host ],
  [ "ha1svc", _.find(cluster.nodes, {'role': 'ha1'}).host + "-svc" ],
  [ "ha2svc", _.find(cluster.nodes, {'role': 'ha2'}).host + "-svc" ],
  [ "ha1per", _.find(cluster.nodes, {'role': 'ha1'}).host + "-per" ],
  [ "ha2per", _.find(cluster.nodes, {'role': 'ha2'}).host + "-per" ],
  [ "ha1ip", _.find(cluster.nodes, {'role': 'ha1'}).addr ],
  [ "ha2ip", _.find(cluster.nodes, {'role': 'ha2'}).addr ],
  [ "ha1svcip", "9.58.0.101" ],
  [ "ha2svcip", "9.58.0.102" ],
  [ "ha1perip", "9.58.1.101" ],
  [ "ha2perip", "9.58.1.102" ],
  [ "ftphost", ftp[0] ],
  [ "ftpuser", ftp[1] ],
  [ "ftppass", ftp[2] ],
  [ "ftppath", "/pub/ahrccb/DB2/" ],
  [ "homepv", "hdisk1" ],
  [ "datapv", "hdisk3,hdisk4" ],
  [ "caappv", "hdisk2" ],
  [ "homevg", "datavg1" ],
  [ "datavg", "datavg2" ],
  [ "homelv", "db2homelv" ],
  [ "datalv", "db2datalv" ],
  [ "homefs", "/db2home" ],
  [ "datafs", "/db2data" ],
  [ "hamode", "AA" ],
  [ "haap1", "ap01" ],
  [ "hargnum", "1" ],
  [ "harg1", "rg_hln01" ],
  [ "harg1vgs", "${homevg},${datavg}" ],
  [ "db2insusr", "db2inst1" ],
  [ "db2insgrp", "db2iadm1" ],
  [ "db2fenusr", "db2fenc1" ],
  [ "db2fengrp", "db2fadm1" ],
  [ "db2dasusr", "dasusr1" ],
  [ "db2dasgrp", "dasadm1" ],
  [ "db2file", "v10.1fp4_aix64_server.tar.gz" ],
  [ "db2path", "${homefs}/install" ],
  [ "db2base", "/opt/ibm/db2/V10.1" ],
  [ "db2name", "sample" ]
  ];

  var prepare_steps = [
    { "name": "scripts"      },
    { "name": "put-hosts"    },
    { "name": "put-hostname" },
    { "name": "set-hostname" },
    { "name": "files"        },
    { "name": "prepare.db2.lst"   },
    { "name": "chmod"        }
  ];

  var install_steps = [
    { "name": "prepare.db2.ksh" }
  ];

  var cluster_steps = [
    { "name": "install.db2.ksh" }
  ];

  var jobs = [
    { "name": "prepare", "steps": prepare_steps },
    { "name": "install", "steps": install_steps },
    { "name": "cluster", "steps": cluster_steps }
  ];

  var creds = { "default": {
    "user": "root",
    "pass": "passw0rd"
  }};

  var get_creds = function(node) {
    return creds[node.host] || creds['default'];
  };

  var get_steps = (function(nodes, files, creds) {
    var jobs = {};
    var role = function(node) { 
      var find = _.find( cluster.nodes, node ); 
      return find ? find.role : null;
    };
    var sort = function(a,b){ return ( role(a) == 'ha1')?0:1; };
    var get_raws = function( cb ) {
      return nodes.sort(sort).map(function(node) {
        var step  = { "node": node, "cred": get_creds(node) };
        cb(step);
        return step;
      });
    };

    jobs.prepare = {};
    jobs.install = {};
    jobs.cluster = {};

    jobs.prepare.scripts = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        step.exec  = 'mkdir -p /script';
        step.type  = 'scmd';
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.prepare['put-hostname'] = function(j, s) {
      var steps = get_raws(function(step) {
        var target = [ '/script', 'hostname.helper.sh' ].join('/');
        step.async = true;
        step.exec  = target;
        step.type  = 'sput';
        step.file  = helpers['hostname.helper.sh']
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.prepare['set-hostname'] = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        step.exec  = 'cd /script && sh ./hostname.helper.sh ' + step.node.host;
        step.type  = 'scmd';
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.prepare['put-hosts'] = function(j, s) {
      var steps = get_raws(function(step) {
        var target = [ '/script', 'hosts.helper.sh' ].join('/');
        step.async = true;
        step.exec  = target;
        step.type  = 'sput';
        step.file  = helpers['hosts.helper.sh']
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.prepare['prepare.db2.lst'] = function(j, s) {
      var steps = get_raws(function(step) {
        var target  = [ '/script', 'prepare.db2.lst' ].join('/');
        var content = configs.map(function(config){
          var line  = [ config[0], config[1] ].join("=");
          return line;
        }).join("\n");
        console.log(content);
        var conenc = new Buffer( content ).toString('base64');
        step.async = true;
        step.exec  = target;
        step.type  = 'scat';
        step.text  = 'data:text/plain;base64,' + conenc;
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      }); 
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.prepare.files = function(j, s) {
      var steps = [];
      files.map(function(file) {
        var target = path.join( '/script', path.basename(file) );
        get_raws(function(step) {
          step.async = true;
          step.exec  = target;
          step.type  = 'sput';
          step.file  = file;
          step.name  = [ [j, s].join('-'), step.node.host, path.basename(file) ].join('#');
        }).map(function(step) {
          steps.push(step);
        });
      });

      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.prepare.chmod = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        step.exec  = 'chmod +x /script/*.ksh && chmod +x /script/*.sh';
        step.type  = 'scmd';
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.install['prepare.db2.ksh'] = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        step.exec  = 'cd /script && ./prepare.db2.ksh ' + _.find(cluster.nodes, step.node).role;
        step.type  = 'scmd';
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.cluster['install.db2.ksh'] = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        step.exec  = 'cd /script && ./install.db2.ksh ' + _.find(cluster.nodes, step.node).role;
        step.type  = 'scmd';
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      var ha1 = _.find( cluster.nodes, { 'role': 'ha1'} );
      var x_steps = [ _.find( steps, { 'node': { 'host': ha1.host, 'addr': ha1.addr  } } )  ];
      return { "name": [j, s].join('-'), "type": "series", "steps": x_steps }
    };

    return function(j, s) {
      if(!jobs[j]) return;
      if(!jobs[j][s]) return;
      return jobs[j][s](j, s);
    };

  })(nodes, files, creds);

  var task = {  "name": cluster.name, "jobs": [] };

  jobs.map(function(job) {
    job.steps.map(function(step) {
      // console.log([ "###", job.name, step.name, "###" ].join("\t"));
      // console.log( JSON.stringify( get_steps( job.name, step.name ) ) );
      // console.log("\n");
      var job_steps = get_steps( job.name, step.name );
      task.jobs.push( job_steps );
    });
  });

  console.log( JSON.stringify(task) );
  // console.log( JSON.stringify( get_steps('prepare', 'hosts') ) );
})();
