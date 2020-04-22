#!/bin/bash

if which node > /dev/null
then
    echo "oh, node is in place so just do it"
else
    echo "!! NODE NOT FOUND !!"
    exit 1
fi

export NODE_ENV=production
cd "$( dirname "${BASH_SOURCE[0]}" )"

DEBUG=* node server.js