#!/bin/sh
function chhostname {
newhostname=$1
oldhostname=$(hostname)
  echo newhostname=${newhostname}
  echo oldhostname=${oldhostname}
  if [ "" == "${newhostname}" ]; then
    return 1
  fi
  # echo step1
  /usr/sbin/chdev -l inet0 -a hostname=${newhostname}
  if [ ! $? -eq 0 ]; then
    return $?
  fi
  # echo step2
  /usr/bin/uname -S ${newhostname}
  if [ ! $? -eq 0 ]; then
    return $?
  fi
  # echo step3
  /usr/bin/hostname ${newhostname}
  if [ ! $? -eq 0 ]; then
    return $?
  fi
  # echo step4
  stopsrc -s clcomd; sleep 2; startsrc -s clcomd
  if [ ! $? -eq 0 ]; then
    return $?
  fi
  return 0
}

chhostname $1 >> /tmp/$(basename $0).log 2>&1
exit $?
