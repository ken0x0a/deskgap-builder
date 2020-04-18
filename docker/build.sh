#!/usr/bin/env bash
set -e

docker build -t deskgapuserland/builder:base -t deskgapuserland/builder:base-06.19 docker/base

docker build -t deskgapuserland/builder:12 -t deskgapuserland/builder:latest -t deskgapuserland/builder:12-06.19 docker/node

docker build -t deskgapuserland/builder:wine docker/wine
docker build -t deskgapuserland/builder:wine-mono docker/wine-mono
docker build -t deskgapuserland/builder:wine-chrome docker/wine-chrome