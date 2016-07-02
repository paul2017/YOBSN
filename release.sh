#!/bin/bash

if [[ $ANDROID_HOME = '' ]]; then
    echo 'the env variable ANDROID_HOME is not defined'
    exit 1
fi

BUILD_DIR=platforms/android/ant-build/

cd $BUILD_DIR
rm -f *.apk*
ionic build --release android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../../../yobsn.keystore CordovaApp-release-unsigned.apk yobsn
${ANDROID_HOME}/build-tools/19.1.0/zipalign -v 4 CordovaApp-release-unsigned.apk YOBSN.apk


