angular.module('YOBSN.services', ['ngStorage'])

.constant('API_SERVER', 'http://yobsn.com/remote-yobsn.php')
    .constant('SECURED_API_SERVER', 'https://yobsn.com/remote-yobsn.php')
    //.constant('API_SERVER', 'http://localhost:8100/remote-yobsn.php')


.factory('$yobsnAuth', ['$http', '$q', '$sessionStorage', 'API_SERVER', '$yobsnSmartChirp', function($http, $q, $sessionStorage, API_SERVER, $yobsnSmartChirp) {

    var service = {};

    service.login_data = {
        username: '',
        password: '',
        avatarURL: '',
        nameText: ''
    };

    // reset network session
    service.resetSession = function() {
        $sessionStorage.$reset();
    };

    service.signup = function(data) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=register';
        var formData = 'RefID=' + encodeURIComponent(data.RefID) +
            '&Email=' + encodeURIComponent(data.Email) +
            '&Firstname=' + encodeURIComponent(data.Firstname) +
            '&Lastname=' + encodeURIComponent(data.Lastname) +
            '&Password=' + encodeURIComponent(data.Password);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: data.error,
                    detail: 'error'
                });
            });

        return deferred.promise;
    };


    // login function
    service.login = function(username, password) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=login';
        var formData = 'usr=' + encodeURIComponent(username) +
            '&pwd=' + encodeURIComponent(password) +
            '&success_act=get-chirps';

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result === true) {
                    $sessionStorage['is_free'] = data['is_free'];
                    $sessionStorage['access_level'] = data['access_level'];
                    // Save avatar and login name
                    service.login_data.username = username;
                    service.login_data.password = password;
                    service.login_data.avatarURL = data.avatar_image;
                    service.login_data.nameText = data.name;

                    // Save session id
                    $sessionStorage['sid'] = data.sid;

                    if (data.chirps.result === true) {
                        $yobsnSmartChirp.chirps = data.chirps;
                    }

                    deferred.resolve(data);
                } else {

                    // Reset session id
                    service.resetSession();

                    deferred.reject(data);
                }
            })
            .error(function(data) {

                // Reset session id
                service.resetSession();

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.',
                    detail: 'network'
                });
            });

        return deferred.promise;
    };

    // logout function
    service.logout = function() {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=logout';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Reset session id
                service.resetSession();

                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                // Reset session id
                service.resetSession();

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    };

    return service;
}])

.factory('$yobsnSettings', ['$http', '$q', '$sessionStorage', 'API_SERVER', '$ionicLoading', function($http, $q, $sessionStorage, API_SERVER, $ionicLoading) {

    var service = {};

    service.setting_data = {
        bgURL: '',
        logoURL: '',
        loadingText: '',
        loadingType: ''
    };

    service.menu_data = {
        'chirp-list': {
            icon: 'smart-chirp@2x.png',
            link: 'app/smart-chirp-list',
            display: true
        },
        'avatar' : {
            icon: 'avatar-creator@2x.png',
            link: 'app/my-avatar',
            display: true
        },
        'get-friends' : {
            icon: 'my-friends@2x.png',
            link: 'app/my-friends',
            display: true
        },
        'get-in-games-history' : {
            icon: 'in-game-revenue@2x.png',
            link: 'app/in-game-revenue',
            display: true
        },
        'soc-points-history': {
            icon: 'sp-history@2x.png',
            link: 'app/sp-history',
            display: true
        },
        'soc-points-store' : {
            icon: 'store@2x.png',
            link: 'app/sp-store',
            display: true
        },
        'menu-help' : {
            icon: 'company-updates@2x.png',
            link: 'app/mobile-help',
            display: true
        },
        'company-updates' : {
            icon: 'company-updates@2x.png',
            link: 'app/company-updates',
            display: function(){return !$sessionStorage['is_free'];}
        },
        'video-conferencing' : {
            icon: 'video-conferencing@2x.png',
            link: 'app/video-conferencing',
            display: true
        },
        'my-website': {
            icon: 'myWebsite-icon@2x.png',
            link: 'app/my-website',
            display: true
        }
    };

    service.menu = {
        style: 'left-menu-style-dark',
        menuLogoURL: '',
        items: []
    };

    // getSettings function
    service.getSettings = function() {
        $ionicLoading.hide();
        $ionicLoading.show({
            template: 'Retrieving settings<br><ion-spinner icon="android"></ion-spinner>'
        });
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=get-mobile-owner-settings';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']);

        apiUrl += '&' + formData;

        // Init menu
        service.menu.items = [];

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {

                    // Save setting data
                    service.setting_data.bgURL = data.loadingBackgroundURL;
                    service.setting_data.logoURL = data.loadingLogoURL;
                    service.setting_data.loadingText = data.loadingText;
                    service.setting_data.customSite = data.customSite;
                    service.setting_data.customSiteTitle = data.customSiteTitle;
                    service.setting_data.customSiteNewWindow = data.customSiteNewWindow;

                    // set menu action you want to test
                    // LEAVE IT TO FALSE AFTER TESTS !!!!
                    var testMenuEntry = false;

                    // Save menu data
                    angular.forEach(data.menu, function(menu_item) {
                        if(service.menu_data[menu_item.action] && service.menu_data[menu_item.action].display){
                            service.menu.items.push({
                                id: menu_item.id,
                                action: menu_item.action,
                                label: menu_item.title,
                                icon: service.menu_data[menu_item.action].icon,
                                link: service.menu_data[menu_item.action].link,
                                first: service.menu.items.length === 0 ? 'first-item' : '',
                                version: Math.round(Math.random() * (10000 - 1) + 1)
                            });
                        }
                    });

                    if (testMenuEntry) {
                        service.menu.items.push({
                            id: testMenuEntry,
                            label: 'test ' + service.menu_data[testMenuEntry].link,
                            icon: service.menu_data[testMenuEntry].icon,
                            link: service.menu_data[testMenuEntry].link,
                            first: '',
                            version: Math.round(Math.random() * (10000 - 1) + 1)
                        });
                    }

                    if (data.style == 'dark')
                        service.menu.style = 'left-menu-style-dark';
                    else
                        service.menu.style = 'left-menu-style-light';

                    service.menu.menuLogoURL = data.menuLogoURL;

                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    };
    return service;
}])

.factory('Chats', function() {
    // Might use a resource here that returns a JSON array

    // Some fake testing data
    var chats = [{
        id: 0,
        name: 'Ben Sparrow',
        lastText: 'You on your way?',
        face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
    }, {
        id: 1,
        name: 'Max Lynx',
        lastText: 'Hey, it\'s me',
        face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
    }, {
        id: 2,
        name: 'Andrew Jostlin',
        lastText: 'Did you get the ice cream?',
        face: 'https://pbs.twimg.com/profile_images/491274378181488640/Tti0fFVJ.jpeg'
    }, {
        id: 3,
        name: 'Adam Bradleyson',
        lastText: 'I should buy a boat',
        face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
    }, {
        id: 4,
        name: 'Perry Governor',
        lastText: 'Look at my mukluks!',
        face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
    }];

    return {
        all: function() {
            return chats;
        },
        remove: function(chat) {
            chats.splice(chats.indexOf(chat), 1);
        },
        get: function(chatId) {
            for (var i = 0; i < chats.length; i++) {
                if (chats[i].id === parseInt(chatId, 10)) {
                    return chats[i];
                }
            }
            return null;
        }
    };
})

.factory('$yobsnHistory', ['$http', '$q', '$sessionStorage', 'API_SERVER', function($http, $q, $sessionStorage, API_SERVER) {

    //Return public API
    return ({
        getSPHistory: getSPHistory
    });

    //getSPHistory
    function getSPHistory(from_id) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=soc-points-history';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&' + 'from_id=' + from_id;

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result === true) {

                    deferred.resolve(data);

                } else {

                    deferred.reject(data);

                }
            })
            .error(function(data) {

                // Reset session id
                $sessionStorage['sid'] = '';

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

}])

.factory('$yobsnSmartChirp', ['$http', '$q', '$sessionStorage', 'API_SERVER', function($http, $q, $sessionStorage, API_SERVER) {
    this.chirps = null;

    // Return public API.
    return ({
        getSingle: getSingle,
        getCommentsList: getCommentsList,
        sendComment: sendComment,
        deleteComment: deleteComment,
        getList: getList,
        postChirp: postChirp,
        markAsSpam: markAsSpam,
        deleteMessage: deleteMessage,
    });

    // get single chirp
    function getSingle(messageId) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=chirp-info';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&messid=' + messageId;
        var self = this;

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    function getCommentsList(messageId, page) {
        page = page || 1;
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=chirp-comments';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&messid=' + messageId + '&page=' + page;
        var self = this;

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    // getMenu function
    function getList(page, force) {
        page = page || 1;
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=chirp-list';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&page=' + page;
        var self = this;

        apiUrl += '&' + formData;

        if (force || this.chirps == null) {
            $http({
                    method: "GET",
                    url: apiUrl,
                    headers: {}
                })
                .success(function(data) {

                    // Parse json data
                    if (data.result === true) {
                        deferred.resolve(data);
                        this.chirps = data;
                    } else {
                        deferred.reject(data);
                    }
                })
                .error(function(data) {

                    deferred.reject({
                        result: false,
                        error: 'Network error. Please try again.'
                    });
                });
        } else {
            deferred.resolve(this.chirps);
        }

        return deferred.promise;
    }

    function markAsSpam(messageId) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=mark-chirp-msg-spam';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&messid=' + messageId;
        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    function deleteMessage(messageId) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=delete-chirp-msg';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&messid=' + messageId;
        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    function sendComment(messageId, comment) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=send-chirp-comment';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&messid=' + messageId + '&comment=' + window.btoa(comment);
        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    function deleteComment(commentId) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=delete-chirp-comment';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&commentid=' + commentId;
        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    function postChirp(chirp, attached_item) {
        var apiUrl = API_SERVER + '?act=send-chirp';
        var deferred = $q.defer();
        var message = window.btoa(unescape(encodeURIComponent(chirp.text)));
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&message=' + message;

        apiUrl += '&' + formData;
        if (attached_item) {
            var attach_str = 'attach[0][name]=' + attached_item.name + '&attach[0][size]=' + attached_item.size + '&attach[0][type]=' + attached_item.type + '&attach[0][thumbname]=' + attached_item.thumbnail_name;
            apiUrl += '&' + attach_str;
        }

        console.log(apiUrl);

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });
        return deferred.promise;
    }

}])

.factory('$yobsnSpStore', ['$http', '$q', '$sessionStorage', 'API_SERVER', '$ionicPopup', '$cordovaFileTransfer', '$ionicLoading', function($http, $q, $sessionStorage, API_SERVER, $ionicPopup, $cordovaFileTransfer, $ionicLoading) {

    //Return public API
    return ({
        getCategories: getCategories,
        getProducts: getProducts,
        getProduct: getProduct,
        purchaseProduct: purchaseProduct,
        purchaseHistory: purchaseHistory,
        productDownload: productDownload,
        productGetLocalPath: productGetLocalPath,
        isProductDownloaded: isProductDownloaded
    });

    //Get all categories
    function getCategories() {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=get-smart-shop-categories';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']);
        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {
                // Reset session id
                $sessionStorage['sid'] = '';
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    //Get all products in selected category
    function getProducts(cat, subcat, smth) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=get-smart-shop-products';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&category=' + cat + '&subcategory=' + subcat + '&kwd=' + smth;

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    //Get selected product info
    function getProduct(id) {
        $ionicLoading.show({
            template: 'Getting product<br><ion-spinner icon="android"></ion-spinner>'
        });

        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=get-smart-shop-product';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&id=' + id;
        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            })
            .finally(function() {
                $ionicLoading.hide();
            });

        return deferred.promise;
    }

    //Purchase selected product info
    function purchaseProduct(pid) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=purchase-smart-shop-product';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) + '&id=' + pid;

        apiUrl += '&' + formData;
        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    //Purchases History
    function purchaseHistory() {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=get-smart-shop-history';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']);

        apiUrl += '&' + formData;
        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    function productGetLocalPath(product) {
        var store = cordova.file.externalApplicationStorageDirectory;
        var fileName = product.id + '.pdf';
        var path = store + fileName;
        return path;
    }

    function productDownload(product) {
        $ionicPopup.confirm({
            'title': 'Product download',
            'template': 'You are about to download a file over network, this may consume a large data amount, are you sure?',
            'okText': 'Download'
        }).then(function(res) {
            if (res) {
                $cordovaFileTransfer.download(product.downloadURL, productGetLocalPath(product), {}).then(
                    function(entry) {
                        // Success!
                        window.plugins.fileOpener.open(entry.toURL(), "_self", "location=yes,enableViewportScale=yes,toolbarposition=top");
                    },
                    function(err) {
                        // Error
                        console.log(err);
                        alert('download Error, please try again later !');
                    },
                    function(progress) {
                        // constant progress updates
                        if (progress.lengthComputable) {
                            $scope.progress['info'] = 'Download in progress ...'
                            $scope.progress['percent'] = progress.loaded / progress.total * 100;
                            $scope.progress['total'] = progress.total / 1024;
                            $scope.progress['loaded'] = progress.loaded / 1024;
                            if (Math.round($scope.progress['percent']) == 100)
                                $scope.progress['info'] = 'Processing ...';
                        }
                    }
                );
            }
        });
    }

    function isProductDownloaded(product) {
        var deferred = $q.defer();
        window.resolveLocalFileSystemURL(productGetLocalPath(product), function(fileEntry) {
            deferred.resolve();
        }, function() {
            deferred.reject();
        });
        return deferred.promise;
    }

}])

.factory('$yobsnVersion', ['$http', '$q', 'SECURED_API_SERVER', '$cordovaAppVersion', '$rootScope', '$ionicLoading', function($http, $q, SECURED_API_SERVER, $cordovaAppVersion, $rootScope, $ionicLoading) {

    //Return public API
    return ({
        needUpdate: needUpdate
    });

    $rootScope.appVer = 'not defined';

    //get version and check if need update
    function needUpdate() {
        $ionicLoading.hide();
        $ionicLoading.show({
            template: 'Checking updates<br><ion-spinner icon="android"></ion-spinner>'
        });
        var deferred = $q.defer();
        var apiUrl = SECURED_API_SERVER + '?act=get-software-versions-info';

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {
                try {
                    $cordovaAppVersion.getAppVersion().then(function(version) {
                        var earliestAllowedYOBSNMobile = parseFloat(data.earliestAllowedYOBSNMobile, 10);
                        var mostRecentYOBSNMobile = parseFloat(data.mostRecentYOBSNMobile, 10);
                        $rootScope.appVer = version;
                        // Parse json data
                        if (mostRecentYOBSNMobile > version) {
                            data.force = earliestAllowedYOBSNMobile > version;
                            deferred.resolve(data);
                        } else {
                            deferred.reject(data);
                        }
                    }, function() {
                        deferred.reject({
                            result: false,
                            error: 'Detecting version error.'
                        });
                    });
                } catch (e) {
                    deferred.reject({
                        result: false,
                        error: 'Unable to get app version'
                    });
                }

                // var version = parseFloat(VERSION, 10);
            })
            .error(function(data) {
                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });
        return deferred.promise;
    }
}])

.factory('$yobsnFriends', ['$http', '$q', '$sessionStorage', 'API_SERVER', function($http, $q, $sessionStorage, API_SERVER) {

    var service = {};

    service.friends = [];
    service.next_friends = 0;
    service.selected_friends = [];

    // http://yobsn.com/remote-yobsn.php?act=get-friends&sid=SESSION_ID&groupid=GROUP_ID&page=PAGE_NUMBER&limit=LINES_PER_PAGE
    service.getFriends = function(group_id, page_num, page_size) {

        service.friends = [];
        service.next_friends = 0;

        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=get-friends';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'groupid=' + encodeURIComponent(group_id) +
            '&' + 'page=' + encodeURIComponent(page_num) +
            '&' + 'limit=' + encodeURIComponent(page_size);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result == true) {

                    angular.forEach(data.friends, function(friend) {
                        service.friends.push({
                            member_id: friend.member_id,
                            username: friend.username,
                            name: friend.name,
                            stars: friend.stars,
                            avatar_image: friend.avatar_image,
                            group_id: friend.group_id
                        });
                    });

                    service.next_friends = data.next_friends;

                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }


    // http://yobsn.com/remote-yobsn.php?sid=SESSION_ID&act=move-friend-to-group&groupid=GROUP_ID&mid=FRIEND_ID
    service.moveFriendToGroup = function(group_id, member_id) {

        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=move-friend-to-group';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'groupid=' + encodeURIComponent(group_id) +
            '&' + 'mid=' + encodeURIComponent(member_id);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result == true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    // http://yobsn.com/remote-yobsn.php?sid=SESSION_ID&act=move-friend-to-group&groupid=GROUP_ID&mid[0]=FRIEND_ID_1&mid[1]=FRIEND_ID_2&&mid[2]=FRIEND_ID_3
    service.moveFriendsToGroup = function(group_id, members) {

        var member_ids = '';

        for (var i = 0; i < members.length; i++) {
            var member_id = 'mid[' + i + ']=' + members[i];

            if (member_ids != '') member_ids += '&';
            member_ids += member_id;
        }

        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=move-friend-to-group';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'groupid=' + encodeURIComponent(group_id) +
            '&' + member_ids;

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result == true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    service.getFriend = function(member_id) {

        for (var i = 0; i < service.friends.length; i++) {

            if (service.friends[i].member_id == member_id) {
                return service.friends[i];
            }
        }

        return null;
    }

    // http://yobsn.com/remote-yobsn.php?sid=SESSION_ID&act=delete-friend&mid=MEMBER_ID
    service.RemoveFriend = function(member_id) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=delete-friend';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'mid=' + encodeURIComponent(member_id);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result == true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    return service;
}])

.factory('$yobsnFriendRequests', ['$http', '$q', '$sessionStorage', 'API_SERVER', function($http, $q, $sessionStorage, API_SERVER) {

    var service = {};

    // http://yobsn.com/remote-yobsn.php?act=get-friend-requests&sid=SESSION_ID
    service.getFriendRequests = function() {

        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=get-friend-requests';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result == true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    // http://yobsn.com/remote-yobsn.php?act=accept-friend-request&sid=SESSION_ID&mid=MEMBER_ID
    service.Accept = function(member_id) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=accept-friend-request';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'mid=' + encodeURIComponent(member_id);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result == true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    // http://yobsn.com/remote-yobsn.php?act=decline-friend-request&sid=SESSION_ID&mid=MEMBER_ID
    service.Decline = function(member_id) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=decline-friend-request';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'mid=' + encodeURIComponent(member_id);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result == true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    // http://yobsn.com/remote-yobsn.php?sid=SESSION_ID&act=send-friend-request&mid=MEMBER_ID
    service.SendFriendRequest = function(member_id) {
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=send-friend-request';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'mid=' + encodeURIComponent(member_id);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result == true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    return service;
}])

.factory('$yobsnProfile', function($http, $q, $sessionStorage, API_SERVER) {

    var profile = {

        member_id: null,
        firstname: '',
        lastname: '',
        username: '',
        country: '',
        work_status: '',
        job_title: '',
        interests: '',
        birthdate: '',
        comments: '',

        group_id: null,
        group_name: '',
        avatar_image: '',
        stars: 0
    };

    return {
        setGroupId: setGroupId,
        setGroupName: setGroupName,
        setAvatar: setAvatar,
        setRating: setRating,

        getGroupId: getGroupId,
        getGroupName: getGroupName,
        getAvatar: getAvatar,
        getRating: getRating,

        getPublicProfile: getPublicProfile,
        get: get
    }

    function setGroupId(group_id) {
        profile.group_id = group_id;
    }

    function getGroupId() {
        return profile.group_id;
    }

    function setGroupName(group_name) {
        profile.group_name = group_name;
    }

    function getGroupName() {
        return profile.group_name;
    }

    function setAvatar(avatar_image) {
        profile.avatar_image = avatar_image;
    }

    function getAvatar() {
        return profile.avatar_image;
    }

    function setRating(stars) {
        profile.stars = stars;
    }

    function getRating() {
        return profile.stars;
    }

    // http://yobsn.com/remote-yobsn.php?act=get-public-profile&sid=SID&mid=MEMBER_ID
    function getPublicProfile(member_id) {

        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=get-public-profile';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'mid=' + encodeURIComponent(member_id);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result == true) {

                    profile.member_id = data.profile.mid;
                    profile.firstname = data.profile.firstname;
                    profile.lastname = data.profile.lastname;
                    profile.username = data.profile.username;
                    profile.country = data.profile.country;
                    profile.work_status = data.profile.workStatus;
                    profile.job_title = data.profile.jobTitle;
                    profile.interests = data.profile.interests;
                    profile.birthdate = data.profile.birthdate;
                    profile.comments = data.profile.comments;

                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    function get() {
        return profile;
    }
})

.factory('$yobsnGroups', ['$http', '$q', '$sessionStorage', 'API_SERVER', function($http, $q, $sessionStorage, API_SERVER) {
    // Might use a resource here that returns a JSON array

    var service = {};

    service.groups = [];

    // http://yobsn.com/remote-yobsn.php?sid=SESSION_ID&act=get-friend-groups
    service.getGroups = function() {

        service.groups = [];

        // return friends;
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=get-friend-groups';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result === true) {

                    angular.forEach(data.groups, function(group) {
                        service.groups.push({
                            id: group.id,
                            name: group.name,
                            friends_count: group.friends_count
                        });

                    });

                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    };

    service.getGroupTitle = function(group_id) {

        console.log('service.getGroupTitle length=' + service.groups.length);

        for (var i = 0; i < service.groups.length; i++) {
            console.log('service.getGroupTitle: name=' + service.groups[i].name);
            if (service.groups[i].id == group_id)
                return service.groups[i].name;
        }

        return '';
    };

    service.setGroupTitle = function(group_id, group_title) {
        // http://yobsn.com/remote-yobsn.php?sid=SESSION_ID&act=edit-friend-group&id=GROUP_ID&name=GROUP_NAME_URLENCODED
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=edit-friend-group';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'id=' + encodeURIComponent(group_id) +
            '&' + 'name=' + encodeURIComponent(group_title);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    return service;
}])

.factory('$yobsnHugManager', ['$http', '$q', '$sessionStorage', 'API_SERVER', function($http, $q, $sessionStorage, API_SERVER) {

    var service = {};

    // http://yobsn.com/remote-yobsn.php?sid=SESSION_ID&act=send-hug&mid=FRIEND_ID
    service.sendHug = function(member_id) {

        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=send-hug';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'mid=' + encodeURIComponent(member_id);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result === true) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    }

    return service;
}])

.factory('$yobsnSearchFriendManager', ['$http', '$q', '$sessionStorage', 'API_SERVER', function($http, $q, $sessionStorage, API_SERVER) {

    var service = {};

    service.friends = [];
    service.next_friends = 0;

    // http://yobsn.com/remote-yobsn.php?act=search-friends&sid=SESSION_ID&by=BY_FIELD_CRITERIA&kwd=KEYWORD&page=PAGE_NUMBER&limit=PAGE_SIZE
    service.searchFriends = function(field, keyword, pagenumber, limit) {

        service.friends = [];
        service.next_friends = 0;

        // return friends;
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=search-friends';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'by=' + encodeURIComponent(field) +
            '&' + 'kwd=' + encodeURIComponent(keyword) +
            '&' + 'page=' + encodeURIComponent(pagenumber) +
            '&' + 'limit=' + encodeURIComponent(limit);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result === true) {

                    angular.forEach(data.friends, function(friend) {
                        service.friends.push({
                            member_id: friend.member_id,
                            username: friend.username,
                            name: friend.name,
                            stars: friend.stars,
                            avatar_image: friend.avatar_image,
                            is_friend: friend.is_friend
                        });
                    });

                    service.next_friends = data.next_friends;

                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    };

    return service;
}])

.factory('$yobsnInGameRevenue', ['$http', '$q', '$sessionStorage', 'API_SERVER', function($http, $q, $sessionStorage, API_SERVER) {

    var service = {};

    service.history = [];
    service.next_history = 0;

    // http://www.yobsn.com/remote-yobsn.php?sid=SESSION_ID&act=get-in-games-history
    service.getGameRevenue = function(pagenumber, limit, force) {

        if (force) {
            service.history = [];
            service.next_history = 0;
        }

        // return friends;
        var deferred = $q.defer();
        var apiUrl = API_SERVER + '?act=get-in-games-history';
        var formData = 'sid=' + encodeURIComponent($sessionStorage['sid']) +
            '&' + 'page=' + encodeURIComponent(pagenumber);

        apiUrl += '&' + formData;

        $http({
                method: "GET",
                url: apiUrl,
                headers: {}
            })
            .success(function(data) {

                // Parse json data
                if (data.result === true) {

                    angular.forEach(data.history, function(history) {
                        service.history.push({
                            id: history.id,
                            date: history.date * 1000,
                            gameName: history.gameName,
                            amt: history.amt,
                            status: history.status,
                            senderUsr: history.senderUsr,
                            purchaseAmt: history.purchaseAmt,
                            appleCommission: history.appleCommission,
                            recvUsrL1: history.recvUsrL1,
                            recvUsrL2: history.recvUsrL2,
                            amtL1: history.amtL1,
                            amtL2: history.amtL2
                        });
                    });

                    service.next_history = data.next;

                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            })
            .error(function(data) {

                deferred.reject({
                    result: false,
                    error: 'Network error. Please try again.'
                });
            });

        return deferred.promise;
    };

    service.getRevenueItem = function(id) {
        for (var i = 0; i < service.history.length; i++) {

            if (service.history[i].id == id) {
                return service.history[i];
            }
        }

        return null;
    };

    return service;
}])

.factory('$yobsnBindOnClick', [function(){
    var service = {};

    service.bindOnClick = function(element, callback){
        element.bind('click', callback);
    };

    return service;
}]);