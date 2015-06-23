#!/bin/sh
# @(#) A small KSH/BASH script to modify the /etc/hosts file 
# in order to append specific names from sample file..
# e.g.: $0 hosts.sample hosts.dest

function chkhost {
file=$1
addr=$2
host=$3
cat $file |grep -v ^#|grep $host| grep $addr| wc -l
}

function addhost {
file=$1
addr=$2
host=$3
echo "$addr	$host"|tee -a $file
}

function showline {
file=$1
addr=$2
host=$3
if [ -f "$file" ]; then
  if [ 0 -eq $(chkhost $file $addr $host) ]; then
    addhost $file $addr $host
  fi  
fi
}

function readline {
func=$1
file=$2
dest=$3
if [ -f "$file" ]; then
  while IFS='' read -r line || [[ -n $line ]]; do
    $func $dest $line
  done < "$file"
fi
}

source=$1
target=$2

if [ ! -f "$source" ]; then
  exit 1
fi

if [ "" == "$target" ]; then
  target=/etc/hosts
fi

readline showline $source $target
