(function() {

  var _     = require('lodash'),
      fs    = require('fs'),
      path  = require('path');

  var app_home = path.join(__dirname, '..', '..');

  var ftp = [ "ftphost", "ftpuser", "ftppass" ];

  var cluster = { 
    "name": "aix713-was",
    "nodes": [{ 
      "role": "cell",
      "addr": "10.58.0.134",
      "host": "aix713-was-1435809061697"
    }, {
      "role": "stand",
      "addr": "10.58.0.135",
      "host": "aix713-was-1435809064996"
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
  })('aix/ahrccb_was');

  var helpers = {
    'hostname.helper.sh': path.join(app_home, 'shell', 'hostname.helper.sh'),
    'hosts.helper.sh':    path.join(app_home, 'shell', 'hosts.helper.sh')
  };

  var prepare_steps = [
    { "name": "scripts"      },
    { "name": "put-hostname" },
    { "name": "set-hostname" },
    { "name": "put-hosts"    },
    { "name": "gen-hosts"    },
    { "name": "set-hosts"    },
    { "name": "files"        },
    { "name": "chmod"        }
  ];

  var install_steps = [
    { "name": "prepare.was.ksh" },
    { "name": "inst.was.ksh" }
  ];

  var cluster_steps = [
    { "name": "createProfiles.was.ksh" }
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
    var sort = function(a,b){ return ( role(a) == 'cell')?0:1; };
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

    jobs.prepare['gen-hosts'] = function(j, s) {
      var steps = get_raws(function(step) {
        var target  = [ '/script', 'hosts.tmp' ].join('/');
        var content = nodes.map(function(node){
          var line  = [ node.addr, node.host ].join("\t");
          return line;
        }).join("\n");
        var conenc = new Buffer( content ).toString('base64');
        step.async = true;
        step.exec  = target;
        step.type  = 'scat';
        step.text  = 'data:text/plain;base64,' + conenc;
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      }); 
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.prepare['set-hosts'] = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        step.exec  = 'cd /script && sh ./hosts.helper.sh /script/hosts.tmp /etc/hosts';
        step.type  = 'scmd';
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

    jobs.install['prepare.was.ksh'] = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        step.exec  = 'cd /script && ./prepare.was.ksh ' + ftp.join(' ');
        step.type  = 'scmd';
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.install['inst.was.ksh'] = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        step.exec  = 'cd /script && ./inst.was.ksh /opt/ibm/im';
        step.type  = 'scmd';
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.cluster['createProfiles.was.ksh'] = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        var cell   = _.find( cluster.nodes, { 'role': 'cell' } );
        var role   = _.find( cluster.nodes, step.node ).role;
        step.exec  = 'cd /script && ./createProfiles.was.ksh ' + role
                     + ' ' + cell.host + ' ' + 8879;
        step.type  = 'scmd';
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
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
