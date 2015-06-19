##############################################################################################
#       This script install WAS InstallManager 1.6.2 $ WAS8.5.5.5
#
#       Usage example: $ScriptDir/inst.was.ksh $InstallManagerinstallationDirectory
###############################################################################################

#! /usr/bin/ksh -

. ./WasInstall.cfg
log=/usr/wasinstall/`hostname`.was.install.log
>$log

_exec_cmd(){
   echo "Time:`date '+%y%m%d %T'` # $cmd" | tee -a $log
   eval $cmd; rc=$?
   echo "Time:`date '+%y%m%d %T'` # $cmd ($rc) \n" | tee -a $log
   [ $rc -ne 0 ] && { exit $rc; }; sleep 5
}

#install InstallManager
cmd="$immediadir/installc -acceptLicense -installationDirectory $1 -silent";_exec_cmd;

#check InstallManager version
imversion=`$1/eclipse/tools/imcl -version|sed -n 2p|awk '{print $2}'`
if [ $imversion == "1.6.2" ]
then 
  cmd="echo InstallManager installed Success";_exec_cmd;
else
  cmd="echo InstallManager installed Failed";_exec_cmd;
  cmd="exit";_exec_cmd;
fi

#install WAS8.5.5
cmd="$1/eclipse/tools/imcl -acceptLicense input $respfiledir/installWas855.xml";_exec_cmd;

#check WAS version
wasversion=`$wasinstalldir/bin/versionInfo.sh |grep Version|grep \ \ |grep -v Directory|awk '{print $2}'`
if [ $wasversion == "8.5.5.0" ]
then
  cmd="echo WAS installed Success";_exec_cmd;
else
  cmd="echo WAS installed Failed";_exec_cmd;
  cmd="exit";_exec_cmd;
fi

#update WAS8.5.5.5
cmd="$1/eclipse/tools/imcl -acceptLicense input $respfiledir/updateWas8555.xml";_exec_cmd;
wasversion=`$wasinstalldir/bin/versionInfo.sh |grep Version|grep \ \ |grep -v Directory|awk '{print $2}'`
if [ $wasversion == "8.5.5.5" ]
then
  cmd="echo WAS updated Success";_exec_cmd;
else
  cmd="echo WAS updated Failed";_exec_cmd;
  cmd="exit";_exec_cmd;
fi

echo "Time:`date '+%y%m%d %T'`   $0 $@ END \n" | tee -a $log
