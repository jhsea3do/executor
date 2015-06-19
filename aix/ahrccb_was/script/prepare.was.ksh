##############################################################################################
#       This script install WAS InstallManager 1.6.2 $ WAS8.5.5.5
#
#       Usage example: $ScriptDir/inst.was.ksh ftpserver ftpuser ftpuserpasswd
###############################################################################################

#! /usr/bin/ksh -

. ./WasInstall.cfg

mkdir -p /usr/wasinstall/wasbase
mkdir -p /usr/wasinstall/fix
mkdir -p /usr/wasinstall/instmgr

log=/usr/wasinstall/`hostname`.was.prepare.log
>$log

_exec_cmd(){
   echo "Time:`date '+%y%m%d %T'` # $cmd" | tee -a $log
   eval $cmd; rc=$?
   echo "Time:`date '+%y%m%d %T'` # $cmd ($rc) \n" | tee -a $log
   [ $rc -ne 0 ] && { exit $rc; }; sleep 5
}


#filesystem
ulimit -f unlimited
cmd="chfs -a size=15G /usr";_exec_cmd;
cmd="chfs -a size=4G /var";_exec_cmd;

#ftp media
cmd="echo begin_ftp";_exec_cmd;

ftp -n $1  <<!
user $2 $3
bin
prom
cd /pub/ahrccb/WAS8.5_MEDIA
lcd /usr/wasinstall/wasbase
mget WASND_v8.5.5_*of3.zip
lcd /usr/wasinstall/fix
mget 8.5.5-WS-WAS-FP0000005-part*.zip
lcd /usr/wasinstall/instmgr
mget Install_Mgr_v1.6.2_AIXPPC_WASv8.5.5.zip
!
cmd="echo end_ftp";_exec_cmd;

#unzip file
cmd="echo begin_unzip";_exec_cmd;

cd /usr/wasinstall/wasbase
jar xvf WASND_v8.5.5_1of3.zip
jar xvf WASND_v8.5.5_2of3.zip
jar xvf WASND_v8.5.5_3of3.zip
rm WASND_v8.5.5_*of3.zip

cd /usr/wasinstall/fix
jar xvf 8.5.5-WS-WAS-FP0000005-part1.zip
jar xvf 8.5.5-WS-WAS-FP0000005-part2.zip
rm 8.5.5-WS-WAS-FP0000005-part*.zip

cd /usr/wasinstall/instmgr
jar xvf Install_Mgr_v1.6.2_AIXPPC_WASv8.5.5.zip
rm Install_Mgr_v1.6.2_AIXPPC_WASv8.5.5.zip

cmd="echo end_unzip";_exec_cmd;

#chmod 
chmod -R 755 /usr/wasinstall
chmod -R 755 /script

echo "Time:`date '+%y%m%d %T'`   $0 $@ END \n" | tee -a $log
