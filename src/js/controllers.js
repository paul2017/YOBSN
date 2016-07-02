angular.module('YOBSN.controllers', ['ionic', 'ngCordova', 'ngStorage'])

.constant('PROJECT_SETTINGS', {
    FLOWPLAYER_CONFIG: {

    }
})

/***********************************************************************************************************************
 *
 *  Login controller
 *
 **********************************************************************************************************************/
.controller('LoginCtrl', ['$scope', '$rootScope', '$yobsnAuth', '$yobsnSettings', '$state', '$ionicLoading', '$stateParams', function($scope, $rootScope, $yobsnAuth, $yobsnSettings, $state, $ionicLoading, $stateParams) {

    $scope.loginData = {};
    $scope.loading = {};
    $scope.loadingBG = {};

    $scope.is_error = false;

    $scope.init = function() {

        // Init accoun info
        $scope.loginData.username = $yobsnAuth.login_data.username;

        if ($rootScope.$storage.rememberAccount) {
            $scope.loginData.password = $yobsnAuth.login_data.password;
        } else {
            $scope.loginData.password = '';
        }

        // Init loading info
        $scope.loading.avatarURL = $yobsnAuth.login_data.avatarURL;
        $scope.loading.nameText = $yobsnAuth.login_data.nameText;

        $scope.loading.bgURL = $yobsnSettings.setting_data.bgURL;
        $scope.loading.logoURL = $yobsnSettings.setting_data.logoURL;
        $scope.loading.loadingText = $yobsnSettings.setting_data.loadingText;
        $scope.loading.loadingType = $yobsnSettings.setting_data.loadingType;

        $scope.loginData.remember = $rootScope.$storage.rememberAccount;

        $scope.loadingBG = {
            backgroundImage: 'url(' + $scope.loading.bgURL + ')'
        };
    };

    $scope.init();

    $scope.login = function() {

        $scope.is_error = false;

        $ionicLoading.show({
            template: 'Logging in<br><ion-spinner icon="android"></ion-spinner>'
        });

        if ($scope.loginData.remember) {
            $rootScope.$storage.username = $scope.loginData.username;
            $rootScope.$storage.password = $scope.loginData.password;
        }
        $rootScope.$storage.rememberAccount = $scope.loginData.remember;

        $yobsnAuth.login($scope.loginData.username, $scope.loginData.password).then(

            /* success */
            function(data) {
                $ionicLoading.hide();

                $rootScope.loading = {};
                $scope.loading.avatarURL = $rootScope.loading.avatarURL = $yobsnAuth.login_data.avatarURL;
                $scope.loading.nameText = $rootScope.loading.nameText = $yobsnAuth.login_data.nameText;

                $yobsnSettings.getSettings().then(

                    /* success */
                    function(data) {
                        $rootScope.loading.bgURL = data.loadingBackgroundURL;

                        if ($yobsnSettings.setting_data.logoURL && $yobsnSettings.setting_data.logoURL.length > 0) {
                            $yobsnSettings.setting_data.loadingType = 'loading-type-custom-logo';
                        } else {
                            $yobsnSettings.setting_data.loadingType = 'loading-type-custom';
                        }
                    },

                    /* error */
                    function(data) {

                        $yobsnSettings.setting_data.loadingType = 'loading-type-simple';

                    }
                ).finally(function() {
                    $ionicLoading.hide();
                    $state.transitionTo('app.smart-chirp-list', $stateParams, {
                        reload: true
                    });
                });
            },

            /* error */
            function(data) {
                $ionicLoading.hide();

                if (!data.detail) {
                    $scope.is_error = true;
                } else {
                    $scope.is_error = false;
                }

                $scope.loginData.password = '';
            }
        );
    };

}])

/***********************************************************************************************************************
 *
 *  License Agreement controller
 *
 **********************************************************************************************************************/
.controller('LicenseAgreementCtrl', ['$scope', function($scope) {

}])

/***********************************************************************************************************************
 *
 *  Signup controller
 *
 **********************************************************************************************************************/
.controller('SignupCtrl', ['$scope', '$rootScope', '$yobsnAuth', '$state', '$ionicLoading', '$yobsnSettings', function($scope, $rootScope, $yobsnAuth, $state, $ionicLoading, $yobsnSettings) {
    $scope.formdata = {};
    $scope.error = "";
    $scope.signup = function(isValid) {
        if (isValid) {
            $scope.error = "";
            $ionicLoading.show({
                template: 'Signing up<br><ion-spinner icon="android"></ion-spinner>'
            });
            $yobsnAuth.signup($scope.formdata).then(
                function(data) {
                    $yobsnAuth.login_data.username = $scope.formdata.Email;
                    $yobsnAuth.login_data.password = $scope.formdata.Password;
                    $rootScope.loading = {};
                    $rootScope.loading.bgURL = data.background;
                    $rootScope.loading.avatarURL = data.avatar_image;
                    $yobsnSettings.setting_data.loadingType = 'loading-type-simple';

                    $state.go('login-simple');
                },
                function(error) {
                    $ionicLoading.hide();
                    $scope.error = error.error;
                }

            ).finally(function(){
                $ionicLoading.hide();
            });
        }
    };
}])

/***********************************************************************************************************************
 *
 *  Application controller
 *
 **********************************************************************************************************************/
.controller('AppCtrl', ['$scope', '$rootScope', '$state', '$yobsnAuth', '$yobsnSettings', function($scope, $rootScope, $state, $yobsnAuth, $yobsnSettings) {
    function gotoLoginPage() {
        if ($yobsnSettings.setting_data.loadingType == 'loading-type-custom') {
            $state.go('login-custom');
        } else if ($yobsnSettings.setting_data.loadingType == 'loading-type-custom-logo') {
            $state.go('login-custom-logo');
        } else {
            $state.go('login-simple');
        }
    }

    // logout
    $scope.logout = function() {
        $yobsnAuth.logout().then(
            function() {
                gotoLoginPage();
            },
            function(error) {
                gotoLoginPage();
            }
        );
    };
    $rootScope.menu = $yobsnSettings.menu;
    $scope.appVer = $rootScope.appVer;

}])

/***********************************************************************************************************************
 *
 *  SmartChirpListCtrl controller
 *
 **********************************************************************************************************************/

.controller('SmartChirpListCtrl', ['$rootScope', '$scope', '$yobsnSmartChirp', '$filter', '$ionicPopup', '$ionicLoading', '$timeout', '$sce', '$cordovaInAppBrowser', '$window', function($rootScope, $scope, $yobsnSmartChirp, $filter, $ionicPopup, $ionicLoading, $timeout, $sce, $cordovaInAppBrowser, $window) {

    function hydrateChirps(data) {
        angular.forEach(data.messages, function(item) {
            $scope.messages.items.push(hydrateChirp(item));
        });
    }

    function hydrateChirp(item) {
        chirp = {
            id: item.message_id,
            name: item.name,
            date: item.date,
            hours: $filter('date')(item.date * 1000, 'shortTime'),
            stars: item.stars,
            message: item.message,
            avatar_image: item.avatar_image,
            member_id: item.member_id,
            can_be_deleted: item.can_be_deleted,
            comments: item.comments,
            attach: []
        };

        angular.forEach(item.attach, function(attach) {
            chirp.attach.push({
                'media_type': attach['media_type'],
                'file': attach['file'],
                'thumbnail': attach['thumbnail']
            });
        });

        return chirp;
    }

    var attachPopup = null;

    /* Init message data */
    $scope.messages = {
        items: [],
        hasNext: false,
        page: 1
    };

    $scope.loading = {};

    $scope.loading.avatarURL = $rootScope.loading.avatarURL;
    $scope.loading.nameText = $rootScope.loading.nameText;
    $scope.bgStyle = {
        "background": "url('" + $rootScope.loading.bgURL + "') no-repeat center center"
    };

    $scope.getMoreChirps = function() {
        $scope.messages.page += 1;
        $yobsnSmartChirp.getList($scope.messages.page, true)
            .then(
                /* success */
                function(data) {
                    hydrateChirps(data);
                    $scope.messages.hasNext = data.next_messages;
                },

                /* error */
                function(data) {
                    alert('Network error');
                }
            )
            .finally(function() {
                //
            });
    };

    $scope.refreshChirps = function() {
        $ionicLoading.show({
            template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
        });
        $yobsnSmartChirp.getList(1, true)
            .then(
                /* success */
                function(data) {
                    $scope.messages = {
                        items: [],
                        hasNext: false,
                        page: 1
                    };
                    hydrateChirps(data);
                    $scope.messages.hasNext = data.next_messages;
                },

                /* error */
                function(data) {
                    alert('Network error');
                }
            )
            .finally(function() {
                $ionicLoading.hide();
            });
    };

    $rootScope.$on('newChirpPosted', function(event, data) {
        $timeout($scope.refreshChirps, 50);
    });

    $scope.markAsSpam = function(messageId) {
        $ionicPopup.confirm({
                title: 'Are you sure?',
                template: 'Are you sure you want to mark this post as spam? This may have a negative impact on this users account.',
                okText: 'Mark as spam'
            })
            .then(function(res) {
                if (res) {
                    $yobsnSmartChirp.markAsSpam(messageId)
                        .then(function(data) {
                            $ionicPopup.alert({
                                title: 'Successfully marked as spam',
                                template: data.msg
                            });
                        }, function(data) {
                            $ionicPopup.alert({
                                title: 'Unable to mark as spam',
                                template: data.error
                            });
                        });
                }
            });
    };

    $scope.deleteMessage = function(id) {
        $ionicPopup.confirm({
                title: 'Are you sure?',
                template: 'Are you sure you want to delete this post?',
                okText: 'Delete'
            })
            .then(function(res) {
                if (res) {
                    $yobsnSmartChirp.deleteMessage(id)
                        .then(function(data) {
                            angular.forEach($scope.messages.items, function(item, i) {
                                if (item.id === id) {
                                    $scope.messages.items.splice(i, 1);
                                    return;
                                }
                            });
                        }, function(data) {
                            $ionicPopup.alert({
                                title: 'Unable to delete post',
                                template: data.error
                            });
                        });
                }
            });
    };

    $scope.showAttach = function(type, url, thumbUrl) {
        $scope.attachType = type;
        $scope.attachUrl = $sce.trustAsResourceUrl(url);
        $scope.attachThumbUrl = $sce.trustAsResourceUrl(thumbUrl);

        $scope.config = {
            controls: false,
            playsinline: false,
            preload: "auto",
            theme: "lib/videogular-themes-default/videogular.min.css",
            poster: 'img/camera-overlay/black.png',
            sources: {
                src: $scope.attachUrl,
                type: $scope.attachType
            }
        };

        $timeout(function(){
            attachPopup = $ionicPopup.show({
                template: '<div ng-if="attachType.indexOf(\'image\') !== 0" ng-click="closeAttach()"><flowplayer type="config.sources.type" src="config.sources.src" on-player-ready="onPlayerReady(api)" class="fixed-controls no-hover no-background no-mute no-time no-volume"></flowplayer></div><img ng-if="attachType.indexOf(\'image\') === 0" ng-click="closeAttach()" ng-src="{{attachUrl}}" />',
                title: undefined,
                cssClass: 'fullsize media',
                scope: $scope
            });
        },50);
    };

    $scope.onPlayerReady = function(api) {

        api.bind("pause", function() {
            api.stop();
        });

        api.bind("stop", function() {
            $scope.closeAttach();
        });

        api.play();
    };

    $scope.closeAttach = function() {
        attachPopup.close();
    };


    // Load first chirps
    // $scope.refreshChirps();
    $yobsnSmartChirp.getList()
        .then(

            /* success */
            function(data) {
                hydrateChirps(data);
                $scope.messages.hasNext = data.next_messages;
            },

            /* error */
            function(data) {
                alert('Network error');
            }
        );

    angular.element(document).on('click', '#smartChirpList div.message a', function(evt) {
        evt.preventDefault();
        $ionicPopup.confirm({
                title: 'External link',
                template: 'This link will open up in a new Browser window.<br />Links are posted by other members and some links may be unsafe.',
                okText: 'Follow Link'
            })
            .then(function(res) {
                if (res) {
                    var link = angular.element(evt.target).attr('href');
                    if (link.indexOf('http://') != 0)
                        link = 'http://' + link;
                    $cordovaInAppBrowser.open(link, '_system');
                }
            });
    });
}])

/***********************************************************************************************************************
 *
 *  SmartChirpNewCtrl controller
 *
 **********************************************************************************************************************/
.controller('SmartChirpNewCtrl', ['$rootScope', '$scope', '$yobsnSmartChirp', '$state', '$ionicLoading', '$cordovaCapture', '$cordovaFileTransfer', '$q', '$cordovaCamera', '$timeout', function($rootScope, $scope, $yobsnSmartChirp, $state, $ionicLoading, $cordovaCapture, $cordovaFileTransfer, $q, $cordovaCamera, $timeout) {

    var ACTION_TEXT_PHOTO = 'Capture New Photo';
    var ACTION_TEXT_VIDEO = 'Record New Video';
    var ACTION_VIDEO = 'Video';
    var ACTION_PHOTO = 'Photo';
    var attached_item = null;
    $scope.chirp = {};
    var progessinit = {
        'percent': 0,
        'total': 0,
        'loaded': 0,
        'info': 'Processing ...'
    };
    $scope.progress = progessinit;
    $scope.path = null;
    $scope.mimeType = null;
    $scope.thumb = null;
    $scope.footerIsShow = true;
    $scope.action_text = ACTION_TEXT_PHOTO;
    $scope.action_type = ACTION_PHOTO;
    $scope.action_photo_active = 'activated';
    $scope.action_video_active = '';
    $scope.uploadpending = false;

    // $scope.$on('$ionicView.afterEnter', function(viewInfo, state) {
    //   document.getElementById('chirpText').focus();
    // });

    window.addEventListener('native.keyboardhide', function() {
        $scope.showFooter();
        $scope.$digest();
    });

    $scope.canShare = function() {
        return !$scope.uploadpending && $scope.chirp.text;
    };

    $scope.setAction = function(type) {
        if (type === 'video') {
            $scope.action_text = ACTION_TEXT_VIDEO;
            $scope.action_type = ACTION_VIDEO;
            $scope.action_video_active = 'activated';
            $scope.action_photo_active = '';
        } else {
            $scope.action_text = ACTION_TEXT_PHOTO;
            $scope.action_type = ACTION_PHOTO;
            $scope.action_video_active = '';
            $scope.action_photo_active = 'activated';
        }
    };

    $scope.takeAction = function() {
        if ($scope.action_type === ACTION_PHOTO)
            $scope.capturePhoto();
        else
            $scope.captureVideo();
    };

    $scope.openGallery = function() {
        $cordovaCamera.getPicture({
                // quality: 50,
                destinationType: Camera.DestinationType.NATIVE_URI,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                mediaType: $scope.action_type === ACTION_VIDEO ? Camera.MediaType.VIDEO : Camera.MediaType.PICTURE
            })
            .then(function(imageURI) {
                // to avoid android kitkat bug in storage access framework
                if (imageURI.lastIndexOf('content://media') !== 0) {
                    photo_split = imageURI.split("%3A");
                    if ($scope.action_type === ACTION_VIDEO)
                        imageURI = "content://media/external/video/media/" + photo_split[1];
                    else
                        imageURI = "content://media/external/images/media/" + photo_split[1];
                }
                window.resolveLocalFileSystemURL(imageURI, function(fileEntry) {
                    $scope.path = fileEntry.nativeURL;

                    fileEntry.file(function(file) {
                        $scope.mimeType = file.type;
                    }, function(err) {
                        alert(err);
                    });

                    $scope.$digest();
                });
            });
    };

    $scope.capturePhoto = function() {

        var options = {
            limit: 1
        };

        $cordovaCapture.captureImage(options).then(
            function(mediaFiles) {
                $scope.mimeType = mediaFiles[0].type;
                $scope.path = mediaFiles[0].fullPath;
            },
            function(err) {
                // An error occurred. Show a message to the user
            }
        );
    };

    $scope.captureVideo = function() {

        var options = {
            limit: 1,
            duration: 0
        };

        $cordovaCapture.captureVideo(options).then(
            function(mediaFiles) {
                $scope.mimeType = mediaFiles[0].type;
                $scope.path = mediaFiles[0].fullPath;
            },
            function(err) {
                // An error occurred. Show a message to the user
            }
        );
    };

    $scope.cancel = function() {
        $scope.path = null;
        $scope.thumb = null;
        $scope.uploadpending = false;
        attached_item = null;
    };

    $scope.uploadMedia = function() {
        $scope.uploadpending = true;
        $scope.thumb = null;
        $scope.progress = progessinit;
        attached_item = null;

        var fileURL = $scope.path;
        var deferred = $q.defer();
        var mimeType = $scope.mimeType;

        var options = {
            fileKey: "files[]",
            fileName: fileURL.substr(fileURL.lastIndexOf('/') + 1),
            mimeType: mimeType
        };

        $cordovaFileTransfer.upload("http://74.208.68.245/remote/desk/ajax-server-smd.php?source=android", $scope.path, options).then(
            //    $cordovaFileTransfer.upload("http://54.164.45.230/test/upload.php", $scope.path, options).then(
            function(result) {
                // Success!
                $scope.bytesSent = result.bytesSent;
                $scope.responseCode = result.responseCode;
                $scope.response = angular.fromJson(result.response);

                angular.forEach($scope.response, function(attached_item) {
                    $scope.attached_name = attached_item.name;
                    $scope.attached_url = attached_item.url;
                    deferred.resolve(attached_item);
                });

            },
            function(err) {
                // Error
                alert('upload Error');
                deferred.reject(err);
            },
            function(progress) {
                // constant progress updates
                if (progress.lengthComputable) {
                    $scope.progress['info'] = 'Upload in progress ...'
                    $scope.progress['percent'] = progress.loaded / progress.total * 100;
                    $scope.progress['total'] = progress.total / 1024;
                    $scope.progress['loaded'] = progress.loaded / 1024;
                    if (Math.round($scope.progress['percent']) == 100)
                        $scope.progress['info'] = 'Processing ...';
                }
            }
        ).finally(function() {
            $scope.uploadpending = false;
            $scope.progress = progessinit;
        });
        return deferred.promise;
    };

    $scope.postChirp = function() {
        if ($scope.canShare()) {
            $ionicLoading.show({
                template: 'Posting chirp<br><ion-spinner icon="android"></ion-spinner>'
            });
            $yobsnSmartChirp.postChirp($scope.chirp, attached_item).then(function(data) {
                    $rootScope.$emit('newChirpPosted', data);
                    $ionicLoading.hide();
                    $state.go('app.smart-chirp-list', {
                        'nokeepscroll': true
                    });
                },
                function(data) {
                    $ionicLoading.hide();
                    alert('Unable to post new chirp');
                }
            ).finally(function() {
                $ionicLoading.hide();
            });
        }
    };

    $scope.$watch('path', function(newValue, oldValue) {
        if (newValue !== null && newValue !== oldValue)
            $timeout(function() {
                $scope.uploadMedia().then(function(item) {
                    attached_item = item;
                    $scope.thumb = item.thumbnail_url;
                });
            }, 50);
    });

    $scope.showFooter = function() {
        $scope.footerIsShow = true;
    };

    $scope.hideFooter = function() {
        $scope.footerIsShow = false;
    };

}])


/***********************************************************************************************************************
 *
 *  MyAvatarCtrl controller
 *
 **********************************************************************************************************************/
.controller('MyAvatarCtrl', ['$cordovaAppAvailability', '$ionicPopup', '$state', '$ionicHistory', '$sessionStorage', function($cordovaAppAvailability, $ionicPopup, $state, $ionicHistory, $sessionStorage) {

    $ionicHistory.nextViewOptions({
        disableBack: true
    });

    var appId = 'com.socialnetworkinginc.avatarcreatorv1';
    var urlScheme = 'yobsnavatar://';
    var appLabel = 'YOBSN Mobile Avatar System'

    $cordovaAppAvailability.check(appId)
        .then(function() {
            window.plugins.webintent.startActivity({
                    action: window.plugins.webintent.ACTION_VIEW,
                    url: urlScheme,
                    extras: {
                        'sid': $sessionStorage['sid']
                    }
                },
                function() {
                    $state.go('app.smart-chirp-list');
                },
                function(err) {
                    alert('Failed to open URL via Android Intent');
                    $state.go('app.smart-chirp-list');
                });

        }, function() {
            var confirmPopup = $ionicPopup.confirm({
                title: appLabel,
                template: 'You have not yet installed the ' + appLabel + ' on your device. Once installed you will easily be able to use the software by clicking on this menu item. Please press okay to get this awesome software!'
            });
            confirmPopup.then(function(res) {
                if (res) {
                    window.plugins.webintent.startActivity({
                            action: window.plugins.webintent.ACTION_VIEW,
                            url: 'market://details?id=' + appId
                        },
                        function() {
                            $state.go('app.smart-chirp-list');
                        },
                        function() {
                            alert('Failed to open URL via Android Intent');
                            $state.go('app.smart-chirp-list');
                        }
                    );
                } else {
                    $state.go('app.smart-chirp-list');
                }
            });
        });

}])


/***********************************************************************************************************************
 *
 *  VideoConfCtrl controller
 *
 **********************************************************************************************************************/
.controller('VideoConfCtrl', ['$cordovaAppAvailability', '$ionicPopup', '$state', '$ionicHistory', '$sessionStorage', function($cordovaAppAvailability, $ionicPopup, $state, $ionicHistory, $sessionStorage) {

    $ionicHistory.nextViewOptions({
        disableBack: true
    });

    var appId = 'com.socialnetworkinginc.yobsnmobilevidconfv1';
    var urlScheme = 'yobsnvideoconf://';
    var appLabel = 'YOBSN Video Conferencing System';

    $cordovaAppAvailability.check(appId)
        .then(function() {
            window.plugins.webintent.startActivity({
                    action: window.plugins.webintent.ACTION_VIEW,
                    url: urlScheme,
                    extras: {
                        'sid': $sessionStorage['sid']
                    }
                },
                function() {
                    $state.go('app.smart-chirp-list');
                },
                function(err) {
                    alert('Failed to open URL via Android Intent');
                    $state.go('app.smart-chirp-list');
                });

        }, function() {
            var confirmPopup = $ionicPopup.confirm({
                title: appLabel,
                template: 'You have not yet installed the ' + appLabel + ' on your device. Once installed you will easily be able to use the software by clicking on this menu item. Please press okay to get this awesome software!'
            });
            confirmPopup.then(function(res) {
                if (res) {
                    window.plugins.webintent.startActivity({
                            action: window.plugins.webintent.ACTION_VIEW,
                            url: 'market://details?id=' + appId
                        },
                        function() {
                            $state.go('app.smart-chirp-list');
                        },
                        function() {
                            alert('Failed to open URL via Android Intent');
                            $state.go('app.smart-chirp-list');
                        }
                    );
                } else {
                    $state.go('app.smart-chirp-list');
                }
            });
        });

}])


/***********************************************************************************************************************
 *
 *  MyFriendsCtrl controller
 *
 **********************************************************************************************************************/
.controller('MyFriendsCtrl', ['$scope', '$yobsnGroups', '$yobsnFriendRequests', function($scope, $yobsnGroups, $yobsnFriendRequests) {

    $scope.groups = [];
    $scope.unsortedFriends = {
        id: 0,
        name: 'Unsorted Friends',
        friends_count: 0
    };

    $scope.groups_count = 0;
    $scope.friends_count = 0;
    $scope.request_count = 0;

    $yobsnFriendRequests.getFriendRequests().then(
        /* success */
        function(data) {
            $scope.request_count = data.requests.length;
            console.log('request count:' + $scope.request_count);
        },
        /* error */
        function(data) {

            //    alert('Network error');
        }
    );

    $yobsnGroups.getGroups().then(

        /* success */
        function(data) {

            $scope.groups_count = 0;
            $scope.friends_count = 0;

            angular.forEach(data.groups, function(group) {

                if (group.id == 0) {
                    $scope.unsortedFriends.id = group.id;
                    $scope.unsortedFriends.name = group.name;
                    $scope.unsortedFriends.friends_count = group.friends_count;

                    if ($scope.unsortedFriends.friends_count == 0)
                        $scope.unsortedFriends.href = "";
                    else
                        $scope.unsortedFriends.href = "ng-href=\"#/app/friends-list/" + $scope.unsortedFriends.id + "\"";
                } else {
                    $scope.groups.push({
                        id: group.id,
                        name: group.name,
                        friends_count: group.friends_count
                    });

                    console.log(group.name);
                    console.log(group.friends_count);

                    $scope.groups_count += 1;
                    $scope.friends_count = parseInt($scope.friends_count) + parseInt(group.friends_count);
                }
            });

        },

        /* error */
        function(data) {

            //    alert('Network error');
        }
    );

}])

.controller('GroupsListCtrl', ['$scope', '$state', '$yobsnGroups', function($scope, $state, $yobsnGroups) {

    $scope.groups = [];

    $yobsnGroups.getGroups().then(

        /* success */
        function(data) {

            angular.forEach(data.groups, function(group) {
                if (group.id > 0) {
                    $scope.groups.push({
                        id: group.id,
                        name: group.name,
                        friends_count: group.friends_count
                    });
                }
            });

        },

        /* error */
        function(data) {

            alert('Network error');
        }
    );

    $scope.OnClickCheckItem = function(group_id, $event) {

        $event.stopPropagation();

        $state.go('app.group-edit', {
            groupId: group_id
        });
    }

    $scope.OnClickItem = function(group_id) {
        $state.go('app.friends-list', {
            groupId: group_id
        });
    }

}])

.controller('FriendsListCtrl', ['$scope', '$state', '$stateParams', '$yobsnFriends', '$yobsnGroups', '$ionicPopover', function($scope, $state, $stateParams, $yobsnFriends, $yobsnGroups, $ionicPopover) {

        $scope.view_title = '';

        $scope.page_num = 1; // first page
        $scope.page_size = 5; // page size

        $scope.friends = [];
        $scope.selected_friends = [];

        $scope.groups = [];

        $scope.maxStars = new Array(5);

        $scope.prevVisibility = 'hidden';
        $scope.nextVisibility = 'hidden';

        $scope.filter_word = '';

        $scope.group_id = $stateParams.groupId;
        $scope.view_title = $yobsnGroups.getGroupTitle($scope.group_id);


        $scope.showFilterCancel = false;


        $scope.onClickFilter = function() {
            $scope.showFilterCancel = true;
        }

        $scope.onClickCancel = function() {
            $scope.showFilterCancel = false;

            $scope.filter_word = '';
        }

        $scope.OnChangeFilter = function() {
            console.log($scope.filter_word);
        }

        $scope.OnClickMoveGroup = function($event) {

            if ($scope.selected_friends.length == 0) {

                var template = '<ion-popover-view class="platform-ios" style="height: 70px; width: 150px; padding-top: 20px; border-radius: 5px; top: 35px !important; text-align: center;">Select members</ion-popover-view>';
                $scope.popover = $ionicPopover.fromTemplate(template, {
                    scope: $scope
                });

                $scope.popover.show($event);

                return;
            } else {
                $scope.popover = $ionicPopover.fromTemplateUrl('templates/popover.html', {
                    scope: $scope
                }).then(function(popover) {
                    $scope.popover = popover;

                    $scope.popover.show($event);
                });
            }
        }

        $scope.OnClickItem = function(member_id) {

            console.log('FriendsListCtrl - OnClickItem: ' + member_id);

            $state.go('app.my-friend', {
                memberId: member_id
            });
        }

        $scope.OnClickCheckItem = function(member_id, $event) {

            $event.stopPropagation();

            console.log('FriendsListCtrl OnClickCheckItem : ' + member_id);

            for (var i = 0; i < $scope.selected_friends.length; i++) {
                if ($scope.selected_friends[i] == member_id) {

                    $scope.selected_friends.splice(i, 1);
                    return;
                }
            }

            $scope.selected_friends.push(member_id);
        }

        $scope.OnMoveToGroup = function(group_id) {
            $scope.popover.hide();

            $yobsnFriends.moveFriendsToGroup(group_id, $scope.selected_friends).then(
                /* success */
                function(data) {
                    // refresh
                    console.log('$scope.OnMoveToGroup - refresh');
                    $scope.getFriends();
                    $scope.getGroups();
                },

                /* error */
                function(data) {
                    // refresh
                    console.log('$scope.OnMoveToGroup - error');
                    //$scope.getFriends();
                    //$scope.getGroups();
                }
            );
        }

        $scope.IsCheckedItem = function(member_id) {
            for (var i = 0; i < $scope.selected_friends.length; i++) {
                if ($scope.selected_friends[i] == member_id) {

                    return true;
                }
            }

            return false;
        }

        $scope.onPrev = function() {

            if ($scope.prevVisibility == 'visible') {
                $scope.page_num--;

                $scope.prevVisibility = 'hidden';
                $scope.getFriends();
            }
        }

        $scope.onNext = function() {

            if ($scope.nextVisibility == 'visible') {
                $scope.page_num++;

                $scope.nextVisibility = 'hidden';
                $scope.getFriends();
            }
        }

        $scope.getGroups = function() {

            $scope.groups = [];

            $yobsnGroups.getGroups().then(
                /* success */
                function(data) {
                    for (var i = 0; i < $yobsnGroups.groups.length; i++) {
                        if ($scope.group_id != $yobsnGroups.groups[i].id) {
                            $scope.groups.push({
                                id: $yobsnGroups.groups[i].id,
                                name: $yobsnGroups.groups[i].name,
                                friends_count: $yobsnGroups.groups[i].friends_count
                            });
                        }
                    }
                },

                /* error */
                function(data) {

                }

            );

        }

        $scope.getFriends = function() {

            $scope.friends = [];

            $yobsnFriends.getFriends($scope.group_id, $scope.page_num, $scope.page_size).then(

                /* success */
                function(data) {

                    $scope.friends = $yobsnFriends.friends;

                    if ($yobsnFriends.next_friends > 0) {
                        $scope.nextVisibility = 'visible';
                    } else {
                        $scope.nextVisibility = 'hidden';
                    }

                    if ($scope.page_num > 1) {
                        $scope.prevVisibility = 'visible';
                    } else {
                        $scope.prevVisibility = 'hidden';
                    }
                },

                /* error */
                function(data) {

                    alert('Network error');
                }
            );
        };

        $scope.getFriends();
        $scope.getGroups();
    }])
    /***********************************************************************************************************************
     *
     *  FriendsRequestCtrl controller
     *
     **********************************************************************************************************************/
    .controller('FriendsRequestCtrl', ['$scope', '$yobsnFriendRequests', function($scope, $yobsnFriendRequests) {

        $scope.requests = [];
        $scope.maxStars = new Array(5);

        $scope.showFilterCancel = false;

        $scope.onClickFilter = function() {
            $scope.showFilterCancel = true;
        }

        $scope.onClickCancel = function() {
            $scope.showFilterCancel = false;
        }

        $scope.onAccept = function(member_id) {
            console.log('onAccept');

            $yobsnFriendRequests.Accept(member_id).then(
                /* success */
                function(data) {
                    $scope.getFriendRequests();
                },

                /* error */
                function(data) {

                }
            );
        }

        $scope.onDecline = function(member_id) {
            console.log('onDecline');

            $yobsnFriendRequests.Decline(member_id).then(
                /* success */
                function(data) {
                    $scope.getFriendRequests();
                },

                /* error */
                function(data) {

                }
            );
        }

        $scope.getFriendRequests = function() {

            $scope.requests = [];

            $yobsnFriendRequests.getFriendRequests().then(

                /* success */
                function(data) {

                    angular.forEach(data.requests, function(request) {
                        $scope.requests.push({
                            request_id: request.request_id,
                            member_id: request.member_id,
                            username: request.username,
                            name: request.name,
                            avatar_image: request.avatar_image,

                            stars: 0
                        });
                    });
                },

                /* error */
                function(data) {

                    alert('Network error');
                }
            );
        }

        $scope.getFriendRequests();


    }])

/***********************************************************************************************************************
 *
 *  FriendSearchCtrl controller
 *
 **********************************************************************************************************************/

.controller('FriendSearchCtrl', ['$scope', '$ionicLoading', '$yobsnFriendRequests', '$yobsnSearchFriendManager', '$ionicPopup', function($scope, $ionicLoading, $yobsnFriendRequests, $yobsnSearchFriendManager, $ionicPopup) {

    $scope.maxStars = new Array(5);
    $scope.selectedTab = 'username';
    $scope.showTab = true;

    $scope.requests = [];
    $scope.friends = [];

    $scope.page_num = 1;
    $scope.page_size = 50;

    $scope.prevVisibility = 'hidden';
    $scope.nextVisibility = 'hidden';
    $scope.footerVisibility = 'hidden';

    $scope.keyword = '';
    $scope.entered_keyword = '';

    $scope.showFilterCancel = false;

    $scope.searchError = null;


    $scope.onClickFilter = function() {
        $scope.showFilterCancel = true;
        $scope.prevVisibility = 'hidden';
        $scope.nextVisibility = 'hidden';
        $scope.footerVisibility = 'hidden';
    }

    $scope.onClickCancel = function() {
        $scope.showFilterCancel = false;

        $scope.keyword = '';
    }

    $scope.onPrev = function() {

        if ($scope.prevVisibility == 'visible') {
            $scope.page_num--;

            $scope.prevVisibility = 'hidden';
            $scope.searchFriend();
        }
    }

    $scope.onNext = function() {

        if ($scope.nextVisibility == 'visible') {
            $scope.page_num++;

            $scope.nextVisibility = 'hidden';
            $scope.searchFriend();
        }
    }

    $scope.onEnter = function() {

        $scope.entered_keyword = $scope.keyword;

        $scope.onClickCancel();

        $scope.page_num = 1;
        $scope.searchFriend();
    }

    $scope.isRequested = function(member_id) {

        for (var i = 0; i < $scope.requests.length; i++) {
            if ($scope.requests[i].member_id == member_id) {
                return true;
            }
        }

        return false;
    }

    $scope.getFriendRequests = function() {

        $scope.requests = [];

        $yobsnFriendRequests.getFriendRequests().then(

            /* success */
            function(data) {

                angular.forEach(data.requests, function(request) {
                    $scope.requests.push({
                        request_id: request.request_id,
                        member_id: request.member_id,
                        username: request.username,
                        name: request.name,
                        avatar_image: request.avatar_image,

                        stars: 0
                    });
                });

            },

            /* error */
            function(data) {

                alert('Network error');
            }
        );
    }

    $scope.searchFriend = function() {
        $scope.searchError = null;
        $scope.friends = [];

        $scope.getFriendRequests();

        console.log('search tab:' + $scope.selectedTab);
        console.log('search keyword:' + $scope.entered_keyword);

        $ionicLoading.show({
            template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
        });

        $yobsnSearchFriendManager.searchFriends($scope.selectedTab, $scope.entered_keyword, $scope.page_num, $scope.page_size).then(

                /* success */
                function(data) {

                    $scope.friends = $yobsnSearchFriendManager.friends;

                    if ($yobsnSearchFriendManager.next_friends > 0) {
                        $scope.nextVisibility = 'visible';
                    } else {
                        $scope.nextVisibility = 'hidden';
                    }

                    if ($scope.page_num > 1) {
                        $scope.prevVisibility = 'visible';
                    } else {
                        $scope.prevVisibility = 'hidden';
                    }

                    $scope.footerVisibility = 'visible';
                },

                /* error */
                function(data) {
                    $scope.searchError = data.error;
                }
            )
            .finally(
                function(data) {
                    $ionicLoading.hide();
                }
            );
    };

    $scope.onAdd = function(member_id) {

        $yobsnFriendRequests.SendFriendRequest(member_id).then(
            /* success */
            function(data) {
                // refresh screen
                $ionicPopup.alert({
                    title: 'Cool !',
                    template: 'Request sent :-)'
                });
                $scope.searchFriend();
            },
            /* error */
            function(data) {
                $ionicPopup.alert({
                    title: 'Error',
                    template: data.error
                });
            }
        );
    }

}])

/***********************************************************************************************************************
 *
 *  MyFriendCtrl controller
 *
 **********************************************************************************************************************/
.controller('MyFriendCtrl', ['$scope', '$state', '$stateParams', '$ionicPopup', '$yobsnFriends', '$yobsnGroups', '$yobsnHugManager', function($scope, $state, $stateParams, $ionicPopup, $yobsnFriends, $yobsnGroups, $yobsnHugManager) {

    $scope.member_id = $stateParams.memberId;

    var friend = $yobsnFriends.getFriend($scope.member_id);

    $scope.maxStars = new Array(5);
    $scope.friend = {
        member_id: friend.member_id,
        username: friend.username,
        name: friend.name,
        stars: friend.stars,
        avatar_image: friend.avatar_image,
        group_id: friend.group_id,
        group_name: $yobsnGroups.getGroupTitle(friend.group_id)
    };

    $scope.sendHug = function() {

        $yobsnHugManager.sendHug($scope.member_id).then(

            /* success */
            function(data) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Hug Manager',
                    template: 'Hug was sent'
                });

                alertPopup.then(function(res) {
                    console.log('Hug was sent');
                });
            },

            /* error */
            function(data) {

            }
        );
    }

    $scope.RemoveFriend = function(member_id) {
        $yobsnFriends.RemoveFriend(member_id).then(
            /* success */
            function(data) {
                $state.go('app.friends-list', {
                    groupId: friend.group_id
                });
            },

            /* error */
            function(data) {

            }
        );
    }
}])

/***********************************************************************************************************************
 *
 *  FriendProfileCtrl controller
 *
 **********************************************************************************************************************/
.controller('FriendProfileCtrl', ['$scope', '$stateParams', '$yobsnFriends', '$yobsnProfile', function($scope, $stateParams, $yobsnFriends, $yobsnProfile) {

    $scope.maxStars = new Array(5);

    $scope.profile = {};

    $scope.member_id = $stateParams.memberId;

    var friend = $yobsnFriends.getFriend($scope.member_id);


    $scope.getPublicProfile = function() {

        $yobsnProfile.getPublicProfile($scope.member_id).then(

            /* success */
            function(data) {

                $scope.profile = $yobsnProfile.get();
                $scope.profile.avatar_image = friend.avatar_image;
                $scope.profile.stars = friend.stars;
            },

            /* error */
            function(data) {

                alert('Network error');
            }
        );
    }

    $scope.getPublicProfile();
}])

/***********************************************************************************************************************
 *
 *  FriendMoveGroupCtrl controller
 *
 **********************************************************************************************************************/
.controller('FriendMoveGroupCtrl', ['$scope', '$state', '$stateParams', '$yobsnFriends', '$yobsnGroups', function($scope, $state, $stateParams, $yobsnFriends, $yobsnGroups) {

    $scope.member_id = $stateParams.memberId;

    $scope.maxStars = new Array(5);

    $scope.Init = function() {

        var friend = $yobsnFriends.getFriend($scope.member_id);

        $scope.friend = {
            member_id: friend.member_id,
            username: friend.username,
            name: friend.name,
            stars: friend.stars,
            avatar_image: friend.avatar_image,
            group_id: friend.group_id,
            group_name: $yobsnGroups.getGroupTitle(friend.group_id)
        };

        $scope.groups = [];
        $scope.selected_group_id = null;

        $yobsnGroups.getGroups().then(

            /* success */
            function(data) {

                angular.forEach(data.groups, function(group) {
                    if (group.id > 0 && $scope.friend.group_id != group.id) {
                        $scope.groups.push({
                            id: group.id,
                            name: group.name,
                            friends_count: group.friends_count
                        });
                    }
                });
            },

            /* error */
            function(data) {
                alert('Network error');
            }
        );
    }

    $scope.Init();

    $scope.OnClickItem = function(group_id) {

        console.log('FriendMoveGroupCtrl - OnClickItem: ' + group_id);

        $state.go('app.friends-list', {
            groupId: group_id
        });
    }

    $scope.OnClickCheckItem = function(group_id, $event) {

        $event.stopPropagation();

        console.log('FriendMoveGroupCtrl OnClickCheckItem : ' + group_id);

        if ($scope.selected_group_id == group_id) {
            $scope.selected_group_id = null;
        } else {
            $scope.selected_group_id = group_id;
        }
    }

    $scope.IsCheckedItem = function(group_id) {

        if ($scope.selected_group_id == group_id) {
            return true;
        } else {
            return false;
        }
    }

    $scope.DoFriendMoveGroup = function() {
        if ($scope.selected_group_id > 0) {
            $yobsnFriends.moveFriendToGroup($scope.selected_group_id, $scope.member_id).then(

                /* success */
                function(data) {
                    $scope.Init();
                },

                /* error */
                function(data) {
                    // alert('Error');
                }
            );
        }
    }

}])

/***********************************************************************************************************************
 *
 *  GroupEditCtrl controller
 *
 **********************************************************************************************************************/
.controller('GroupEditCtrl', ['$scope', '$state', '$stateParams', '$yobsnGroups', function($scope, $state, $stateParams, $yobsnGroups) {

    $scope.group_id = $stateParams.groupId;

    $scope.data = {};

    $scope.data.group_title = $yobsnGroups.getGroupTitle($scope.group_id);

    $scope.OnEnter = function() {
        console.log('GroupEditCtrl - OnEnter : ' + $scope.data.group_title);

        $yobsnGroups.setGroupTitle($scope.group_id, $scope.data.group_title).then(
            /* success */
            function(data) {
                $state.go('app.groups-list');
            },

            /* error */
            function(data) {
                // alert('Error');
            }
        );
    }
}])

/***********************************************************************************************************************
 *
 *  InGameRevenueCtrl controller
 *
 **********************************************************************************************************************/
.controller('InGameRevenueCtrl', ['$scope', '$state', '$ionicLoading', '$yobsnInGameRevenue', function($scope, $state, $ionicLoading, $yobsnInGameRevenue) {

    var page_num = 1;
    var limit = 20;

    $scope.canLoad = function() {
        if ($yobsnInGameRevenue.next_history != 0)
            return true;
        else
            return false;
    };

    $scope.updateHistory = function(force) {
        if (force) {
            page_num = 1;
        }

        $ionicLoading.show({
            template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
        });

        $yobsnInGameRevenue.getGameRevenue(page_num, limit, force).then(
            /* success */
            function(data) {
                $scope.history = $yobsnInGameRevenue.history;

                page_num += 1;
            },
            /* error */
            function(data) {

            }
        ).finally(
            function(data) {
                $ionicLoading.hide();
            }
        );
    };

    $scope.OnClickInfo = function(id) {
        $state.go('app.in-game-revenue-detail', {
            id: id
        });
    };

    // Init
    $scope.updateHistory(true);
}])

/***********************************************************************************************************************
 *
 *  InGameRevenueDetailCtrl controller
 *
 **********************************************************************************************************************/
.controller('InGameRevenueDetailCtrl', ['$scope', '$state', '$stateParams', '$yobsnInGameRevenue', function($scope, $state, $stateParams, $yobsnInGameRevenue) {

    $scope.timestamp2date = function(timestamp) {
        var dateObj = new Date(timestamp * 1000);

        var year = "" + dateObj.getFullYear();
        var month = "0" + dateObj.getMonth();
        var date = "0" + dateObj.getDate();

        var hours = "0" + dateObj.getHours();
        var minutes = "0" + dateObj.getMinutes();
        var seconds = "0" + dateObj.getSeconds();

        var formattedDate = date.substr(date.length - 2) + '/' + month.substr(month.length - 2) + '/' + year.substr(year.length - 2);
        var formattedTime = hours.substr(hours.length - 2) + ':' + minutes.substr(minutes.length - 2) + ' ' + ((dateObj.getHours() < 12) ? "AM" : "PM");

        return formattedDate + ' ' + formattedTime;
    };

    $scope.id = $stateParams.id;
    $scope.item = $yobsnInGameRevenue.getRevenueItem($scope.id);

}])

/***********************************************************************************************************************
 *
 *  SpHistoryCtrl controller
 *
 **********************************************************************************************************************/
.controller('SpHistoryCtrl', ['$scope', '$yobsnHistory', '$ionicLoading', function($scope, $yobsnHistory, $ionicLoading) {

    $scope.history = {
        next_items_count: 0,
        from_id: 0,
        items: undefined
    };

    $scope.canLoad = function() {
        if ($scope.history.next_items_count != 0)
            return true;
        else
            return false;
    };

    $scope.updateHistory = function() {

        $yobsnHistory.getSPHistory($scope.history.from_id).then(
            /* success */
            function(data) {
                $ionicLoading.hide();

                $scope.balance = data.balance;
                $scope.history.next_items_count = data.next_items_count;
                $scope.history.from_id = data.from_id;

                if ($scope.history.items === undefined)
                    $scope.history.items = [];

                angular.forEach(data.history, function(item) {
                    var status = '<i class="ion-help-circled" title="unknown"></i>';
                    if (item.status == 0)
                        status = '<i class="ion-android-time" title="pending"></i>';
                    if (item.status == 1)
                        status = '<i class="ion-checkmark-round balanced" title="validated"></i>';
                    if (item.status == 2)
                        status = '<i class="ion-android-alert assertive" title="canceled"></i>';

                    $scope.history.items.push({
                        id: item.id,
                        amount: item.amount,
                        date: item.date * 1000,
                        description: item.description,
                        status: status,
                        runningBalance: item.runningBalance
                    });
                });
            },
            /* error */
            function(data) {
                alert('Network error');
            }
        );
    };
    $ionicLoading.show({
        template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
    });
    $scope.updateHistory();

}])

/***********************************************************************************************************************
 *
 *  SpStoreCtrl controller
 *
 **********************************************************************************************************************/
.controller('SpStoreCtrl', ['$scope', '$state', '$stateParams', '$yobsnSpStore', '$ionicLoading', '$templateCache', function($scope, $state, $stateParams, $yobsnSpStore, $ionicLoading, $templateCache) {

    $ionicLoading.show({
        template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
    });

    var first_balance = '0';
    $scope.balance = first_balance;

    $scope.categoryData = [{
        id: 0,
        icon: 'sp-shop-all-icon@2x.png',
        name: 'All'
    }, {
        id: 1,
        icon: 'sp-shop-Entertainment-icon@2x.png',
        name: 'Entertainment'
    }, {
        id: 2,
        icon: 'sp-shop-Personal-Improvementl-icon@2x.png',
        name: 'Personal Improvment'
    }, {
        id: 3,
        icon: 'sp-shop-Health-and-Fitness-icon@2x.png',
        name: 'Health and Fitness'
    }, {
        id: 4,
        icon: 'sp-shop-Marketing-Essentials-icon@2x.png',
        name: 'Marketing Essentials'
    }, {
        id: 5,
        icon: ''
    }, {
        id: 6,
        icon: ''
    }, {
        id: 7,
        icon: 'sp-shop-Miscellaneous-icon@2x.png',
        name: 'Miscellaneous'
    }];

    // init category data
    $scope.categories = {
        items: []
    };

    $yobsnSpStore.getCategories().then(
            /* success */
            function(data) {
                $ionicLoading.hide();

                var balance = data.balance;
                $scope.balance = balance;
                // init first category (All)
                $scope.categories.items.push({
                    id: 0,
                    icon: 'sp-shop-all-icon@2x.png',
                    name: 'All'
                });
                console.log(data.categories);
                angular.forEach(data.categories, function(item) {
                    $scope.categories.items.push({
                        id: item.id,
                        icon: $scope.categoryData[item.id].icon,
                        name: item.name,
                    });

                });
            },
            /* error */
            function(data) {
                console.log(data);
            })
        .finally(function() {
            $scope.$broadcast('scroll.infiniteScrollComplete');
        });

    $scope.features = {
        items: []
    };

    var id = "7";
    var subcat = "";
    var smth = "";

    $yobsnSpStore.getProducts(id, subcat, smth).then(
        /* success */
        function(data) {
            $ionicLoading.hide();
            console.log("features");
            angular.forEach(data.products, function(item) {
                $scope.features.items.push({
                    id: item.id,
                    thumbnail: item.thumbnail,
                });
            });
        },
        /* error */
        function(data) {
            $ionicLoading.hide();
            alert('Network error');
        }
    );
    $scope.purchaseHistory = function() {
        $state.go('app.sp-store-purchased-list');
    };

    $scope.reload = function() {
        $state.transitionTo('app.sp-store', $stateParams, {
            reload: true
        });
    }

    // $yobsnSpStore.purchaseHistory().then(
    //     /* success */
    //     function(data) {
    //       if (data.history.length === 0) {
    //         console.log("No purchased product history");
    //         $scope.high = '70vh';
    //       } else {
    //         $scope.history = data.history;
    //         $scope.high = '43vh';
    //       }
    //     },
    //     /* error */
    //     function(data) {
    //       return false;
    //     })
    //   .finally(function() {
    //     $scope.$broadcast('scroll.infiniteScrollComplete');
    //   });

}])

/***********************************************************************************************************************
 *
 *  SpPurchasedListCtrl Controller
 *
 **********************************************************************************************************************/
.controller('SpPurchasedListCtrl', ['$scope', '$rootScope', '$stateParams', '$yobsnSpStore', '$ionicLoading', '$localStorage', '$state', '$templateCache', '$timeout', function($scope, $rootScope, $stateParams, $yobsnSpStore, $ionicLoading, $localStorage, $state, $templateCache, $timeout) {

    $ionicLoading.show({
        template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
    });

    $scope.balance = 0;
    // $templateCache.removeAll();

    $yobsnSpStore.getCategories().then(
            /* success */
            function(data) {
                var balance = data.balance;
                $scope.balance = balance;
            },
            /* error */
            function(data) {
                console.log(data);
            })
        .finally(function() {
            $scope.$broadcast('scroll.infiniteScrollComplete');
        });

    $scope.history = {
        items: []
    };

    $yobsnSpStore.purchaseHistory().then(
            /* success */
            function(data) {
                $ionicLoading.hide();

                if (data.history.length === 0) {
                    console.log("No purchased product history");
                } else {
                    angular.forEach(data.history, function(item) {
                        var isDownloaded = false;
                        var product = {
                            id: item.productID,
                            downloadURL: item.downloadUrl
                        }
                        $yobsnSpStore.isProductDownloaded(product).then(
                            function() {
                                isDownloaded = true;
                            }
                        ).finally(function() {
                            $scope.history.items.push({
                                id: item.id,
                                thumb: item.thumb,
                                shortDescription: item.shortDescription,
                                name: item.name,
                                price: item.price,
                                productID: item.productID,
                                downloadURL: item.downloadUrl,
                                isDownloaded: isDownloaded
                            });
                        });
                    });
                }
            },
            /* error */
            function(data) {
                console.log(data);
                return false;
            })
        .finally(function() {
            $ionicLoading.hide();
        });

    $scope.download = function(item) {
        var product = {
            id: item.productID,
            downloadURL: item.downloadURL
        };
        $yobsnSpStore.productDownload(product);
    }

    $scope.load = function(item) {
        var product = {
            id: item.productID,
            downloadURL: item.downloadURL
        };
        window.resolveLocalFileSystemURL($yobsnSpStore.productGetLocalPath(product), function(fileEntry) {
            window.plugins.fileOpener.open(fileEntry.toURL(), "_self", "location=yes,enableViewportScale=yes,toolbarposition=top");
        }, function() {
            alert('Error opening file');
        });
    };
}])

/***********************************************************************************************************************
 *
 *  SpProductListCtrl Controller
 *
 **********************************************************************************************************************/
.controller('SpProductListCtrl', ['$scope', '$state', '$rootScope', '$stateParams', '$yobsnSpStore', '$ionicLoading', '$templateCache', function($scope, $state, $rootScope, $stateParams, $yobsnSpStore, $ionicLoading, $templateCache) {

    $ionicLoading.show({
        template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
    });

    $scope.balance = 0;

    var subcat = "";
    var smth = "";

    $scope.products = {
        items: []
    };

    $yobsnSpStore.getProducts($stateParams.id, subcat, smth).then(
        /* success */
        function(data) {
            $ionicLoading.hide();
            $scope.categoryName = data.products[0].categoryName;

            $scope.balance = data.balance;

            angular.forEach(data.products, function(item) {
                $scope.products.items.push({
                    id: item.id,
                    categoryName: item.categoryName,
                    thumbnail: item.thumbnail,
                    shortDescription: item.shortDescription,
                    name: item.name,
                    price: item.price
                });
            });
        },

        /* error */
        function(data) {
            $ionicLoading.hide();
            alert('Network error');
        }
    );

    // $templateCache.removeAll();
    // Purchase History Button
    $scope.purchaseHistory = function(id) {
        $state.go('app.sp-store-purchased-list');
    };

}])

/***********************************************************************************************************************
 *
 *  SpProductInfoCtrl Controller
 *
 **********************************************************************************************************************/
.controller('SpProductInfoCtrl', ['$scope', '$state', '$rootScope', '$stateParams', '$yobsnSpStore', '$ionicLoading', '$templateCache', '$ionicPopup', function($scope, $state, $rootScope, $stateParams, $yobsnSpStore, $ionicLoading, $templateCache, $ionicPopup) {

    $ionicLoading.show({
        template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
    });

    $scope.balance = 0;
    $scope.product = null;

    $yobsnSpStore.getProduct($stateParams.id).then(
        /* success */
        function(data) {
            $ionicLoading.hide();
            $scope.balance = data.balance;
            $scope.product = data.product;

            var purchasedBool = $scope.product.purchased;
            if (purchasedBool === 0) {
                $scope.purchaseVisibility = 'visible';
            } else {
                $scope.downloadVisibility = 'visible';
            }
        },
        /* error */
        function(data) {
            $ionicLoading.hide();
            alert('Network error');
        }
    );

    // $templateCache.removeAll();

    $scope.purchaseHistory = function() {
        $state.go('app.sp-store-purchased-list');
    };

    $scope.purchaseProduct = function() {
        var i = $scope.balance;
        var j = $scope.product.price;
        var k = i - j;
        if ($scope.product.purchased === 0) {
            if (k >= 0) {
                $ionicPopup.confirm({
                    title: 'Confirm purchase',
                    template: 'Are you sure you want to purchase this product for ' + j + ' SP ?',
                    okText: 'Purchase'
                }).then(function(res) {
                    if (res)
                        window.location.href = "#/app/sp-store-product-download/" + $scope.product.id + "&0";
                });
            } else {
                $ionicPopup.alert({
                    title: 'Sorry !',
                    template: 'You don\'t have enough SP to purchase this product',
                });
                return true;
            }
        } else {
            window.location.href = "#/app/sp-store-product-download/" + $scope.product.id + "&1";
        }
    };
}])

/***********************************************************************************************************************
 *
 *  SpProductDownloadCtrl Controller
 *
 **********************************************************************************************************************/
.controller('SpProductDownloadCtrl', ['$scope', '$state', '$stateParams', '$yobsnSpStore', '$ionicLoading', 'localStorageService', '$ionicPopup', '$cordovaFileTransfer', '$timeout', function($scope, $state, $stateParams, $yobsnSpStore, $ionicLoading, localStorageService, $ionicPopup, $cordovaFileTransfer, $timeout) {

    var progessinit = {
        'percent': 0,
        'total': 0,
        'loaded': 0,
        'info': 'Processing ...'
    };
    $scope.progress = progessinit;
    $scope.product = null;
    $scope.isProductDownloaded = false;

    $ionicLoading.show({
        template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
    });

    if ($stateParams.down == "0") {
        $yobsnSpStore.purchaseProduct($stateParams.id).then(
            /* success */
            function(data) {
                $ionicLoading.hide();
                $scope.balance = data.balance;
                $scope.downloadUrl = data.downloadURL;
                $scope.msg = localStorageService.set($stateParams.id + '_msg', data.msg);
            },

            /* error */
            function(data) {
                $ionicLoading.hide();
                alert('Network error');
            }
        );
    }

    $yobsnSpStore.getProduct($stateParams.id).then(
        /* success */
        function(data) {
            $scope.balance = data.balance;
            $scope.product = data.product;
            $scope.msg = localStorageService.get($stateParams.id + '_msg');
            $yobsnSpStore.isProductDownloaded(data.product).then(function() {
                $scope.isProductDownloaded = true;
            });
        },

        /* error */
        function(data) {
            alert('Network error');
        }
    );

    // Product downloading
    $scope.download = function() {
        $yobsnSpStore.productDownload($scope.product);
    };

    $scope.load = function() {
        window.resolveLocalFileSystemURL($yobsnSpStore.productGetLocalPath($scope.product), function(fileEntry) {
            window.plugins.fileOpener.open(fileEntry.toURL(), "_self", "location=yes,enableViewportScale=yes,toolbarposition=top");
        }, function() {
            alert('Error opening file');
        });
    };

    $scope.purchaseHistory = function() {
        $state.go('app.sp-store-purchased-list');
    };

}])

/***********************************************************************************************************************
 *
 *  CompanyUpdates controller
 *
 **********************************************************************************************************************/
.controller('CompanyUpdates', ['$scope', '$sessionStorage', '$sce', '$ionicLoading', '$state', '$stateParams', '$yobsnBindOnClick', function($scope, $sessionStorage, $sce, $ionicLoading, $state, $stateParams, $yobsnBindOnClick) {
    var url = 'http://yobsn.com/?mobembed=hpp-company-updates&sid=' + $sessionStorage['sid'];
    $scope.iframeurl = $sce.trustAsResourceUrl(url);
    $ionicLoading.show({
        template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
    });
    angular.element('#company-updates').load(function() {
        $ionicLoading.hide();
    });
    $scope.reload = function() {
        $ionicLoading.show({
            template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
        });
        angular.element('#company-updates')[0].contentWindow.location = $scope.iframeurl;
        angular.element('#company-updates').load(function() {
            $ionicLoading.hide();
        });
    };

    $yobsnBindOnClick.bindOnClick(angular.element('#menu-company-updates'), $scope.reload);
}])

/***********************************************************************************************************************
 *
 *  MobileHelp controller
 *
 **********************************************************************************************************************/
.controller('MobileHelp', ['$scope', '$ionicLoading', function($scope, $ionicLoading) {
    $ionicLoading.show({
        template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
    });
    angular.element('#mobile-help').load(function() {
        $ionicLoading.hide();
    });
}])

/***********************************************************************************************************************
 *
 *  MyWebsiteCtrl controller
 *
 **********************************************************************************************************************/
.controller('MyWebsiteCtrl', ['$scope', '$yobsnSettings', '$sce', '$window', '$cordovaInAppBrowser', '$state', '$ionicHistory', function($scope, $yobsnSettings, $sce, $window, $cordovaInAppBrowser, $state, $ionicHistory) {
    $ionicHistory.nextViewOptions({
        disableBack: true
    });
    $scope.customSite = $sce.trustAsResourceUrl($yobsnSettings.setting_data.customSite);
    $scope.customSiteTitle = $yobsnSettings.setting_data.customSiteTitle;
    $scope.iframeHeight = $window.innerHeight;
    if ($yobsnSettings.setting_data.customSiteNewWindow == 1) {
        $cordovaInAppBrowser.open($yobsnSettings.setting_data.customSite, '_system');
        $state.go('app.smart-chirp-list');
    }
}])


/***********************************************************************************************************************
 *
 *  SmartChirpCtrl controller
 *
 **********************************************************************************************************************/
.controller('SmartChirpCtrl', ['$scope', '$stateParams', '$yobsnSmartChirp', '$ionicLoading', '$filter', '$ionicPopup', function($scope, $stateParams, $yobsnSmartChirp, $ionicLoading, $filter, $ionicPopup) {

    $ionicLoading.show({
        template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
    });

    function hydrateComments(data) {
        angular.forEach(data.comments, function(comment) {
            $scope.item.comments.items.unshift(hydrateComment(comment));
        });
    }

    function hydrateComment(comment) {
        return {
            id: comment.comment_id,
            name: comment.name,
            date: comment.date,
            hours: $filter('date')(comment.date, 'shortTime'),
            stars: comment.stars,
            message: comment.comment,
            avatar_image: comment.avatar_image,
            can_be_deleted: comment.can_be_deleted
        };
    }

    function getSingle(id) {
        $yobsnSmartChirp.getSingle(id)
            .then(function(data) {
                $scope.item = {
                    id: data.info.message_id,
                    name: data.info.name,
                    date: data.info.date,
                    hours: $filter('date')(data.info.date, 'shortTime'),
                    stars: data.info.stars,
                    message: data.info.message,
                    avatar_image: data.info.avatar_image,
                    member_id: data.info.member_id,
                    can_be_deleted: data.info.can_be_deleted,
                    comments: {
                        page: 1,
                        items: [],
                        hasNext: false
                    }
                };

                if (data.info.comments > 0) {
                    $yobsnSmartChirp.getCommentsList(data.info.message_id)
                        .then(function(data) {
                            hydrateComments(data);
                            $scope.item.comments.hasNext = data.next_comments;
                        }, function() {
                            alert('Network error');
                        })
                        .finally(function() {
                            $ionicLoading.hide();
                            // document.getElementById('comment-input').focus();
                        });
                } else {
                    $ionicLoading.hide();
                    // document.getElementById('comment-input').focus();
                }
            }, function(data) {
                alert('Network error');
                $ionicLoading.hide();
                // document.getElementById('comment-input').focus();
            });
    }
    getSingle($stateParams.smartchirpId);

    $scope.item = {};

    $scope.refreshComment = function(messageId) {
        $ionicLoading.show({
            template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
        });
        getSingle(messageId);
    };

    $scope.sendComment = function(id) {
        if ($scope.comment) {
            $ionicLoading.show({
                template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
            });
            var unix = Math.round(+new Date() / 1000);
            $yobsnSmartChirp.sendComment(id, $scope.comment)
                .then(function(data) {
                    getSingle(id);
                    $scope.comment = null;
                }, function() {
                    alert('Network error');
                })
                .finally(function() {
                    $ionicLoading.hide();
                });
        }
    };

    $scope.getMoreComments = function(id) {
        $scope.comments.page += 1;
        $yobsnSmartChirp.getCommentsList(id, $scope.comments.page)
            .then(
                /* success */
                function(data) {
                    hydrateComments(data);
                    $scope.comments.hasNext = data.next_comments;
                },

                /* error */
                function(data) {
                    alert('Network error');
                }
            )
            .finally(function() {
                //
            });
    };

    $scope.deleteComment = function(messageId, commentId) {
        $ionicPopup.confirm({
                title: 'Are you sure?',
                template: 'Are you sure you want to delete this comment?',
                okText: 'Delete'
            })
            .then(function(res) {
                if (res) {
                    $ionicLoading.show({
                        template: 'Loading<br><ion-spinner icon="android"></ion-spinner>'
                    });
                    $yobsnSmartChirp.deleteComment(commentId)
                        .then(function(data) {
                            getSingle(messageId);
                        }, function(data) {
                            alert('Network error');
                        })
                        .finally(function() {
                            $ionicLoading.hide();
                        });
                }
            });
    };
}])

/***********************************************************************************************************************
 *
 *  PdfController Controller
 *
 **********************************************************************************************************************/

.controller('PdfController', ['$scope', 'PDFViewerService', '$stateParams', function($scope, pdf, $stateParams) {

    $scope.pdfURL = $stateParams.url;
    $scope.instance = pdf.Instance("viewer");

    $scope.nextPage = function() {
        $scope.instance.nextPage();
    };

    $scope.prevPage = function() {
        $scope.instance.prevPage();
    };

    $scope.gotoPage = function(page) {
        $scope.instance.gotoPage(page);
    };

    $scope.pageLoaded = function(curPage, totalPages) {
        $scope.currentPage = curPage;
        $scope.totalPages = totalPages;
    };

    $scope.loadProgress = function(loaded, total, state) {
        console.log('loaded =', loaded, 'total =', total, 'state =', state);
    };
}]);