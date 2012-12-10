#!/bin/bash
i=0
wget http://s3.amazonaws.com/blackberry.phonegap/slicehost-production/apps/169654/FrancesGOMobileArgentina.cod
while [ $i -lt 65 ]
do
wget http://s3.amazonaws.com/blackberry.phonegap/slicehost-production/apps/169654/FrancesGOMobileArgentina-$i.cod 
i=`expr $i + 1 `
done
