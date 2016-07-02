angular.module('YOBSN', ['ionic', 'YOBSN.controllers', 'YOBSN.services', 'YOBSN.directives', 'ngStorage', 'ngCordova', 'angularMoment', 'ngSanitize', 'pasvaz.bindonce', 'LocalStorageModule', 'linkify'])

.run(['$rootScope', '$ionicPlatform', '$state', '$cordovaSplashscreen', '$timeout', '$localStorage', '$yobsnAuth', '$yobsnSettings', '$yobsnVersion', '$ionicPopup', '$cordovaInAppBrowser', '$ionicLoading', function($rootScope, $ionicPlatform, $state, $cordovaSplashscreen, $timeout, $localStorage, $yobsnAuth, $yobsnSettings, $yobsnVersion, $ionicPopup, $cordovaInAppBrowser, $ionicLoading) {
  $ionicPlatform.ready(function() {
    $ionicLoading.show({
      template: 'Initializing app<br><ion-spinner icon="android"></ion-spinner>'
    });
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    (function(cordova) {
      var WebIntent = function() {

      };

      WebIntent.prototype.ACTION_SEND = "android.intent.action.SEND";
      WebIntent.prototype.ACTION_VIEW = "android.intent.action.VIEW";
      WebIntent.prototype.EXTRA_TEXT = "android.intent.extra.TEXT";
      WebIntent.prototype.EXTRA_SUBJECT = "android.intent.extra.SUBJECT";
      WebIntent.prototype.EXTRA_STREAM = "android.intent.extra.STREAM";
      WebIntent.prototype.EXTRA_EMAIL = "android.intent.extra.EMAIL";
      WebIntent.prototype.ACTION_CALL = "android.intent.action.CALL";
      WebIntent.prototype.ACTION_SENDTO = "android.intent.action.SENDTO";

      WebIntent.prototype.startActivity = function(params, success, fail) {
        return cordova.exec(function(args) {
          success(args);
        }, function(args) {
          fail(args);
        }, 'WebIntent', 'startActivity', [params]);
      };

      WebIntent.prototype.hasExtra = function(params, success, fail) {
        return cordova.exec(function(args) {
          success(args);
        }, function(args) {
          fail(args);
        }, 'WebIntent', 'hasExtra', [params]);
      };

      WebIntent.prototype.getUri = function(success, fail) {
        return cordova.exec(function(args) {
          success(args);
        }, function(args) {
          fail(args);
        }, 'WebIntent', 'getUri', []);
      };

      WebIntent.prototype.getExtra = function(params, success, fail) {
        return cordova.exec(function(args) {
          success(args);
        }, function(args) {
          fail(args);
        }, 'WebIntent', 'getExtra', [params]);
      };


      WebIntent.prototype.onNewIntent = function(callback) {
        return cordova.exec(function(args) {
          callback(args);
        }, function(args) {}, 'WebIntent', 'onNewIntent', []);
      };

      WebIntent.prototype.sendBroadcast = function(params, success, fail) {
        return cordova.exec(function(args) {
          success(args);
        }, function(args) {
          fail(args);
        }, 'WebIntent', 'sendBroadcast', [params]);
      };

      window.webintent = new WebIntent();

      // backwards compatibility
      window.plugins = window.plugins || {};
      window.plugins.webintent = window.webintent;
    })(window.PhoneGap || window.Cordova || window.cordova);

    // Get stored account info
    $rootScope.$storage = $localStorage.$default({
      rememberAccount: false,
      username: '',
      password: ''
    });

    $rootScope.menu = {
      style: 'left-menu-style-dark',
      menuLogoURL: '',
      items: []
    };

    $rootScope.scrollPosition = {};
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
      var element = angular.element('.keepScrollPos');
      if(element.length > 0 && $rootScope.scrollPosition){
        $rootScope.scrollPosition[fromState.name] = element.scrollTop();
      }
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      var element = angular.element('.keepScrollPos');
      if(element.length > 0 && $rootScope.scrollPosition[toState.name]){
        $timeout(function(){
          element.scrollTop($rootScope.scrollPosition[toState.name]);
        }, 50);
      }
    });

    $yobsnVersion.needUpdate()
      .then(function(data) {
        $ionicLoading.hide();
        if (data.force) {
          $ionicPopup.alert({
              title: 'Upgrade',
              template: 'A newer version of the software is available! The update is very important and updating is required!',
              okText: 'Update Now',
            })
            .then(function(res) {
              $cordovaInAppBrowser.open(data.yobsnMobileAndroidURL, {
                  hidden: 'yes'
                })
                .finally(function(event) {
                  navigator.app.exitApp();
                });
            });
        } else {
          $ionicPopup.confirm({
              title: 'Upgrade',
              template: 'A newer version of the software is available!',
              okText: 'Update Now',
              cancelText: 'Continue with current version'
            })
            .then(function(res) {
              if (res) {
                $cordovaInAppBrowser.open(data.yobsnMobileAndroidURL, {
                    hidden: 'yes'
                  })
                  .finally(function(event) {
                    navigator.app.exitApp();
                  });
              } else {
                goToLogin();
              }
            });

        }
      }, function() {
        goToLogin();
      });

    function goToLogin() {

      if ($rootScope.$storage.username && $rootScope.$storage.username.length > 0) {

        // Get owner's settings
        console.log('stored username:' + $rootScope.$storage.username);
        console.log('stored password:' + $rootScope.$storage.password);
        console.log('stored remember:' + $rootScope.$storage.rememberAccount);

        $yobsnAuth.login($rootScope.$storage.username, $rootScope.$storage.password).then(

          /* success */
          function(data) {
            console.log('app run avatar_image:' + $yobsnAuth.login_data.avatarURL);
            console.log('app run full name:' + $yobsnAuth.login_data.nameText);

            $yobsnSettings.getSettings().then(

              /* success */
              function(data) {
                $ionicLoading.hide();
                if ($yobsnSettings.setting_data.logoURL && $yobsnSettings.setting_data.logoURL.length > 0) {
                  $yobsnSettings.setting_data.loadingType = 'loading-type-custom-logo';
                } else {
                  $yobsnSettings.setting_data.loadingType = 'loading-type-custom';
                }

                if ($yobsnSettings.setting_data.loadingType == 'loading-type-custom') {
                  $state.go('login-custom');
                } else {
                  $state.go('login-custom-logo');
                }
              },

              /* error */
              function(data) {
                $ionicLoading.hide();
                $yobsnSettings.setting_data.loadingType = 'loading-type-simple';
                $state.go('login-simple');
              }
            );
          },

          /* error */
          function(data) {
            $ionicLoading.hide();
            $yobsnSettings.setting_data.loadingType = 'loading-type-simple';
            $state.go('login-simple');
          }
        );
      } else {
        $ionicLoading.hide();
        $yobsnSettings.setting_data.loadingType = 'loading-type-simple';
        $state.go('login-simple');
      }
    }

  });
}])

.config(['$stateProvider', '$urlRouterProvider', '$provide', function($stateProvider, $urlRouterProvider, $provide) {
  $stateProvider

    .state('login-simple', {
    url: '/login-simple',
    cache: false,
    templateUrl: 'templates/login-simple.html',
    controller: 'LoginCtrl'
  })

  .state('login-custom', {
    url: '/login-custom',
    cache: false,
    templateUrl: 'templates/login-custom.html',
    controller: 'LoginCtrl'
  })

  .state('login-custom-logo', {
    url: '/login-custom-logo',
    cache: false,
    templateUrl: 'templates/login-custom-logo.html',
    controller: 'LoginCtrl'
  })

  .state('license-agreement', {
    url: '/license-agreement',
    templateUrl: 'templates/license-agreement.html',
    controller: 'LicenseAgreementCtrl'
  })

  .state('signup', {
    url: '/signup',
    templateUrl: 'templates/signup.html',
    controller: 'SignupCtrl'
  })

  .state('app', {
    url: "/app",
    abstract: true,
    cache: false,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })

  .state('app.smart-chirp-list', {
    url: "/smart-chirp-list?v",
    views: {
      'menuContent': {
        templateUrl: "templates/smart-chirp-list.html",
        controller: 'SmartChirpListCtrl'
      }
    }
  })

  .state('app.smart-chirp-new', {
    url: "/smart-chirp-new",
    views: {
      'menuContent': {
        templateUrl: "templates/smart-chirp-new.html",
        controller: 'SmartChirpNewCtrl'
      }
    }
  })

  .state('app.my-avatar', {
    url: "/my-avatar",
    cache: false,
    views: {
      'menuContent': {
        templateUrl: "templates/my-avatar.html",
        controller: 'MyAvatarCtrl'
      }
    }
  })

  .state('app.video-conferencing', {
    url: "/video-conferencing",
    cache: false,
    views: {
      'menuContent': {
        templateUrl: "templates/video-conferencing.html",
        controller: 'VideoConfCtrl'
      }
    }
  })

  .state('app.my-friends', {
    url: "/my-friends",
    views: {
      'menuContent': {
        templateUrl: "templates/my-friends.html",
        controller: 'MyFriendsCtrl'
      }
    }
  })

  .state('app.groups-list', {
    url: "/groups-list",
    cache: false,
    views: {
      'menuContent': {
        templateUrl: "templates/groups-list.html",
        controller: 'GroupsListCtrl'
      }
    }
  })

  .state('app.friends-list', {
    url: "/friends-list/:groupId",
    cache: false,
    views: {
      'menuContent': {
        templateUrl: "templates/friends-list.html",
        controller: 'FriendsListCtrl'
      }
    }
  })

  .state('app.friend-search', {
    url: "/friend-search",
    views: {
      'menuContent': {
        templateUrl: "templates/friend-search.html",
        controller: 'FriendSearchCtrl'
      }
    }
  })

  .state('app.group-edit', {
    url: "/group-edit/:groupId",
    views: {
      'menuContent': {
        templateUrl: "templates/group-edit.html",
        controller: 'GroupEditCtrl'
      }
    }
  })

  .state('app.friends-request', {
    url: "/friends-request",
    cache: false,
    views: {
      'menuContent': {
        templateUrl: "templates/friends-request.html",
        controller: 'FriendsRequestCtrl'
      }
    }
  })

  .state('app.my-friend', {
    url: "/my-friend/:memberId",
    views: {
      'menuContent': {
        templateUrl: "templates/my-friend.html",
        controller: 'MyFriendCtrl'
      }
    }
  })

  .state('app.friend-profile', {
    url: "/friend-profile/:memberId",
    views: {
      'menuContent': {
        templateUrl: "templates/friend-profile.html",
        controller: 'FriendProfileCtrl'
      }
    }
  })

  .state('app.friend-move-group', {
    url: "/friend-move-group/:memberId",
    views: {
      'menuContent': {
        templateUrl: "templates/friend-move-group.html",
        controller: 'FriendMoveGroupCtrl'
      }
    }
  })

  .state('app.in-game-revenue', {
      url: "/in-game-revenue",
      views: {
          'menuContent': {
              templateUrl: "templates/in-game-revenue.html",
              controller: 'InGameRevenueCtrl'
          }
      }
  })

  .state('app.in-game-revenue-detail', {
      url: "/in-game-revenue-detail/:id",
      views: {
          'menuContent': {
              templateUrl: "templates/in-game-revenue-detail.html",
              controller: 'InGameRevenueDetailCtrl'
          }
      }
  })

  .state('app.sp-history', {
    url: "/sp-history",
    cache: false,
    views: {
      'menuContent': {
        templateUrl: "templates/sp-history.html",
        controller: 'SpHistoryCtrl'
      }
    }
  })

  .state('app.sp-store', {
    url: "/sp-store",
    // cache: false,
    views: {
      'menuContent': {
        templateUrl: "templates/sp-store.html",
        controller: 'SpStoreCtrl'
      }
    }
  })

  .state('app.sp-store-purchased-list', {
    url: "/sp-store-purchased-list",
    views: {
      'menuContent': {
        templateUrl: "templates/sp-store-purchased-list.html",
        controller: 'SpPurchasedListCtrl'
      }
    }
  })

  .state('app.sp-store-products-list', {
    url: "/sp-store-products-list/:id",
    views: {
      'menuContent': {
        templateUrl: "templates/sp-store-products-list.html",
        controller: 'SpProductListCtrl'
      }
    }
  })

  .state('app.sp-store-product-info', {
    url: "/sp-store-product-info/:id",
    views: {
      'menuContent': {
        templateUrl: "templates/sp-store-product-info.html",
        controller: 'SpProductInfoCtrl'
      }
    }
  })

  .state('app.sp-store-product-download', {
    url: "/sp-store-product-download/:id&:down",
    views: {
      'menuContent': {
        templateUrl: "templates/sp-store-product-download.html",
        controller: 'SpProductDownloadCtrl'
      }
    }
  })

  .state('app.sp-store-product-open', {
    url: "/sp-store-product-open/:url",
    views: {
      'menuContent': {
        templateUrl: "templates/sp-store-product-open.html",
        controller: 'PdfController'
      }
    }
  })

  .state('app.company-updates', {
    url: "/company-updates",
    views: {
      'menuContent': {
        templateUrl: "templates/company-updates.html",
        controller: 'CompanyUpdates'
      }
    }
  })

  .state('app.mobile-help', {
    url: "/mobile-help",
    views: {
      'menuContent': {
        templateUrl: "templates/mobile-help.html",
        controller: 'MobileHelp'
      }
    }
  })

  .state('app.my-website', {
    url: "/my-website",
    views: {
      'menuContent': {
        templateUrl: "templates/my-website.html",
        controller: 'MyWebsiteCtrl'
      }
    }
  })

  .state('app.smart-chirp-single', {
    url: "/smart-chirp-list/:smartchirpId",
    views: {
      'menuContent': {
        templateUrl: "templates/smart-chirp.html",
        controller: 'SmartChirpCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  //$urlRouterProvider.otherwise('/login');

  $provide.decorator('$state', ['$delegate', '$yobsnSettings', '$rootScope', function($delegate, $yobsnSettings, $rootScope) {
    var transitionToFn = $delegate.transitionTo;

    $delegate.transitionTo = function(to, toParams, options) {
      var version;
      to = angular.isString(to) ? to : to.name;
      var link = to.indexOf('#') === 0 ? to : $delegate.href(to);
      if (options && options['reload']) {
        angular.forEach($yobsnSettings.menu.items, function(item) {
          if (link == '#/' + item.link) {
            version = Math.round(Math.random() * (10000 - 1) + 1);
            item.version = version;
          }
        });
      } else {
        angular.forEach($yobsnSettings.menu.items, function(item) {
          if (link == '#/' + item.link) {
            version = item.version;
          }
        });

      }
      if (version !== undefined) {
        toParams = toParams || {};
        toParams['v'] = version;
      }
      if(toParams && toParams['nokeepscroll']){
        $rootScope.scrollPosition[to] = undefined;
      }
      return transitionToFn.apply(null, [to, toParams, options]);
    };
    return $delegate;
  }]);
}]);