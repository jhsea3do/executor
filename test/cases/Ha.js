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


/*
cluster=aix713-db2
ha1=aix713-was-1435809061697
ha2=aix713-was-1435809064996
ha1svc=aix713-was-1435809061697-svc
ha2svc=aix713-was-1435809064996-svc
ha1per=aix713-was-1435809061697-per
ha2per=aix713-was-1435809064996-per
ha1ip=10.58.0.134
ha2ip=10.58.0.135
ha1svcip=9.58.0.101
ha2svcip=9.58.0.102
ha1perip=9.58.1.101
ha2perip=9.58.1.102
ftphost=ftphost
ftpuser=ftpuser
ftppass=ftppass
ftppath=/pub/ahrccb/DB2/
homepv=hdisk1
datapv=hdisk3,hdisk4
caappv=hdisk2
homevg=datavg1
datavg=datavg2
homelv=db2homelv
datalv=db2datalv
homefs=/db2home
datafs=/db2data
hamode=AA
haap1=ap01
hargnum=1
harg1=rg_hln01
harg1vgs=${homevg},${datavg}
db2insusr=db2inst1
db2insgrp=db2iadm1
db2fenusr=db2fenc1
db2fengrp=db2fadm1
db2dasusr=dasusr1
db2dasgrp=dasadm1
db2file=v10.1fp4_aix64_server.tar.gz
db2path=${homefs}/install
db2base=/opt/ibm/db2/V10.1
db2name=sample
cluster=aix713-db2
ha1=aix713-was-1435809061697
ha2=aix713-was-1435809064996
ha1svc=aix713-was-1435809061697-svc
ha2svc=aix713-was-1435809064996-svc
ha1per=aix713-was-1435809061697-per
ha2per=aix713-was-1435809064996-per
ha1ip=10.58.0.134
ha2ip=10.58.0.135
ha1svcip=9.58.0.101
ha2svcip=9.58.0.102
ha1perip=9.58.1.101
ha2perip=9.58.1.102
ftphost=ftphost
ftpuser=ftpuser
ftppass=ftppass
ftppath=/pub/ahrccb/DB2/
homepv=hdisk1
datapv=hdisk3,hdisk4
caappv=hdisk2
homevg=datavg1
datavg=datavg2
homelv=db2homelv
datalv=db2datalv
homefs=/db2home
datafs=/db2data
hamode=AA
haap1=ap01
hargnum=1
harg1=rg_hln01
harg1vgs=${homevg},${datavg}
db2insusr=db2inst1
db2insgrp=db2iadm1
db2fenusr=db2fenc1
db2fengrp=db2fadm1
db2dasusr=dasusr1
db2dasgrp=dasadm1
db2file=v10.1fp4_aix64_server.tar.gz
db2path=${homefs}/install
db2base=/opt/ibm/db2/V10.1
db2name=sample
{"name":"aix713-db2","jobs":[{"name":"prepare-scripts","type":"series","steps":[{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"mkdir -p /script","type":"scmd","name":"prepare-scripts#aix713-was-1435809061697"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"mkdir -p /script","type":"scmd","name":"prepare-scripts#aix713-was-1435809064996"}]},{"name":"prepare-put-hostname","type":"series","steps":[{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/hostname.helper.sh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/shell/hostname.helper.sh","name":"prepare-put-hostname#aix713-was-1435809061697"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/hostname.helper.sh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/shell/hostname.helper.sh","name":"prepare-put-hostname#aix713-was-1435809064996"}]},{"name":"prepare-set-hostname","type":"series","steps":[{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"cd /script && sh ./hostname.helper.sh aix713-was-1435809061697","type":"scmd","name":"prepare-set-hostname#aix713-was-1435809061697"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"cd /script && sh ./hostname.helper.sh aix713-was-1435809064996","type":"scmd","name":"prepare-set-hostname#aix713-was-1435809064996"}]},{"name":"prepare-files","type":"series","steps":[{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/audb.sh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/audb.sh","name":"prepare-files#aix713-was-1435809061697#audb.sh"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/audb.sh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/audb.sh","name":"prepare-files#aix713-was-1435809064996#audb.sh"},{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/ha_setup.ksh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/ha_setup.ksh","name":"prepare-files#aix713-was-1435809061697#ha_setup.ksh"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/ha_setup.ksh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/ha_setup.ksh","name":"prepare-files#aix713-was-1435809064996#ha_setup.ksh"},{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/importvg.ksh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/importvg.ksh","name":"prepare-files#aix713-was-1435809061697#importvg.ksh"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/importvg.ksh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/importvg.ksh","name":"prepare-files#aix713-was-1435809064996#importvg.ksh"},{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/install.db2.ksh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/install.db2.ksh","name":"prepare-files#aix713-was-1435809061697#install.db2.ksh"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/install.db2.ksh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/install.db2.ksh","name":"prepare-files#aix713-was-1435809064996#install.db2.ksh"},{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/mkvg.ksh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/mkvg.ksh","name":"prepare-files#aix713-was-1435809061697#mkvg.ksh"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/mkvg.ksh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/mkvg.ksh","name":"prepare-files#aix713-was-1435809064996#mkvg.ksh"},{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/prepare.db2.ksh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/prepare.db2.ksh","name":"prepare-files#aix713-was-1435809061697#prepare.db2.ksh"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/prepare.db2.ksh","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/prepare.db2.ksh","name":"prepare-files#aix713-was-1435809064996#prepare.db2.ksh"},{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/prepare.db2.lst.sample","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/prepare.db2.lst.sample","name":"prepare-files#aix713-was-1435809061697#prepare.db2.lst.sample"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/prepare.db2.lst.sample","type":"sput","file":"/home/cloudm/works/tcloud2-ams/aix/ahrccb_ha/script/prepare.db2.lst.sample","name":"prepare-files#aix713-was-1435809064996#prepare.db2.lst.sample"}]},{"name":"prepare-prepare.db2.lst","type":"series","steps":[{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/prepare.db2.lst","type":"scat","text":"data:text/plain;base64,Y2x1c3Rlcj1haXg3MTMtZGIyCmhhMT1haXg3MTMtd2FzLTE0MzU4MDkwNjE2OTcKaGEyPWFpeDcxMy13YXMtMTQzNTgwOTA2NDk5NgpoYTFzdmM9YWl4NzEzLXdhcy0xNDM1ODA5MDYxNjk3LXN2YwpoYTJzdmM9YWl4NzEzLXdhcy0xNDM1ODA5MDY0OTk2LXN2YwpoYTFwZXI9YWl4NzEzLXdhcy0xNDM1ODA5MDYxNjk3LXBlcgpoYTJwZXI9YWl4NzEzLXdhcy0xNDM1ODA5MDY0OTk2LXBlcgpoYTFpcD0xMC41OC4wLjEzNApoYTJpcD0xMC41OC4wLjEzNQpoYTFzdmNpcD05LjU4LjAuMTAxCmhhMnN2Y2lwPTkuNTguMC4xMDIKaGExcGVyaXA9OS41OC4xLjEwMQpoYTJwZXJpcD05LjU4LjEuMTAyCmZ0cGhvc3Q9ZnRwaG9zdApmdHB1c2VyPWZ0cHVzZXIKZnRwcGFzcz1mdHBwYXNzCmZ0cHBhdGg9L3B1Yi9haHJjY2IvREIyLwpob21lcHY9aGRpc2sxCmRhdGFwdj1oZGlzazMsaGRpc2s0CmNhYXBwdj1oZGlzazIKaG9tZXZnPWRhdGF2ZzEKZGF0YXZnPWRhdGF2ZzIKaG9tZWx2PWRiMmhvbWVsdgpkYXRhbHY9ZGIyZGF0YWx2CmhvbWVmcz0vZGIyaG9tZQpkYXRhZnM9L2RiMmRhdGEKaGFtb2RlPUFBCmhhYXAxPWFwMDEKaGFyZ251bT0xCmhhcmcxPXJnX2hsbjAxCmhhcmcxdmdzPSR7aG9tZXZnfSwke2RhdGF2Z30KZGIyaW5zdXNyPWRiMmluc3QxCmRiMmluc2dycD1kYjJpYWRtMQpkYjJmZW51c3I9ZGIyZmVuYzEKZGIyZmVuZ3JwPWRiMmZhZG0xCmRiMmRhc3Vzcj1kYXN1c3IxCmRiMmRhc2dycD1kYXNhZG0xCmRiMmZpbGU9djEwLjFmcDRfYWl4NjRfc2VydmVyLnRhci5negpkYjJwYXRoPSR7aG9tZWZzfS9pbnN0YWxsCmRiMmJhc2U9L29wdC9pYm0vZGIyL1YxMC4xCmRiMm5hbWU9c2FtcGxl","name":"prepare-prepare.db2.lst#aix713-was-1435809061697"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"/script/prepare.db2.lst","type":"scat","text":"data:text/plain;base64,Y2x1c3Rlcj1haXg3MTMtZGIyCmhhMT1haXg3MTMtd2FzLTE0MzU4MDkwNjE2OTcKaGEyPWFpeDcxMy13YXMtMTQzNTgwOTA2NDk5NgpoYTFzdmM9YWl4NzEzLXdhcy0xNDM1ODA5MDYxNjk3LXN2YwpoYTJzdmM9YWl4NzEzLXdhcy0xNDM1ODA5MDY0OTk2LXN2YwpoYTFwZXI9YWl4NzEzLXdhcy0xNDM1ODA5MDYxNjk3LXBlcgpoYTJwZXI9YWl4NzEzLXdhcy0xNDM1ODA5MDY0OTk2LXBlcgpoYTFpcD0xMC41OC4wLjEzNApoYTJpcD0xMC41OC4wLjEzNQpoYTFzdmNpcD05LjU4LjAuMTAxCmhhMnN2Y2lwPTkuNTguMC4xMDIKaGExcGVyaXA9OS41OC4xLjEwMQpoYTJwZXJpcD05LjU4LjEuMTAyCmZ0cGhvc3Q9ZnRwaG9zdApmdHB1c2VyPWZ0cHVzZXIKZnRwcGFzcz1mdHBwYXNzCmZ0cHBhdGg9L3B1Yi9haHJjY2IvREIyLwpob21lcHY9aGRpc2sxCmRhdGFwdj1oZGlzazMsaGRpc2s0CmNhYXBwdj1oZGlzazIKaG9tZXZnPWRhdGF2ZzEKZGF0YXZnPWRhdGF2ZzIKaG9tZWx2PWRiMmhvbWVsdgpkYXRhbHY9ZGIyZGF0YWx2CmhvbWVmcz0vZGIyaG9tZQpkYXRhZnM9L2RiMmRhdGEKaGFtb2RlPUFBCmhhYXAxPWFwMDEKaGFyZ251bT0xCmhhcmcxPXJnX2hsbjAxCmhhcmcxdmdzPSR7aG9tZXZnfSwke2RhdGF2Z30KZGIyaW5zdXNyPWRiMmluc3QxCmRiMmluc2dycD1kYjJpYWRtMQpkYjJmZW51c3I9ZGIyZmVuYzEKZGIyZmVuZ3JwPWRiMmZhZG0xCmRiMmRhc3Vzcj1kYXN1c3IxCmRiMmRhc2dycD1kYXNhZG0xCmRiMmZpbGU9djEwLjFmcDRfYWl4NjRfc2VydmVyLnRhci5negpkYjJwYXRoPSR7aG9tZWZzfS9pbnN0YWxsCmRiMmJhc2U9L29wdC9pYm0vZGIyL1YxMC4xCmRiMm5hbWU9c2FtcGxl","name":"prepare-prepare.db2.lst#aix713-was-1435809064996"}]},{"name":"prepare-chmod","type":"series","steps":[{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"chmod +x /script/*.ksh && chmod +x /script/*.sh","type":"scmd","name":"prepare-chmod#aix713-was-1435809061697"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"chmod +x /script/*.ksh && chmod +x /script/*.sh","type":"scmd","name":"prepare-chmod#aix713-was-1435809064996"}]},{"name":"install-prepare.db2.ksh","type":"series","steps":[{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"cd /script && ./prepare.db2.ksh ha1","type":"scmd","name":"install-prepare.db2.ksh#aix713-was-1435809061697"},{"node":{"host":"aix713-was-1435809064996","addr":"10.58.0.135"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"cd /script && ./prepare.db2.ksh ha2","type":"scmd","name":"install-prepare.db2.ksh#aix713-was-1435809064996"}]},{"name":"cluster-install.db2.ksh","type":"series","steps":[{"node":{"host":"aix713-was-1435809061697","addr":"10.58.0.134"},"cred":{"user":"root","pass":"passw0rd"},"async":true,"exec":"cd /script && ./install.db2.ksh ha1","type":"scmd","name":"cluster-install.db2.ksh#aix713-was-1435809061697"}]}]}
*/
