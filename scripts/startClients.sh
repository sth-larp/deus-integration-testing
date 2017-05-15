#! /bin/bash

for (( i=0; i<10; i++))
do
    echo "Start process $i"
    node client.js  2>&1 | tee logs/$i.log  &
    sleep 15
done
