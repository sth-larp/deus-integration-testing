#! /bin/bash

for (( i=0; i<100; i++))
do
    echo "Start process $i"
    node client.js  2>&1 | tee logs/$i.log  &
    sleep 15
done
