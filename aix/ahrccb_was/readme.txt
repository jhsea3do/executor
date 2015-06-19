#需要对Hosts进行追加设置（每一台主机需要追加互相主机及IP信息）
#需要补充这个脚本


#所有需要安装WAS节点都需要安装的脚本
chmod 755 /script/*.*
cd /script
./prepare.was.ksh 10.48.0.210 htzhang 8uhbvgy7
./inst.was.ksh /opt/ibm/im

#dmgr节点执行脚本
./createProfiles.was.ksh cell dmgrhostname 8879

#stand节点执行脚本
./createProfiles.was.ksh stand dmgrhostname 8879

#查看执行脚本的日志文件（需要修改下面的主机名前缀）
/usr/wasinstall/aix71-was4.dc.was.install.log
/usr/wasinstall/aix71-was4.dc.was.prepare.log
/usr/wasinstall/aix71-was4.dc.was.createProfiles.log

#确认安装完成地址、Server Type路径下面查看Websphere Application Server集群状态
#如果追加几台机器，就能看到几台机器集群状态
http://10.58.0.126:9060/admin




