#!/bin/bash

docker build . -t localhost:32000/mtnproj
docker push localhost:32000/mtnproj
kubectl rollout restart deployment mtnproj
