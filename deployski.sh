#!/bin/bash
executionScriptDir=$(pwd)

echo "Howdy, server deployment underway..."

if [ "$1" == "-h" ]; then
  echo "Deployment script"
  echo "Flags:"
  echo "    -m minor version npm patch (by default normal patch)"
  exit 0
fi

#get all CLI args
flagsProcessed=0
isMinorPatch=false
for var in "$@"
do
  if [[ "$var" = "-m" ]]; then
    isMinorPatch=true
  fi
  flagsProcessed=$((flagsProcessed+1))
done

if [ "$isMinorPatch" = true ] ; then
  npm version minor
else
  npm version patch
fi

gcloud run deploy --source . --region=us-east1

echo "commiting tags."
git push --tags origin master