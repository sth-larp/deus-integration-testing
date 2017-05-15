#! /bin/bash

node server.js  2>&1 | tee logs/server.log  &

