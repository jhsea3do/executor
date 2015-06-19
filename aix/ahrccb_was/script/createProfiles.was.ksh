##############################################################################################
#       This script creates WAS profiles       
#
#       Usage example: $ScriptDir/createProfiles.was.ksh < cell | stand > DmgrhostName DmgrsoapPort
###############################################################################################

#! /usr/bin/ksh -

. ./WasInstall.cfg
log=/usr/wasinstall/`hostname`.was.createProfiles.log
>$log

_exec_cmd(){
   echo "Time:`date '+%y%m%d %T'` # $cmd" | tee -a $log
   eval $cmd; rc=$?
   echo "Time:`date '+%y%m%d %T'` # $cmd ($rc) \n" | tee -a $log
   [ $rc -ne 0 ] && { exit $rc; }; sleep 5
}

#create profiles
if [ "$1" = "cell" ]
then
  cmd="$wasinstalldir/bin/manageprofiles.sh -create -profileName "Dmgr01" -profilePath "$wasinstalldir/profiles/Dmgr01" -templatePath "$wasinstalldir/profileTemplates/dmgr" -hostName `hostname`";_exec_cmd;
  cmd="$wasinstalldir/bin/manageprofiles.sh -create -profileName "AppSrv01" -profilePath "$wasinstalldir/profiles/AppSrv01" -templatePath "$wasinstalldir/profileTemplates/default" -hostName `hostname`";_exec_cmd;
  cmd="$wasinstalldir/profiles/Dmgr01/bin/startManager.sh";_exec_cmd;
fi

if [ "$1" = "stand" ]
then
echo a
  cmd="$wasinstalldir/bin/manageprofiles.sh -create -profileName "AppSrv01" -profilePath "$wasinstalldir/profiles/AppSrv01" -templatePath "$wasinstalldir/profileTemplates/default" -hostName `hostname`";_exec_cmd;
fi

#addNode
cmd="$wasinstalldir/profiles/AppSrv01/bin/addNode.sh $2 $3";_exec_cmd;

echo "Time:`date '+%y%m%d %T'`   $0 $@ END \n" | tee -a $log
