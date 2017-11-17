#!/usr/bin/env bash

docker kill dingding-gitlab-robot
docker rm dingding-gitlab-robot
docker run -d -p 13005:3000 --name dingding-gitlab-robot --restart always dingding-gitlab-robot