;(function (factory) {
  'use strict';
  var g = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this;
  var module = g.module;
  var define = g.define;
  var angular = g.angular;

  if (typeof module !== "undefined" && typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory(angular);
  }
  if (typeof define !== "undefined" && typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    define(function () {
      return factory(angular);
    });
  }
  if (angular) {
    factory(angular);
  }
})(function (angular) {
  'use strict';

  if (!angular) throw new Error("this module depend on the Angular and you didn't load it");

  var atStorage = angular.module('atStorage', []);

  atStorage.provider('atStorage', function () {

    /**
     * default config
     * @type {{}}
     */
    var day = 1000 * 60 * 60 * 24;
    var config = {
      autoInit: true,
      expiredTime: day * 60,
      prefix: 'atStorage',
      prefixLink: '-',
      storageType: 'localStorage'
    };

    /**
     * set the global expired time
     * @param time{string,number}    unit:mm
     * @returns {*}
     */
    this.setExpiredTime = function (time) {
      config.expiredTime = time;
      return this;
    };

    /**
     * set the storage's key prefix
     * @param prefix
     * @returns {*}
     */
    this.setPrefix = function (prefix) {
      config.prefix = prefix;
      return this;
    };

    /**
     * set the string-link between storage's prefix and the origin key
     * @param prefixLink
     * @returns {*}
     */
    this.setPrefixLink = function (prefixLink) {
      config.prefixLink = prefixLink;
      return this;
    };

    /**
     * set use which storage the data
     * @param storage     'localStorage' or 'sessionStorage'
     * @returns {*}
     */
    this.setStorageType = function (storage) {
      if (storage !== 'localStorage' && storage !== 'sessionStorage') {
        console.error('%s must be localStorage or sessionStorage', storage);
        return this;
      }
      config.storageType = storage;
      return this;
    };

    /**
     * when angular run ,this module auto init?
     * @param auto{boolean}
     * @returns {*}
     */
    this.autoInit = function (auto) {
      config.autoInit = auto;
      return this;
    };

    // Method for instantiating
    this.$get = ['$window', '$document', function ($window, $document) {

      var storage = $window[config.storageType];

      var isSupport = !!storage;

      if (!isSupport) {
        console.error('your browser is not support the localStorage');
        return {};
      }

      var document = window.document || $document || $window.document;

      /**
       * match the key is atStorage-key or not
       * @type {RegExp}
       * @private
       */
      var _AT_STORAGE_KEY_REG = /^[^-]+-([^-]+)/g;

      /**
       * parse a anyKey to atStorage-key
       * @param anyKey
       * @returns {string} atStorage-key
       * @private
       */
      var _parseKey = function (anyKey) {
        return _AT_STORAGE_KEY_REG.test(anyKey) ? anyKey : config.prefix + config.prefixLink + anyKey;
      };

      /**
       * revert a atStorageKey to origin key
       * @param atStorageKey
       * @returns {*|string}      origin key
       * @private
       */
      var _revertKey = function (atStorageKey) {
        return _AT_STORAGE_KEY_REG.test(atStorageKey) ?
        atStorageKey.replace(_AT_STORAGE_KEY_REG, '$1') || '' : atStorageKey;
      };

      /**
       * private method to check this key is use atStorage to set it or not
       * @param anyKey
       * @returns {boolean}
       * @private
       */
      var _isAtStorage = function (anyKey) {
        var result = false;
        var value = storage.getItem(anyKey);

        if (!value) {
          return false;
        }

        if (/setTime/mg.test(value) && /expiredTime/mg.test(value)) {
          result = true
        }
        return result;
      };

      /**
       * set the localStorage
       * @param key             key
       * @param value           value
       * @param expiredTime     how long you want to keep it in you browser
       */
      var setStorage = function (key, value, expiredTime) {
        var constructor = {
          setTime: new Date().getTime(),
          key: key,
          value: value,
          expiredTime: expiredTime || config.expiredTime
        };
        storage.setItem(_parseKey(key), angular.toJson(constructor));
        return constructor;
      };

      /**
       * get the storage
       * @param originKey origin key
       * @returns {*}     value
       */
      var getStorage = function (originKey) {
        var atStorageKey = _parseKey(originKey);
        var item = {};

        // not exist or expired
        if (!storage[atStorageKey] || hasExpired(originKey)) {
          remove(originKey);
          return undefined;
        }

        try {
          item = angular.fromJson(storage.getItem(atStorageKey));
        } catch (error) {
          console.error('JSON was broken : %s', originKey);
          remove(originKey);
        }

        return item.value;
      };

      /**
       * Return array of keys for local storage, ignore keys that not owned.
       */
      var keys = function () {
        var result = [];
        var allStorage = getAll();
        angular.forEach(allStorage, function (item) {
          result.push(item.key);
        });
        return result;
      };

      /**
       * get all the storage
       * only get the item which didn't expired
       * @returns {Array}
       */
      var getAll = function () {
        var allStorage = [];
        var constructor = {};
        var originKey;
        angular.forEach(storage, function (value, key) {
          // if use this module set and didn't expired
          // if not
          if (!_isAtStorage(key)) return;

          originKey = _revertKey(key);

          if (!hasExpired(originKey)) {
            constructor = {};
            constructor.key = originKey;
            constructor.value = get(originKey);
            allStorage.push(constructor);
          }

        });
        return allStorage;
      };

      /**
       * has a session in localStorage?
       * @param originKey
       * @returns {boolean}
       */
      var has = function (originKey) {
        return !hasExpired(originKey);
      };

      /**
       * key a item is expired or not
       * @param originKey         origin key
       * @returns {boolean}
       */
      var hasExpired = function (originKey) {
        var completeValue = {};
        var hasExpired = true;
        var nowTime;
        var atStorageKey = _parseKey(originKey);
        var wrapperValue = storage.getItem(atStorageKey);

        if (wrapperValue) {
          // avoid parse json error
          try {
            completeValue = angular.fromJson(wrapperValue);
            nowTime = new Date().getTime();
            hasExpired = completeValue.setTime + completeValue.expiredTime < nowTime;
          } catch (error) {
            console.error('JSON was broken : %s', originKey);
            hasExpired = true;
            remove(originKey);
          }
        } else {
          hasExpired = true;
          storage.removeItem(atStorageKey);
        }

        return hasExpired;
      };

      /**
       * remove the storage
       * @param anyKey      any key
       * @returns {*}       the key you has remove
       */
      var remove = function (anyKey) {
        var atStorageKey = _parseKey(anyKey);
        storage.removeItem(atStorageKey);
        return anyKey;
      };

      /**
       * removeAll storage only remove that use atStorage to set
       * @returns {Array}
       */
      var removeAll = function () {
        var removeKey = [];
        var originKey;
        angular.forEach(storage, function (value, key) {
          if (_isAtStorage(key)) {
            originKey = _revertKey(key);
            remove(originKey);
            removeKey.push(originKey);
          }
        });
        return removeKey;
      };

      /**
       * watch key storage change,when it change and run watcher
       * @param key       origin key
       * @param watcher   watch function
       */
      var _watchList = {};
      var _hasWatch = false;
      /**
       * run watch
       */
      var watch = function () {
        // watch once
        if (_hasWatch) return;
        $window.addEventListener('storage', function (e) {
          angular.forEach(_watchList, function (watcherList, key) {
            var atStorageKey = e.key;
            var originKey = _revertKey(atStorageKey);
            var newVal = e.newValue;
            var oldVal = e.oldValue;

            // avoid the parse error
            try {
              newVal = JSON.parse(newVal).value;
              oldVal = JSON.parse(oldVal).value;
            } catch (error) {
              newVal = undefined;
              oldVal = undefined;
            }

            // not match the key
            if (originKey !== key) return;

            // in the same window,void this bug in IE9+
            // if ($window.$$identifiers === e.srcElement.$$identifiers) return;

            if (newVal === oldVal) return;


            // trigger
            angular.forEach(watcherList, function (watcherObj) {
              if (watcherObj.watcher && angular.isFunction(watcherObj.watcher)) {
                watcherObj.watcher(newVal, oldVal, e);
              }
            })

          });

        }, false);
        _hasWatch = true;
      };

      /**
       * put the key and watcher to watchList
       * @param key{string}
       * @param watcher{function}
       * @param $scope{scope}      if afferent $scope,it will auto cancel the watcher when $scope destroy
       * @returns {cancelWatch}
       */
      var watchQueue = function (key, watcher, $scope) {
        watch();
        // push to then queue
        if (!_watchList[key]) {
          _watchList[key] = [];
        }

        var $$id = Math.random();

        _watchList[key][0] = {
          $$id: $$id,
          watcher: watcher
        };

        // if is a $scope,the watcher will be destroy with $scope
        if ($scope && $scope.$id && $scope.$parent && angular.isFunction($scope.$on)) {
          $scope.$on('$destroy', function () {
            cancelWatch();
          })
        }

        /**
         * a function to cancel this key'watcher
         */
        function cancelWatch() {
          angular.forEach(_watchList, function (watcherList) {
            angular.forEach(watcherList, function (watcher, id) {
              if (watcher.$$id === $$id) {
                debugger;
                watcherList = watcherList.splice(id, 1);
              }
            });
          });

          // if the Queue is empty and remove it
          if (!_watchList[key] ||
            (_watchList[key] &&
            angular.isArray(_watchList[key]) && !_watchList[key].length)) {
            _watchList[key] = undefined;
            debugger;
            delete _watchList[key];
          }

        }

        /**
         * return a function to cancel this watcher
         */
        return cancelWatch;

      };

      var init = function () {
        var originKey;
        angular.forEach(storage, function (value, key) {
          // if use this module set
          if (_isAtStorage(key)) {
            // if this storage has expired and remove it
            originKey = _revertKey(key);
            if (hasExpired(originKey)) {
              remove(originKey);
            }
          }
        });
      };

      var cookie = {};

      cookie.isSupport = !!document.cookie;

      /**
       * check the cookie has a key or not
       * @param originKey
       * @returns {boolean}
       */
      cookie.has = function (originKey) {
        var result = false;
        var value = cookie.get(originKey);
        if (angular.isBoolean(value)) {
          result = true;
        } else {
          result = !!value;
        }
        return result;
      };

      /**
       * Return array of keys for cookie, ignore keys that not owned.
       * @returns {Array}
       */
      cookie.keys = function () {
        var result = [];
        var allCookie = cookie.getAll();
        angular.forEach(allCookie, function (item) {
          result.push(item.key);
        });
        return result;
      };
      /**
       * set the cookie
       * @param key         origin key
       * @param value       any type value
       * @param expiredTime number  unit:mm
       */
      cookie.set = function (key, value, expiredTime) {
        expiredTime = expiredTime || config.expiredTime;
        // what time is now?
        var expiredDate = new Date();
        // expiredDay
        expiredDate.setTime(expiredDate.getTime() + expiredTime);
        // the key
        key = config.prefix + config.prefixLink + key;
        // the value
        value = angular.toJson(value);
        // write in the document
        document.cookie = key + "=" + value + ((expiredTime == null) ? "" : ";expires=" + expiredDate.toGMTString());
      };

      /**
       * get the cookie
       * @param originKey   origin key
       * @returns {*}       value
       */
      cookie.get = function (originKey) {

        var atStorageKey = _parseKey(originKey);

        var value = null;

        var arr, reg = new RegExp("(^| )" + atStorageKey + "=([^;]*)(;|$)");

        if (arr = document.cookie.match(reg)) {
          try {
            value = angular.fromJson((arr[2]));
          } catch (error) {
            console.error('JSON was broken : %s', originKey);
            value = null;
          }
        }

        return value;
      };

      /**
       * get the all cookie
       * @returns {Array}
       */
      cookie.getAll = function () {
        var result = [];
        var match;
        if (document.cookie) {
          match = document.cookie.split(/\;\s?/gm);
          angular.forEach(match, function (item) {
            var cons = {};
            var _match = item.match(/^([^=]+)=([^=]+)$/);
            var _key = _match[1];
            var _value = _match[2];

            if (_key === undefined || _value === undefined) {
              return
            }

            // ignore the key you don't own
            if (!new RegExp('^' + config.prefix + config.prefixLink).test(_key)) {
              return;
            }

            // avoid the JSON parse error
            try {
              _value = JSON.parse(_value);
            } catch (error) {
            }

            cons.key = _revertKey(_key);
            cons.value = _value;
            result.push(cons);
          });
        }
        return result;
      };

      /**
       * remove a cookie
       * @param originKey
       */
      cookie.remove = function (originKey) {
        var atStorageKey = _parseKey(originKey);
        var date = new Date();
        date.setTime(date.getTime() - 100000);
        document.cookie = atStorageKey + "=a; expires=" + date.toGMTString();
      };

      /**
       * clear all the cookie you own
       * @returns {Array}
       */
      cookie.clearAll = function () {
        var removeItems = [];
        var allCookie = coookie.getAll();
        angular.forEach(allCookie, function (item) {
          cookie.remove(item.key);
          removeItems.push(item);
        });
        return removeItems;
      };

      /**
       * check the cookie has expired or not
       * @param originKey
       * @returns {boolean}
       */
      cookie.hasExpired = function (originKey) {
        return !cookie.get(originKey);
      };

      var _cookieIsWatching = false;
      var _cookieWatchList = {};
      var _cookieWatch = function () {
        // only watch once
        if (_cookieIsWatching) return;

        var loop = $window.setInterval(function () {
          var allCookie = cookie.getAll();
          // if no cookie or watchList is empty,clear the loop
          if (!allCookie || !allCookie.length || !Object.keys(_cookieWatchList).length) {
            loop && $window.clearInterval(loop);
            _cookieIsWatching = false;
            return;
          }

          angular.forEach(allCookie, function (item) {
            var key = item.key;
            var newVal = item.value;

            angular.forEach(_cookieWatchList, function (watchArr, k) {

              if (!watchArr) return;

              var oldVal = watchArr.oldVal;

              // avoid it will run once when init the server
              // if (!oldVal) return;

              if (k !== key) return;

              // if (angular.equals(newVal) !== angular.equals(oldVal)) {
              if (newVal !== oldVal) {

                if (!watchArr[0]) return;

                // trigger watcher
                watchArr[0].watcher(newVal, oldVal);

                // change the oldVal to newVal
                watchArr.oldVal = newVal;
              }

            });

          });

        }, 1500);       // ? 
        _cookieIsWatching = true;
      };

      cookie.$watch = function (originKey, watcher, $scope) {
        _cookieWatch();

        if (!_cookieWatchList[originKey]) {
          _cookieWatchList[originKey] = [];
        }

        var $$id = Math.random();

        _cookieWatchList[originKey][0] = {
          $$id: $$id,
          oldVal: cookie.get(originKey),
          watcher: watcher
        };

        // if is a $scope,the watcher will be destroy with $scope
        if ($scope && $scope.$id && $scope.$parent && angular.isFunction($scope.$on)) {
          $scope.$on('$destroy', function () {
            cancelWatch();
          })
        }

        /**
         * remove this cookie from the Queue
         */
        function cancelWatch() {
          angular.forEach(_cookieWatchList, function (watcherList) {
            angular.forEach(watcherList, function (watcher, id) {
              if (watcher.$$id === $$id) {
                watcherList = watcherList.splice(id, 1);
              }
            });
          });

          // if the Queue is empty and remove it
          if (!_cookieWatchList[originKey] ||
            (_cookieWatchList[originKey] &&
            angular.isArray(_cookieWatchList[originKey]) && !_cookieWatchList[originKey].length)) {
            _cookieWatchList[originKey] = undefined;
            delete _cookieWatchList[originKey];
          }

        }

        /**
         * return a function to cancel this watcher
         */
        return cancelWatch;

      };

      var _export;
      /**
       * if not support the localStorage use cookie instead of it
       */
      if (!isSupport) {
        _export = {
          isSupport: cookie.isSupport,
          keys: cookie.keys,
          has: cookie.has,
          set: cookie.set,
          get: cookie.get,
          getAll: cookie.getAll,
          remove: cookie.remove,
          clearAll: cookie.clearAll,
          watch: cookie.$watch,
          init: angular.noop,
          cookie: cookie,
          storageType: 'cookie'
        }
      } else {
        _export = {
          isSupport: isSupport,
          keys: keys,
          has: has,
          set: setStorage,
          get: getStorage,
          getAll: getAll,
          remove: remove,
          clearAll: removeAll,
          hasExpired: hasExpired,
          watch: watchQueue,
          init: init,
          cookie: cookie,
          storageType: config.storageType
        };
      }

      /**
       * auto init?
       */
      if (!!config.autoInit) {
        _export.init();
      }

      return _export;

    }]

  });
  return atStorage;
});