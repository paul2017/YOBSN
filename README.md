# YOBSNMobileAndroid
YOBSN Mobile Android (PhoneGap) version

##Overview

YOBSNMobileAndroid is built using the [Ionic Framework](http://ionicframework.com) with [AngularJS](http://angularjs.org) , [Cordova](http://cordova.apache.org/) and [ngCordova](http://ngcordova.com/).

## Prerequisites

For development you will need to have [NodeJS](http://nodejs.org) installed and then install the following global NPM modules:

```bash
npm install -g cordova
npm install -g ionic
npm install -g gulp
```

## Development

To get started hacking on the app:

- Clone github
```bash
https://github.com/DynamicSocialDesign/YOBSNMobileAndroid.git
```

- Change directory to app
```bash
cd yobsn_app_dir
```

- Install modules
```bash
npm install
bower install
bower install ngCordova
bower install ngstorage
bower install angular-local-storage
```

- Install plugins
```bash
cordova plugin add com.ionic.keyboard
cordova plugin add org.apache.cordova.console
cordova plugin add org.apache.cordova.device
cordova plugin add org.apache.cordova.camera
cordova plugin add org.apache.cordova.media-capture
cordova plugin add org.apache.cordova.file-transfer
cordova plugin add org.apache.cordova.splashscreen
cordova plugin add https://github.com/whiteoctober/cordova-plugin-app-version.git
cordova plugin add org.apache.cordova.inappbrowser
cordova plugin add https://github.com/ohh2ahh/AppAvailability.git
cordova plugin add https://github.com/antonioJASR/FileOpener.git
```
- Install Adobe Reader
For reading PDFs you will need to download AdobeReader apk file.

- Add platforms
```bash
ionic platform add android
```

You are now ready to write some code!

## Test on mobile/emulator
Run gulp command
```bash
gulp test
```

Run ionic command
```bash
ionic run
```

## Publishing

Don't forget to update version number (version attribute) in config.xml
```xml
<widget id="com.socialnetworkinginc.yobsnmobilev1" version="1.02" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
```
Generate the optimized assets
```bash
gulp dist
```

Go to plateforms/android/ant-build/

Build for Android
```bash
ionic build --release android
```

Sign the unsigned APK (Passphrase : 123456)
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../../../yobsn.keystore CordovaApp-release-unsigned.apk yobsn
```
zip align APK (zipalign is located in 'build-tools' folder of android sdk)
```bash
zipalign -v 4 CordovaApp-release-unsigned.apk YOBSN.apk
```
