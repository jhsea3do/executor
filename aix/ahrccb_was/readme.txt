#��Ҫ��Hosts����׷�����ã�ÿһ̨������Ҫ׷�ӻ���������IP��Ϣ��
#��Ҫ��������ű�


#������Ҫ��װWAS�ڵ㶼��Ҫ��װ�Ľű�
chmod 755 /script/*.*
cd /script
./prepare.was.ksh 10.48.0.210 htzhang 8uhbvgy7
./inst.was.ksh /opt/ibm/im

#dmgr�ڵ�ִ�нű�
./createProfiles.was.ksh cell dmgrhostname 8879

#stand�ڵ�ִ�нű�
./createProfiles.was.ksh stand dmgrhostname 8879

#�鿴ִ�нű�����־�ļ�����Ҫ�޸������������ǰ׺��
/usr/wasinstall/aix71-was4.dc.was.install.log
/usr/wasinstall/aix71-was4.dc.was.prepare.log
/usr/wasinstall/aix71-was4.dc.was.createProfiles.log

#ȷ�ϰ�װ��ɵ�ַ��Server Type·������鿴Websphere Application Server��Ⱥ״̬
#���׷�Ӽ�̨���������ܿ�����̨������Ⱥ״̬
http://10.58.0.126:9060/admin




