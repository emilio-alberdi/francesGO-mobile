#!/bin/bash
i=0
while [ $i -lt 65 ]
do
wget http://s3.amazonaws.com/blackberry.phonegap/slicehost-production/apps/169654/FrancesGOMobileArgentina-$i.cod 
i=`expr $i + 1 `
done
