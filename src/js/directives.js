angular.module('YOBSN.directives', ['ngSanitize'])

.run(['$templateCache', function($templateCache) {
    $templateCache.put('templates/flowplayer/video.html', '<div></div>');
}])

.directive('scrolly', function($window) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var raw = element[0];
            var unbindWatcher = scope.$watch(attrs.canload,function(newValue,oldValue){
                if(angular.element(element[0]).find('.scrolly-data').height() < angular.element($window).height()){
                    if(newValue)
                        scope.$eval(attrs.scrolly);
                }else{
                    unbindWatcher();
                }
            });
            element.bind('scroll', function() {
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    if (scope.$eval(attrs.canload))
                        scope.$eval(attrs.scrolly);
                }
            });
        }
    };
})

.directive('showhide', function() {
    return {
        restrict: 'C',
        link: function(scope, element, attrs) {

            var showdiv = angular.element(element.find('.show'));

            opened = true;
            showdiv.bind('click', toggle);

            function toggle() {
                opened = !opened;
                element.removeClass(opened ? 'closed' : 'opened');
                element.addClass(opened ? 'opened' : 'closed');
            }
            toggle();
        }
    };
})

.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if (event.which === 13) {
                scope.$apply(function() {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
})

.directive('flowplayer', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/flowplayer/video.html',
        scope: {
            type: '=',
            src: '=',
            onPlayerReady: '&'
        },
        link: function(scope, element, attrs) {
            var playlist = {};
            playlist[scope.type.replace('video/', '')] = scope.src;
            element.flowplayer({
                adaptiveRatio: true,
                keyboard: false,
                embed: false,
                fullscreen: false,
                tooltip: false,
                playlist: [
                    // a list of type-url mappings in picking order
                    [playlist]
                ],
                splash: false
            });

            element.off('touchstart');

            api = flowplayer(element);
            api.load();
            api.bind('ready', function(){
              scope.onPlayerReady({api:api});
            });
        }
    };
})

.directive('pdfviewer', ['$parse', function($parse) {
        var canvas = null;
        var instance_id = null;

        return {
            restrict: "E",
            template: '<canvas></canvas>',
            scope: {
                onPageLoad: '&',
                loadProgress: '&',
                src: '@',
                id: '='
            },
            controller: ['$scope', function($scope) {
                $scope.pageNum = 1;
                $scope.pdfDoc = null;
                $scope.scale = 1.0;

                $scope.documentProgress = function(progressData) {
                    if ($scope.loadProgress) {
                        $scope.loadProgress({
                            state: "loading",
                            loaded: progressData.loaded,
                            total: progressData.total
                        });
                    }
                };

                $scope.loadPDF = function(path) {
                    console.log('loadPDF ', path);
                    PDFJS.getDocument(path, null, null, $scope.documentProgress).then(function(_pdfDoc) {
                        $scope.pdfDoc = _pdfDoc;
                        $scope.renderPage($scope.pageNum, function(success) {
                            if ($scope.loadProgress) {
                                $scope.loadProgress({
                                    state: "finished",
                                    loaded: 0,
                                    total: 0
                                });
                            }
                        });
                    }, function(message, exception) {
                        console.log("PDF load error: " + message);
                        if ($scope.loadProgress) {
                            $scope.loadProgress({
                                state: "error",
                                loaded: 0,
                                total: 0
                            });
                        }
                    });
                };

                $scope.renderPage = function(num, callback) {
                    console.log('renderPage ', num);
                    $scope.pdfDoc.getPage(num).then(function(page) {
                        var viewport = page.getViewport($scope.scale);
                        var ctx = canvas.getContext('2d');

                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        page.render({
                            canvasContext: ctx,
                            viewport: viewport
                        }).promise.then(
                            function() {
                                if (callback) {
                                    callback(true);
                                }
                                $scope.$apply(function() {
                                    $scope.onPageLoad({
                                        page: $scope.pageNum,
                                        total: $scope.pdfDoc.numPages
                                    });
                                });
                            },
                            function() {
                                if (callback) {
                                    callback(false);
                                }
                                console.log('page.render failed');
                            }
                        );
                    });
                };

                $scope.$on('pdfviewer.nextPage', function(evt, id) {
                    if (id !== instance_id) {
                        return;
                    }

                    if ($scope.pageNum < $scope.pdfDoc.numPages) {
                        $scope.pageNum++;
                        $scope.renderPage($scope.pageNum);
                    }
                });

                $scope.$on('pdfviewer.prevPage', function(evt, id) {
                    if (id !== instance_id) {
                        return;
                    }

                    if ($scope.pageNum > 1) {
                        $scope.pageNum--;
                        $scope.renderPage($scope.pageNum);
                    }
                });

                $scope.$on('pdfviewer.gotoPage', function(evt, id, page) {
                    if (id !== instance_id) {
                        return;
                    }

                    if (page >= 1 && page <= $scope.pdfDoc.numPages) {
                        $scope.pageNum = page;
                        $scope.renderPage($scope.pageNum);
                    }
                });
            }],
            link: function(scope, iElement, iAttr) {
                canvas = iElement.find('canvas')[0];
                instance_id = iAttr.id;

                iAttr.$observe('src', function(v) {
                    console.log('src attribute changed, new value is', v);
                    if (v !== undefined && v !== null && v !== '') {
                        scope.pageNum = 1;
                        scope.loadPDF(scope.src);
                    }
                });
            }
        };
    }])
    .service("PDFViewerService", ['$rootScope', function($rootScope) {

        var svc = {};
        svc.nextPage = function() {
            $rootScope.$broadcast('pdfviewer.nextPage');
        };

        svc.prevPage = function() {
            $rootScope.$broadcast('pdfviewer.prevPage');
        };

        svc.Instance = function(id) {
            var instance_id = id;

            return {
                prevPage: function() {
                    $rootScope.$broadcast('pdfviewer.prevPage', instance_id);
                },
                nextPage: function() {
                    $rootScope.$broadcast('pdfviewer.nextPage', instance_id);
                },
                gotoPage: function(page) {
                    $rootScope.$broadcast('pdfviewer.gotoPage', instance_id, page);
                }
            };
        };

        return svc;
    }]);