#!/usr/bin/env bash

aws s3 cp ./dist/angularjs-frontend/  s3://detail-builder --recursive --profile xps13
