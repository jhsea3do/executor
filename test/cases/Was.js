(function() {

  var _     = require('lodash'),
      fs    = require('fs'),
      path  = require('path');

  var app_home = path.join(__dirname, '..', '..');

  var hosts = [
    { "host": "aix71was0.dc", "addr": "10.58.0.134", "conf": { "was": "cell" } },
    { "host": "aix71was1.dc", "addr": "10.58.0.135", "conf": { "was": "stand" } },
    { "host": "aix71was2.dc", "addr": "10.58.0.136", "conf": { "was": "stand" } }
  ];

  var ftp = [ "10.48.0.210", "htzhang", "8uhbvgy7" ];

  var files = (function(ctg) {
    dir = path.join(app_home, ctg, 'script');
    // console.log( fs.readdirSync(dir) );
    return fs.readdirSync(dir).map(function( file ) {
      return path.join(dir, file)
    });
  })('aix/ahrccb_was');

  var prepare_steps = [
    { "name": "hosts"   },
    { "name": "scripts" },
    { "name": "files"   },
    { "name": "chmod"   }
  ];

  var install_steps = [
    { "name": "prepare.was.ksh" },
    { "name": "inst.was.ksh" }
  ];

  var cluster_steps = [
    { "name": "createProfiles.was.ksh" } /*,
  //  { "name": "logs" } */
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

  var get_creds = function(host) {
    return creds[host.host] || creds['default'];
  };

  var get_steps = (function(hosts, files, creds) {
    var jobs = {};
    var sort = function(a,b){ return (a.conf.was == 'cell')?0:1; };
    var get_raws = function( cb ) {
      return hosts.sort(sort).map(function(host) {
        var step  = {};
        step.node = { "host": host.host, "addr": host.addr };
        step.cred = get_creds(host);
        cb(step);
        return step;
      });
    };
    jobs.prepare = {};
    jobs.install = {};
    jobs.cluster = {};
    jobs.prepare.hosts = function(j, s) {
      var steps = get_raws(function(step) {
        step.hosts = hosts.map(function(host) {
          return { "host": host.host, "addr": host.addr }
        });
        step.async = true;
        step.exec  = 'hosts.helper.sh';
        step.type  = 'shos';
        step.name  = [ [j, s].join('-'), step.node.host ].join('#');
      });
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.prepare.scripts = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        step.exec  = 'mkdir -p /script';
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

      // console.log(steps);
      return { "name": [j, s].join('-'), "type": "series", "steps": steps }
    };

    jobs.prepare.chmod = function(j, s) {
      var steps = get_raws(function(step) {
        step.async = true;
        step.exec  = 'chmod 755 /script/*.ksh';
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
        var host   = _.find(hosts, step.node);
        var cell   = _.find(hosts, { "conf": { "was": "cell"} });
        step.exec  = 'cd /script && ./createProfiles.was.ksh ' + host.conf.was
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

  })(hosts, files, creds);

  var task = {  "name": "aix71-was", "jobs": [] };

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
