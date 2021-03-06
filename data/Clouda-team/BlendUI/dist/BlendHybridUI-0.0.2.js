(function () {
/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("src/almond", function(){});

define(
    'src/common/lib/lang',['require'],function(require) {

        var lang = {};
        lang.inherits = function(subClass, superClass) {

            var Empty = function() {};
            Empty.prototype = superClass.prototype;
            var selfPrototype = subClass.prototype;
            var proto = subClass.prototype = new Empty();

            for (var key in selfPrototype) {
                proto[key] = selfPrototype[key];//?????????????????????????????????
            }
            subClass.prototype.constructor = subClass;
            subClass.superClass = superClass.prototype;

            return subClass;
        };

        lang.clone = function(source) {
            if (!source || typeof source !== 'object') {
                return source;
            }

            var result = source;
            if (u.isArray(source)) {
                result = u.clone(source);
            }
            else if (({}).toString.call(source) === '[object Object]' && ('isPrototypeOf' in source)) {
                result = {};
                for (var key in source) {
                    if (source.hasOwnProperty(key)) {
                        result[key] = lib.deepClone(source[key]);
                    }
                }
            }

            return result;
        };

        lang.extend = function(target, source) {
            for (var pro in source) {
                if (source.hasOwnProperty(pro) && typeof source[pro] != 'undefined') {
                    target[pro] = source[pro];
                }
            }
            return target;
        };
        return lang;
    }
);

define(
    'src/common/lib/string',['require'],function(require) {


        /**
         * @class blend.lib.string
         * @singleton
         * @private
         */

        var string = {};

        /**
         * ??????-????????????????????????????????????????????????????????????
         *
         * @param {string} str
         * @return {string}
         */
        string.toPascal = function(str) {
            if (!str) {
                return '';
            }
            return str.charAt(0).toUpperCase() + string.toCamel(str.slice(1));
        };

        /**
         * ??????-???????????????????????????????????????????????????
         *
         * @param {string} str
         * @return {string}
         */
        string.toCamel = function(str) {
            if (!str) {
                return '';
            }

            return str.replace(
                /-([a-z])/g,
                function(s) {
                    return s.toUpperCase();
                }
            );
        };
        return string;
    }
);

define(
    'src/common/lib',['require','./lib/lang','./lib/string'],function(require) {


        /**
         * @class blend.lib
         * @singleton
         * @private
         */
        var lib = {};

        var lang = require('./lib/lang');
        var string = require('./lib/string');

        var count = 0x861005;

        /**
         * ?????????????????????ID
         *
         * @param {string} prefix ??????
         */
        lib.getUniqueID = function(prefix) {
            prefix = prefix || 'BlendUI';
            return prefix + count++;
        };

        lib.noop = function() {};

        /**
         * ?????????????????????0 delay
         *
         * @param {Object} fn function
         */
        lib.offloadFn = function(fn) {
            setTimeout(fn || lib.noop, 0);
        };

        Array.prototype.contains = function (search){
            for(var i in this){
                if(this[i]==search){
                    return true;
                }
            }
            return false;
        }

        /**
         * string?????????lib??????
         *
         * @class {Object} string
         */
        /**
         * lang?????????lib??????
         *
         * @class {Object} lang
         */
        lang.extend(lib, lang);
        lang.extend(lib, string);

        return lib;

    }
);

define(
    'src/hybrid/api/core',['require'],function(require) {

        /**
         * @class blend.api.core
         * @blendui native???????????????
         * @private
         */
        var core = {};

        var apiFn = function(handler, args) {
            try {
                var api = window.nuwa_core || window.nuwa_runtime;
                return api[handler].apply(api, args);
            }catch (e) {
                console.log('BlendUI_Api_Error:'+ handler + '======');
                console.log(e);
            }
        };

        /**
         * ??????????????????
         * @method {Function} removeSplashScreen
         */
        core.removeSplashScreen = function() {
            apiFn('removeSplashScreen', arguments);
        };

        /**
         * ??????app??????
         * @method {Function} exitApp
         */
        core.exitApp = function() {
            apiFn('exitApp', arguments);
        };

        /**
         * ??????app??????
         * @method {Function} exitApp
         */
        core.launchApp = function(link) {
            apiFn('launchLightApp', arguments);
        };

        return core;
    }
);

define(
    'src/hybrid/api/config',['require'],function(require) {
        /**
         * @class LayoutRule
         * ?????????????????????????????????????????????
         * ???????????????????????????
         */

        var config = {

            /**
             * Rule that aligns the child's left edge with its RelativeLayout
             * parent's left edge.
             */
            ALIGN_PARENT_LEFT: 9,

            /**
             * Rule that aligns the child's top edge with its RelativeLayout
             * parent's top edge.
             */
            ALIGN_PARENT_TOP: 10,

            /**
             * Rule that aligns the child's right edge with its RelativeLayout
             * parent's right edge.
             */
            ALIGN_PARENT_RIGHT: 11,
            /**
             * Rule that aligns the child's bottom edge with its RelativeLayout
             * parent's bottom edge.
             */
            ALIGN_PARENT_BOTTOM: 12,

            /**
             * Rule that centers the child with respect to the bounds of its
             * RelativeLayout parent.
             */
            CENTER_IN_PARENT: 13,

            /**
             * Rule that centers the child horizontally with respect to the
             * bounds of its RelativeLayout parent.
             */
            CENTER_HORIZONTAL: 14,

            /**
             * Rule that centers the child vertically with respect to the
             * bounds of its RelativeLayout parent.
             */
            CENTER_VERTICAL: 15,

            IOS: /iP(ad|hone|od)/.test(navigator.userAgent),
            /**
             * devicePixelRatio
             */
            DEVICE_PR: (/iP(ad|hone|od)/.test(navigator.userAgent)) ? 1 : (window.devicePixelRatio || 2)
        };


        return config;

    }
);


define(
    'src/hybrid/api/event',['require'],function(require) {

        /**
         * @class event
         * @singleton
         * @private
         */
        var event = {};

        //????????????;
        var _type = [
            'layerCreateSuccess', //layer????????????
            'layerLoadFinish', //layer ??????????????????
            'layerPullDown', //????????????loading
            'layerPoped',//layer????????????
            'tap', //slider??????
            'slide',//slider ????????????
            'menuPressed',//???????????????
            'layerGoBack',//layer????????????goBack??????
            'backPressedBeforeExit'//???????????????????????????
        ];

        var handlers = {};
        var jsonParseFliter = function(key,val){
            if(val&&val.indexOf&&val.indexOf('function')>=0){
                 return new Function("return "+val)();
            }else{
                return val;
            }
        }

        event.on = function(type, handler, id, context, isonce) {
            var me = this;
            id = id || (this.getCurrentId && this.getCurrentId()) || 'empty';
            context = context || this;
            if (handlers[type]) {
                var i = 0,
                    listeners = handlers[type]['listener'],
                    len = listeners.length;
                for (; i < len; i++) {
                    if (listeners[i].id == id && listeners[i].callback == handler && listeners[i].context == context) {
                        break;
                    }
                }
                if (i == len) {
                   handlers[type]['listener'].push({
                     id: id,
                     context: context,
                     callback: handler
                   });
                }
                if (!handlers[type]['listened']) {
                    document.addEventListener(type, handlers[type].callback, false);
                    handlers[type]['listened'] = true;
                }
            }else {
                //console.log("??????????????????");
                handlers[type] = {};
                handlers[type]['listener'] = [];
                if (_type.indexOf(type) < 0) {
                    handlers[type]['callback'] = function(event) {
                        var parseData = JSON.parse(decodeURIComponent(event.data),jsonParseFliter);
                        var listeners = handlers[type]['listener'];
                        event.origin = event['sender'] || parseData.origin;
                        event.data = parseData.data;
                        event.detail = event.origin;
                        event.reciever = event.target = parseData.target;
                        for (var i = 0, len = listeners.length; i < len; i++) {
                            if (parseData.callEvent) {
                                event.callback = function(data) {
                                    me.fire(parseData.callEvent, event.origin, data);
                                };
                            }
                            listeners[i].callback.call(listeners[i].context, event, listeners[i].id);
                        }
                        isonce && me.off(type);
                    };
                }else {
                    handlers[type]['callback'] = function(event) {
                       var listeners = handlers[type]['listener'];
                        for (var i = 0, len = listeners.length; i < len; i++) {
                            if (listeners[i].id == event['origin']) {
                                event.detail = event.origin;
                               listeners[i].callback.call(listeners[i].context, event, listeners[i].id);
                            }
                        }
                        isonce && me.off(type);
                    };
                }
                this.on(type, handler, id, context);
            }
        };
        event.off = function(type, handler, id, context) {
            id = id || (this.getCurrentId && this.getCurrentId()) || 'empty';
            context = context || this;
            if (handlers[type]) {
                if (!handler) {
                    document.removeEventListener(type, handlers[type].callback);
                    handlers[type]['listened'] = false;
                    handlers[type]['listener'] = [];
                }else {
                    var i = 0,
                        listeners = handlers[type]['listener'],
                        isAll = handler == 'all',
                        len = listeners.length;

                    for (; i < len; i++) {
                        if (listeners[i].id == id && listeners[i].context == context && (isAll || listeners[i].callback == handler)) {
                            listeners.splice && listeners.splice(i, 1);
                            break;
                        }
                    }
                    if (listeners.length == 0 && handlers[type]['listened']) {
                        document.removeEventListener(type, handlers[type].callback);
                        handlers[type]['listened'] = false;
                    }
                }
            }else {
                console.log('??????????????????');
            }
        };

        event.once = function(type, handler, id, context) {
            this.on(type, handler, id, context, 'isonce');
        };

        return event;
    }
);

define(
    'src/hybrid/api/layer',['require','./config','./event'],function(require) {

        /**
         * @class blend.layerApi
         * @singleton
         * @private
         */
        var config = require('./config');
        var event = require('./event');
        var layer = {};
        var devPR = config.DEVICE_PR;
        var initLayerId = '0';
        var getBasePath = function(link ) {
            var a = document.createElement('a');
            a.href = link;
            return a.href;
        };

        var stringifyFilter = function(key,val){
            if(typeof val ==="function"){
                return val.toString();
            }else{
                return val;
            }
        };

        var filterOption = function(options,delKeys){
            var layerOut = ['left', 'top', 'width', 'height'];
            var _options = {};
            for(var n in options){
                if(options[n] === undefined || (delKeys&&delKeys.indexOf(n)>=0)) continue;
                _options[n] = layerOut.indexOf(n)>=0?options[n]*devPR:options[n];
            }
            return _options;
        }

        var apiFn = function(handler, args) {
            try {
                var api = window.nuwa_frame || window.lc_bridge;
                return api[handler].apply(api, args);
            }catch (e) {
                console.log('BlendUI_Api_Error:'+ handler + '======');
                console.log(e.stack);
            }
        };

        /**
         * ????????????layer
         * @method {Function} prepare

         * @param {Object} options Layer?????????
         * @param {String} options.link ??????url
         * @param {Boolean} options.pullToRefresh ????????????????????????
         * @return {String} pagerid
         * @private
         */
        layer.prepare = function(layerId, options) {
            //subLayer
            var layerOptions = filterOption(options);
            layerOptions.url = getBasePath(layerOptions.url);
            apiFn('prepareLayer', [layerId, JSON.stringify(layerOptions)]);
            return layerId;
        };

        /**
         * ???????????????layer
         * @method {Function} resume

         * @param {string} layerId ??????layerId
         * @return pagerid
         * @private
         */
        layer.resume = function(layerId, options) {
            if (layer.isActive(layerId)) return;
            var _options = {
                'fx': 'slide',
                'reverse': false,
                'duration': 'normal'
            };
            if (options) {
                options['fx'] && (_options['fx'] = options['fx']);
                options['reverse'] && (_options['reverse'] = options['reverse']);
                options['duration'] && (_options['duration'] = options['duration']);
            }
            apiFn('resumeLayer', [layerId, JSON.stringify(_options)]);

            //todo: ???????????????setTimeout
            setTimeout(function() {
                layer.canGoBack(layerId) && layer.clearHistory(layerId);
            },500);
            layer.fire('in', false, layerId);
        };

        /**
         * ???????????????layer
         * @method {Function} back
         * @return null
         */
        layer.back = function(layerId ) {
            layerId = layerId || "";
            apiFn('backToPreviousLayer', [layerId]);
        };

        /**
         * ?????????????????????layer
         * @method {Function} reload
         *
         * @return layerId
         * @private
         */
        layer.reload = function(layerId, url) {
            if (arguments.length == 1 || arguments.length == 0) {
                url = layerId;
                layerId = layer.getCurrentId();
            }
            if (!url) {
                url = layer.getCurrentUrl();
                layer.replaceUrl(layerId, url);
            }else {
                url = getBasePath(url);
                apiFn('layerLoadUrl', [layerId, url]);
            }
            return layerId;
        };

        /**
         * replace url?????????layer
         * @method {Function} reload
         *
         * @return layerId
         * @private
         */
        layer.replaceUrl = function(layerId, url) {
            layer.fire('replace', layerId, url);
            return layerId;
        };

        /**
         * ?????????????????????layer
         * @method {Function} destroy
         *
         * @return layerId
         * @private
         */
        layer.destroy = function(layerId) {
            if (!layerId) layerId = layer.getCurrentId();
            apiFn('destroyLayer', [layerId]);
            //layer.fire("layerDestroyEvent",false,layerId);
            return layerId;
        };

        /**
         * ??????????????????
         */
        layer.setPullRefresh = function(layerId,isCan,options){
            if(!layerId) layerId = layer.getCurrentId();
            options = JSON.stringify(options);
            apiFn('layerSetPullRefresh',[layerId,isCan,options]);
        }
        /**
         *
         * ??????????????????
         * @method {Function} destroy
         * @return layerId
         */
        layer.stopPullRefresh = function(layerId) {
            if (!layerId) layerId = layer.getCurrentId();
            apiFn('layerStopRefresh', [layerId]);
            return layerId;
        };

        /**
         * ??????layerId???????????????
         * @param {String} layerId
         * @return {Boolean} ????????????
         */
        //todo: ?????????????????????????????????????????????
        layer.isAvailable = function(layerId ) {
            return apiFn('isLayerAvailable', arguments);
        };

        /**
         * ?????????????????????layer id
         * @return {String} layerId
         */
        layer.getCurrentId = function() {
            return apiFn('currentLayerId', arguments);
        };

        /**
         * ???????????????url
         * @return {String} url
         */
        layer.getCurrentUrl = function() {
            return apiFn('currentLayerUrl', arguments);
        };


        /**
         * ???????????????loading??????
         * @return {String} layerId
         */
        layer.stopLoading = function(layerId) {
            layerId = layerId || layer.getCurrentId();
            return apiFn('layerStopLoading', [layerId]);
        };


        /**
         *
         * ??????layer????????????
         * @method {Function} on
         *
         * @param {String} type
         * @param {Function} handler
         * @param {String} layerId
         *
         * @return layerId
         * @private
         */
        layer.on = event.on;
        layer.once = event.once;
        /**
         *
         * ??????layer??????
         * @method {Function} off
         *
         * @param {String} type
         * @param {Function} handler
         * @param {String} layerId
         *
         * @return layerId
         * @private
         */
        layer.off = event.off;

        /**
         * ????????????
         * @method {Function} fire
         * @param {String} type ??????????????????
         * @param {Object||String} message ??????????????????????????????????????????json??????
         * @param {String} targetId ???????????????layerId,??????false????????????,????????????=="top"????????????layer??????;
         *
         * @return
         */
        layer.fire = function(type, targetId, message, callback) {
             if (!targetId) {
                targetId = '';
             }else if (targetId == 'top') {
                targetId = initLayerId;
             }
             var sender = layer.getCurrentId();
             var messData = {};
             messData.data = message || '';
             messData.target = targetId;
             messData.origin = sender;
             if (callback) {
                messData.callEvent = 'call_'+ sender + '_'+ (1 * new Date());
                var handler = function(event) {
                    callback(event['data']);
                    layer.off(messData.callEvent);
                };
                layer.on(messData.callEvent, handler);
             }

             apiFn('layerPostMessage', [sender, targetId, type, encodeURIComponent(JSON.stringify(messData,stringifyFilter))]);
        };

        /**
         * ????????????
         * @method {Function} postMessage
         *
         * @param {Object||String} message ??????????????????????????????????????????json??????
         * @param {String} targetId ???????????????layerId,??????false????????????,????????????=="top"????????????layer??????;
         *
         * @return
         */

        layer.postMessage = function(message, targetId, callback) {
             layer.fire('message', targetId, message, callback);
        };


        /**
         * ??????layer??????url
         * @return String
         */
        layer.getOriginalUrl = function(layerId) {
            if (!layerId) layerId = layer.getCurrentId();
            return apiFn('layerGetOriginalUrl', [layerId]);
        };

        /**
         * ??????layer??????url
         * @return String
         */
        layer.getUrl = function(layerId) {
            if (!layerId) layerId = layer.getCurrentId();
            return apiFn('layerGetUrl', [layerId]);
        };

        /**
         * ??????url??????????????????
         * @return Boolean
         */
        layer.canGoBack = function(layerId) {
            if (!layerId) layerId = layer.getCurrentId();
            return apiFn('layerCanGoBack', [layerId]);
        };

        /**
         * ??????url??????????????????????????????
         * @return ??????step
         */
        layer.canGoBackOrForward = function(steps, layerId) {
            if (!layerId) layerId = layer.getCurrentId();
            return apiFn('layerCanGoBackOrForward', [layerId, steps || 1]);
        };

        /**
         * ??????layer????????????????????????
         *???@return Boolean
         */
        layer.isActive = function(layerId) {
            if (!layerId) layerId = layer.getCurrentId();
            return apiFn('isLayerActive', [layerId]);
        };

        /**
         * ??????layer history??????
         * @return null
         */
        layer.clearHistory = function(layerId) {
            if (!layerId) layerId = layer.getCurrentId();
            return apiFn('layerClearHistory', [layerId]);
        };

        /**
         * ??????layer???position??????{"left","top","height","width"}
         */
        layer.setLayout = function( options ){
            var _options = filterOption(options);
            return apiFn('setLayerLayout',[JSON.stringify(_options)]);
        }

        return layer;
    }
);

define(
    'src/hybrid/api/layerGroup',['require','./config','./event','./layer'],function(require) {

        /**
         * @class blend.Api.layer
         * @singleton
         * @private
         */
        var config = require('./config');
        var event = require('./event');
        var layer = require('./layer');
        var layerGroup = {};
        var devPR = config.DEVICE_PR;
        var getBasePath = function(link ) {
            var a = document.createElement('a');
            a.href = link;
            return a.href;
        };
        var filterOption = function(options,delKeys){
            var layerOut = ['left', 'top', 'width', 'height'];
            var _options = {};
            for(var n in options){
                if(options[n] === undefined || (delKeys&&delKeys.indexOf(n)>=0)) continue;
                _options[n] = layerOut.indexOf(n)>=0?options[n]*devPR:options[n];
            }
            return _options;
        }

        // native api??????
        var apiFn = function(handler, args) {
            try {
                var api = window.nuwa_frame || window.lc_bridge;
                return api[handler].apply(api, args);
            }catch (e) {
                console.log('BlendUI_Api_Error:'+ handler + '======');
                console.log(e);
            }
        };

        /**
         * ??????runtime??????pagerGroup????????????????????? runtime??????winid
         *
         * @param {String} groupId id
         * @param {Array} layers ???????????????url???????????????Array
         * @param {Object} options pager??????
         * @return null
         * @private
         */

        layerGroup.create = function(groupId, layers, options) {
            var layerInfo = {
                id: groupId || uniqid(),
                infos: layers
            };
            layers.forEach(function(n, i) {
                n.url = getBasePath(n.url);
            });

            if (options.active) {
                layerInfo.active = options.active;
            }

            var groupOptions = filterOption(options,['active']);
            
            apiFn('addLayerGroup', [JSON.stringify(layerInfo), JSON.stringify(groupOptions)]);
            return groupId;
        };

        /**
         * ??????GroupId??????????????????layerId
         * @method {Function} showLayer
         * @return groupId
         * @private
         */
        layerGroup.showLayer = function(groupId, layerId) {
            apiFn('showLayerInGroup', arguments);
            //@todo return
            return groupId;
        };

        /**
         * ???group?????????layer
         * @private
         * @return groupId
         */
        layerGroup.addLayer = function(groupId, layerGroup) {
            apiFn('addLayerInGroup', arguments);
            //@todo return
            return groupId;
        };

        /**
         * ???group?????????layer
         * @private
         * @return groupId
         */
        layerGroup.removeLayer = function(groupId, layerId) {
            apiFn('removeLayerInGroup', arguments);
            //@todo return
            return groupId;
        };

        /**
         * ???group?????????layer
         * @private
         * @return groupId
         */
        layerGroup.updateLayer = function(groupId, layerId, layerOptions) {
            apiFn('updateLayerInGroup', arguments);
            //@todo return
            return groupId;
        };

        layerGroup.toggleScroll = function(layerId,groupId) {
            if(arguments.length==1){
               groupId =  layerId;
               layerId = layer.getCurrentId(); 
            }
            layerGroup.setScroll(layerId,groupId, !layerGroup.isScroll(layerId, groupId));
        };

        layerGroup.isScroll = function(layerId, groupId) {
            if(arguments.length==1){
               groupId =  layerId;
               layerId = layer.getCurrentId(); 
            }
            return apiFn('canLayerGroupScroll', [layerId, groupId]);
        };

        layerGroup.setScroll = function(layerId, groupId, isCan) {
            if(arguments.length==2){
                isCan = groupId;
                groupId = layerId;
                layerId = layer.getCurrentId();
            }
            setTimeout(function(){
                apiFn('setCanLayerGroupScroll', [layerId, groupId, isCan])
            },100);
        };


        //todo: layergroup????????????webview???event???

        return layerGroup;

    }
);

define(
    'src/hybrid/api/component/slider',['require','../config','../event'],function (require) {

        /**
         * @class rutime.component.slider 
         * @singleton
         * @private
         */
        var config = require('../config');
        var event = require('../event');
        var slider  = {};
        var devPR = config.DEVICE_PR;
        /*var widgetApi = function(){
            return window.nuwa_widget||window.lc_bridge;
        };*/
        // native api??????
        var apiFn = function( handler, args){
            try{
                var api = window.nuwa_widget||window.lc_bridge;
                return api[handler].apply(api,args);
            }catch(e){
                console.log("BlendUI_Api_Error:"+handler+"======")
                console.log(e);
            }
        }

        /**
         * ??????slider
         */
        slider.add = function(id, options){
            var _options = {
                "left":0,
                "top":0,
                "width":window.innerWidth*devPR,
                "height":window.innerHeight*devPR,
                "fixed":false
            };
            ['left','top','width','height','fixed'].forEach(function(n,i){
                if(options&&options[n]!=undefined){
                    _options[n] = options[n]*devPR;
                }
            });
            _options.top += window.pageYOffset*devPR;
            apiFn("addComponent",[id, 'UIBase', 'com.baidu.lightui.component.slider.Slider', JSON.stringify(_options)]);

            return slider;
        };
        
        /**
         * ??????images??????
         */
        slider.addItems = function(id, images){
            apiFn("componentExecuteNative",[id, 'addItems',  JSON.stringify(images)]);
            return slider;
        }
        /**
         * ????????????
         */
        slider.setConfig = function(id, options){
            apiFn("componentExecuteNative",[id, 'setSliderConfig',JSON.stringify(options)]);
            return slider;
        }

        /**
         * ???????????????
         */
        slider.setupIndicator = function(id, options){
            //alert(JSON.stringify(options));
            options.layoutRules=[config.CENTER_HORIZONTAL, config.ALIGN_PARENT_BOTTOM];
            options.verticalMargin= Math.round((options.verticalMargin||5) * devPR);
            options.unitSize=Math.round((options.unitSize||10) * devPR);
            options.unitSpace=Math.round((options.unitSpace||5) * devPR);
            apiFn("componentExecuteNative",[id, 'setupIndicator',JSON.stringify(options)]);
            return slider;
        }

        /**
         * next
         */
        slider.next = function(id){
            apiFn("componentExecuteNative",[id, 'next']);
            return slider;
        }

        /**
         * prev
         */
        slider.prev = function(id){
            apiFn("componentExecuteNative",[id, 'prev']);
            return slider;
        };

        /**
         * slider to
         */
        slider.slideTo = function(id, index,hasAnim){
            apiFn("componentExecuteNative",[id, 'slideTo', JSON.stringify({
                index:index,
                isAnim:!!hasAnim
            })]);
            return slider;
        };
        
        
        /**
         *
         * ??????layer????????????
         * @method {Function} on
         *
         * @param {String} type
         * @param {Function} handler
         * @param {String} layerId
         *
         * @returns layerId
         * @private
         */
        slider.on = event.on;
        
        /**
         *
         * ????????????
         * @method {Function} off
         *
         * @param {String} type
         * @param {Function} handler
         * @param {String} layerId
         *
         * @returns layerId
         * @private
         */
        slider.off = event.off;
        
        /**
         * ????????????
         */
        slider.remove = function(id){
            apiFn("removeComponent",[id, 'UIBase']);
        }
        return slider;
    }
);
define(
    'src/hybrid/api/component',['require','./component/slider'],function(require) {

        var comp = {};

        //???????????????
        comp.slider = require('./component/slider');

        return comp;
    }
);

define(
    'src/hybrid/runtime',['require','./api/core','./api/layer','./api/layerGroup','./api/component'],function(require) {

        /**
         * @class runtime
         * @private
         * @singleton
         */

        var runtime = {};

        var core = require('./api/core');
        var layer = require('./api/layer');
        var layerGroup = require('./api/layerGroup');
        var component = require('./api/component');

        runtime.core = core;
        runtime.layer = layer;
        runtime.layerGroup = layerGroup;
        runtime.component = component;

        return runtime;

    }

);

define(
    'src/hybrid/blend',['require','../common/lib','./runtime'],function(require) {
        var lib = require('../common/lib');
        var runtime = require('./runtime');

        /**
         * @class blend
         * @singleton
         */
        var blend = {};
        var controls = {};
        var isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);

        //??????android?????????????????????runtimeready
        document.addEventListener('runtimeready', function() {
           blend.readyState = true;
        },false);

        /**
         * ????????????
         *
         * @property {String} version info
         */
        blend.version = '0.1';

        /**
         * ?????????Api??????entend???blend???
         *
         * @property {Object} Api??????
         */
        blend.api = {};

        /**
         * ????????????????????????
         *
         * @param {Control} control ????????????
         * @return null
         */
        blend.register = function(control) {
            controls[control.id] = control;
        };

        //ADDED CURRENTID
        blend.currentLayerId = runtime.layer.getCurrentId();
        // var delegateLayer = require("./delegateLayer.js");

        /**
         * ????????????
         *
         * @param {Control} control ????????????
         * @return null
         */
        blend.cancel = function(control) {
            //console.log("reg: " + control.id);
            delete controls[control.id];
        };

        /**
         * ??????id????????????
         *
         * @param {string} id ??????id
         * @return {Control}
         */
        blend.get = function(id) {
            return controls[id];
        };

        /**
         * runtime ready??????
         * @param {function} ????????????
         */
        blend.ready = function(callback) {
            var handler = function() {
                outTimeFun && clearTimeout(outTimeFun);
                if (/complete|loaded|interactive/.test(document.readyState)) {
                    callback(blend);
                }else{
                    document.addEventListener('DOMContentLoaded', function() {
                        callback(blend);
                    }, false);
                }
                document.removeEventListener('runtimeready', handler);
            };
            if (blend.readyState || window.nuwa_runtime||window.lc_bridge) {
                handler();
            }else {
                var outTimeFun = setTimeout(handler, 3000);
                document.addEventListener('runtimeready', handler, false);
            }
        };

        /**
         * runtime layer??????
         * @todo remove
         * @property {Object}
         */
        blend.api.layer = runtime.layer;

        /**
         * runtime layerGroup??????
         * @todo remove
         * @property {Object} layerGroup
         */
        blend.api.layerGroup = runtime.layerGroup;

        /**
         * runtime core??????
         * @todo remove
         * @property {Object} core
         */
        blend.api.core = runtime.core;

        //???layer????????????????????????blend???????????????

        ['on','off','fire','once','postMessage'].forEach(function(n,i){
            blend[n] = function(){
                runtime.layer[n].apply(runtime.layer,arguments);
            }
        });

        //???coreapi???layer??????????????????????????????????????????blend.api;
        lib.extend(blend,runtime.core);
        lib.extend(blend,{
            "layerStopRefresh":runtime.layer.stopPullRefresh,
            "layerBack":runtime.layer.back,
            "layerStopLoading":runtime.layer.stopLoading,
            "getLayerId":runtime.layer.getCurrentId,
            "layerSetPullRefresh":runtime.layer.setPullRefresh
        });

        //????????????
        var mainCall = {};
        blend.start = blend.layerInit = function(id,callback){
            mainCall[id] = callback;
        }

        blend._lanch = function(id,dom){
            
            mainCall[id]&&mainCall[id].call(blend, dom);
        }

        //unload???????????????????????????;
        window.addEventListener("unload",function(e){
            for(var i in controls){
                controls[i].destroy&&controls[i].destroy();
            }
        });
        
        return blend;
    }
);

define(

    /**
     * @class Control
     * @inheritable
     */

    'src/hybrid/Control',['require','../common/lib','./blend','./runtime'],function(require) {
        var lib = require('../common/lib');
        var blend = require('./blend');
        var runtime = require('./runtime');
        var isRuntimeEnv = true;//main.inRuntime();//runtime.isRuntimeEnv&&runtime.isRuntimeEnv();

        function Control(options) {
            options = options || {};

            if (!this.id && !options.id) {
                this.id = lib.getUniqueID() + (1 * new Date);
            }
            this.main = options.main ? options.main : this.initMain(options);

            this.initOptions(options);

            blend.register(this);

            this.currentStates = {};
            this._listener = {};


            //this.fire('init');
        }

        Control.prototype = {
            constructor: Control,
            // nativeObj: {},
            currentStates: null,
            /**
             * ??????????????????
             * @private
             * @property {Object} _listener
             */
            _listener: null,


            /**
             * ???????????????
             *
             * @cfg {String} type
             */
            //type : "layerGroup",

            /**
             * ?????????id
             *
             * @cfg {String} id
             */
            //id : "layerGroup",

            /**
             * ???????????????????????????
             */
            getType: function() {
                //layout, layer, component, navbar
                return this.type || 'control';
            },

            /**
             * @protected
             * ???????????????options
             */
            initOptions: function(options) {
                options = options || {};
                this.setProperties(options);
            },


            /**
             * ?????????Main???????????????
             * @return {Object} DOM
             */
            initMain: function() {
                var main = document.createElement('div');
                main.setAttribute('data-blend', this.getType());
                main.setAttribute('data-blend-id', this.id);
                //console.log(main.outerHTML);

                return main;
            },

            /**
             * ??????Control????????????DOM????????????Native????????????????????????????????????????????????????????????paint??????
             */
            render: function() {
                //created, webviewready, pageonload, disposed
                this.fire('beforerender');

                // ????????????????????????id
                if (!this.main.id) {
                    this.main.id = lib.getUniqueID();
                }

                //?????????????????????
                if (this.paint()) {
                    this.fire('afterrender');
                }else {
                    this.fire('renderfailed');
                }
                return this.main;
            },


            paint: function() {

            },

            appendTo: function(DOM) {
                this.main.appendChild(DOM);
            },

            insertBefore: function(DOMorControl) {
                this.main.parentNode.insertBefore(DOMorControl, this.main);
            },

            /**
             * ????????????dom???????????????????????????????????????????????????
             */
            dispose: function() {
                this.fire('beforedistory');
                try {
                    if (isRuntimeEnv) {
                        runtime[this.type].destroy(this.id);
                    }else {
                        //TODO
                    }
                }catch (e) {

                }
                this.fire('afterdistory');
            },

            /**
             * ????????????DOM Events
             */
            clearDOMEvents: function() {

            },

            /**
             * ????????????
             */
            destroy: function() {
                this.dispose();
                blend.cancel(this);
            },
            /**
             *
             * ????????????
             * @param {string} name ?????????
             */
            get: function(name) {
                var method = this['get' + lib.toPascal(name)];

                if (typeof method == 'function') {
                    return method.call(this);
                }

                return this[name];
            },
            /**
             * ????????????????????????
             *
             * @param {string} name ?????????
             * @param {Mixed} value ?????????
             */
            set: function(name, value) {
                var method = this['set' + lib.toPascal(name)];

                if (typeof method == 'function') {
                    return method.call(this, value);
                }

                var property = {};
                property[name] = value;
                this.setProperties(property);
            },

            /**
             * ????????????
             */
            setProperties: function(properties) {
                //todo: ??????????????????????????????????????????????????????????????????runtime
                lib.extend(this, properties);
            },

            /**
             * ????????????
             */
            disable: function() {
                this.addState('disabled');
            },

            /**
             * ????????????
             */
            enable: function() {
                this.removeState('disabled');
            },

            /**
             * ???????????????????????????
             */
            isDisabled: function() {
                return this.hasState('disabled');
            },

            /**
             * ????????????
             */
            in : function() {
                this.removeState('hidden');
                this.fire('show');
            },

            /**
             * ????????????
             */
            out: function() {
                this.addState('hidden');
                this.fire('hide');
            },

            /**
             * ???????????????????????????
             */
            toggle: function() {
                this[this.isHidden() ? 'in' : 'out']();
            },
            /**
             * ????????????????????????
             */
            isHidden: function() {
                return this.hasState('hidden');
            },

            /**
             * ?????????????????????
             *
             * @param {string} state ?????????
             */
            addState: function(state) {
                if (!this.hasState(state)) {
                    this.currentStates[state] = true;
                }
            },
            /**
             * ?????????????????????
             *
             * @param {String} state ?????????
             */
            removeState: function(state) {
                if (this.hasState(state)) {
                    this.currentStates[state] = false;
                }
            },
            /**
             * ?????????????????????
             * @param {String} state ?????????
             */
            toggleState: function(state) {
                var methodName = this.hasState(state)
                    ? 'removeState'
                    : 'addState';

                this[methodName](state);
            },

            /**
             * ???????????????????????????????????????
             * @param {String} state ?????????
             * @return Boolean
             */
            hasState: function(state) {
                return !!this.currentStates[state];
            },

            /**
             * ????????????
             * @param {string} type ????????????
             * @param {Function} callback ?????????????????????
             */
            on: function(type, callback) {
                var t = this;
                if (!t._listener[type]) {
                    t._listener[type] = [];
                }
                t._listener[type].push(callback);
            },
            /**
             * ????????????
             * @param {string} type ????????????
             * @param {Function} callback ?????????????????????
             */
            off: function(type, callback) {
                var events = this._listener[type];
                if (!events) {
                    return;
                }
                if (!callback) {
                    delete this._listener[type];
                    return;
                }
                events.splice(types.indexOf(callback), 1);
                if (!events.length) {
                    delete this._listener[type];
                }
            },
            /**
             * ????????????
             * @param {string} type ????????????
             * @param {Array} argAry ?????????????????????
             * @param {Object} context ?????????this??????
             */
            fire: function(type, argAry, context) {
                if (!type) {
                    throw new Error('??????????????????');
                }
                var events = this._listener[type];

                context = context || this;

                if (events) {
                    for (var i = 0, len = events.length; i < len; i++) {
                        events[i].apply(context, argAry);
                    }
                }
                return event;
            }
        };


        return Control;
    }
);

/**
 * Layer??????????????????web????????????????????????????????????????????????????????????????????????
 * @class Layer
 * @extends Control
 * @static
 * @inheritable
 */
define('src/hybrid/Layer',['require','./blend','../common/lib','./runtime','./Control'],function(require) {

    var blend = require('./blend');
    var lib = require('../common/lib');
    var runtime = require('./runtime');
    var Control = require('./Control');
    //?????????runtime????????????
    var isRuntimeEnv = true;//main.inRuntime();//runtime.isRuntimeEnv&&runtime.isRuntimeEnv();
    var layerApi = runtime.layer;
    var __time = 0;
    var getBasePath = function( link ){
        var a = document.createElement("a");
        a.href=link;
        return a.href;
    };

    blend.ready(function() {
        //layer????????????
        try {

            //??????runtime???????????????runtime?????? ????????????????????????
            //window.nuwa_runtime && nuwa_runtime.removeSplashScreen();

            layerApi.on('in', function(event) {
                var layer = blend.get(event['data']);
                if (layer && layer.onshow) {
                    layer.onshow();
                }
            });

            layerApi.on('replace', function(event) {
                var url = event['data'];
                location.replace(url);
            });
        }catch (e) {
            console.log(e.message);
        }
    });

    /**
     * @constructor
     *
     * Layer ???????????????;
     * @param {Object} options ???????????????layer??????????????????
     *
     * @param {String} options.url ??????url
     * @param {String} [options.id] layer??????id
     * @param {String} [options.top=0] layer????????????top?????????
     * @param {String} [options.left=0] layer????????????left?????????
     * @param {String} [options.width] layer???????????????????????????
     * @param {String} [options.height] layer???????????????????????????
     * @param {boolean} [options.active] ??????????????????
     *
     * @param {boolean} [options.reverse] =true ??????????????????
     * @param {String} [options.fx] ="none" ?????????
     * @param {String} [options.fx] ="slide" ???????????????????????????????????????
     * @param {String} [options.fx] ="pop" ??????
     * @param {String} [options.fx] ="fade" ???????????????
     * @param {number} [options.duration] ??????????????????s
     * @param {String} [options.timingFn] ?????????????????????@todo
     * @param {String} [options.cover] ??????????????????????????????????????????@todo

     *
     * @param {Function} [options.afterrender] webview??????render???????????????
     * @param {Function} [options.onload] webview??????onload?????????
     * @param {Function} [options.changeUrl] webview url???????????????
     *
     * @param {Function} [options.onshow] layer??????????????????????????????
     * @param {Function} [options.onhide] layer??????????????????????????????
     *
     * @param {boolean} options.pullToRefresh ????????????????????????
     * @param {Array|String} options.ptrIcon ???????????????????????????????????????Array?????????0???1???2?????????????????????????????????????????????????????????????????????????????????@todo
     * @param {Array|String} options.ptrText ???????????????????????????????????????Array?????????0???1???2?????????????????????????????????????????????????????????????????????????????????@todo
     * @param {String} options.ptrColor ????????????@todo
     * @param {Function} options.ptrFn ?????????????????? //todo??? ??????ptrCallback??????

     * @return this
     */
    var Layer = function(options) {
        options = options||{};
        if(options.url) options.url= getBasePath(options.url);
        Control.call(this, options);
        console.info('Time createLayer:'+ (__time = +new Date));
        this._init(options);
        return this;
    };

    //??????control???;
    lib.inherits(Layer, Control);

    Layer.prototype.constructor = Layer;

    /**
     * @private
     * ???????????????,??????????????????????????????????????????, ????????????;
     * @param {Object} options ??????layer??????????????????
     */
    Layer.prototype._init = function(options) {
        //??????options???;
        if (options.url) {
            this.originalUrl = options.url;
        }
        //????????????
        this._initEvent();

        this.render();

        options.active && this.in();

        return this;
    };

    //????????????
    Layer.prototype.type = 'layer';


    /**
     * loading?????????????????????
     *
     * @cfg {Number} loadingTime ??????ms;
     */
    Layer.prototype.maxLoadingTime = 800;


    /**
     * @cfg {Boolean} autoStopLoading ??????????????????loading;
     */
    Layer.prototype.autoStopLoading = true;

    /**
     * @private
     * ???????????????
     * @return this
     */
    Layer.prototype._initEvent = function() {
        var me = this;
        var cancelTime = null;
        /*var clearTime = function(){
            cancelTime&&clearTimeout(cancelTime);
        }*/
        //???????????????????????????????????????document????????????
        if (me.ptrFn) {
            layerApi.on('layerPullDown', function(event) {
                me.ptrFn.apply(me, arguments);
            },me.id, me);
        }
        layerApi.on('layerCreateSuccess', function(event) {
            if (me.autoStopLoading) {
                cancelTime = setTimeout(function() {
                    me.stopLoading();
                },me.maxLoadingTime);
            }
            
            blend.ready(function(e){
                me.pullToRefresh && layerApi.setPullRefresh(me.id, true,{
                    "pullText": me.pullText,
                    "loadingText": me.loadingText,
                    "releaseText":me.releaseText,
                    "pullIcon": me.pullIcon
                });
            });

            console.info('Time layerCreateSuccess:'+ (new Date - __time));
            me.afterrender && me.afterrender.apply(me, arguments);
        },me.id, me);
        layerApi.on('layerLoadFinish', function(event) {
            if (!me.autoStopLoading) {
                cancelTime = setTimeout(function() {
                    me.stopLoading();
                },me.maxLoadingTime);
            }
            
            me.autoStopLoading && me.stopLoading();
            if (event['url'] !== me.url) {
                me.autoStopLoading && me.stopLoading();
                me.url = event['url'];
                me.changeUrl && me.changeUrl.call(me, event, me.url);
            }
            console.info('Time layerLoadFinish:'+ (new Date - __time));
            me.onload && me.onload.apply(me, arguments);
        },me.id, me);

        layerApi.on('layerPoped', function(event) {
            me.onhide && me.onhide.apply(me, arguments);
            layerApi.fire('out', false, me.id);
        },me.id, me);

        //????????????????????????
        me.on('afterdistory', function() {
            clearTimeout(cancelTime);
            me.ptrFn && layerApi.off('layerPullDown', 'all', me.id, me);
            layerApi.off('layerCreateSuccess', 'all', me.id, me);
            layerApi.off('layerLoadFinish', 'all', me.id, me);
            layerApi.off('layerPoped', 'all', me.id, me);
        });
        return me;
    };

    /**
     * ??????????????????
     * @return {Object} this ????????????
     */
    Layer.prototype.paint = function() {
        var me = this;
        if (isRuntimeEnv) {
            layerApi.prepare(me.id, {
                url: me.url,
                top: me.top,
                left: me.left,
                bottom: me.bottom,
                right: me.right,
                pullToRefresh: me.pullToRefresh,
                loadingIcon:me.loadingIcon,
                "pullText": me.pullText,
                "loadingText": me.loadingText,
                "releaseText":me.releaseText,
                "pullIcon": me.pullIcon,
                "position":me.position
            });
        }
        return this;
    };

    /**
     * ????????????
     * @return {Object} this ????????????
     */
    Layer.prototype.in = function() {
        var me = this;
        //????????????layer??????????????????
        if (!layerApi.isAvailable(this.id)) {
            me.render();
        }
        Control.prototype.in.apply(me, arguments);
        layerApi.resume(me.id, {
            reverse: me.reverse,
            fx: me.fx,
            duration: me.duration,
            timingFn: me.timingFn
        });

        return this;
    };


    /**
     * ??????layer????????????????????????Layer
     * @return {Object} this ????????????
     */
    Layer.prototype.out = function( toLayerId ) {
        Control.prototype.out.apply(this, arguments);
        layerApi.back(toLayerId);
        return this;
    };

    /**
     * ??????????????????
     *
     * @param {String} url ????????????????????????url
     * @return {Object} this ????????????
     */
    Layer.prototype.reload = function(url) {
        if(url){
            url = getBasePath(url);
            if(url!==this.url){
                layerApi.reload(this.id,url);
            }
        }
        return this;
    };

    /**
     * url ??????
     *
     * @param {String} url ????????????????????????url
     * @return {Object} this ????????????
     */
    Layer.prototype.replace = function(url) {
        url = url? getBasePath(url):this.url;
        layerApi.replaceUrl(this.id, url);
        return this;
    };

    /**
     * ??????layer??????????????????
     *
     * @return {Object} this ????????????
     */
    Layer.prototype.stopPullRefresh = function() {
        layerApi.stopPullRefresh(this.id);
        return this;
    };

    /**
     * ??????loading??????
     * @return {Object} this ????????????
     */
    Layer.prototype.stopLoading = function() {
        //this.fire("_initEvent");
        layerApi.stopLoading(this.id);
        return this;
    };

    /**
     * ??????layer?????????url
     * @return {Object} this ????????????
     */
    Layer.prototype.getUrl = function() {
        return layerApi.getUrl(this.id);
    };

    /**
     * ??????layer????????????history go
     * @return {Boolean} canGoBack ??????????????????
     */
    Layer.prototype.canGoBack = function() {
        return layerApi.canGoBack(this.id);
    };

    /**
     * ??????history??????
     * @return {Boolean}
     */
    Layer.prototype.clearHistory = function() {
        layerApi.clearHistory(this.id);
        return this;
    };

    /**
     * layer?????????????????????
     * @return {Boolean}
     */
    Layer.prototype.isActive = function() {
        return layerApi.isActive(this.id);
    };


    /**
     * ?????????layer
     * @return {Object} this ????????????
     */
    Layer.prototype.destroy = function() {
        //this.fire("_initEvent");
        Control.prototype.destroy.apply(this, arguments);
        return this;
    };


    return Layer;
});

/**
 * LayerGruop??????????????????Layer???????????????????????????????????????????????????????????????????????????Layer?????????????????????
 * @class Layer
 * @extends Control
 * @static
 * @inheritable
 */
define('src/hybrid/LayerGroup',['require','./blend','../common/lib','./runtime','./Control'],function(require) {

    var blend = require('./blend');
    var lib = require('../common/lib');
    var runtime = require('./runtime');
    var Control = require('./Control');
    //?????????runtime????????????
    var isRuntimeEnv = true;//main.inRuntime();//runtime.isRuntimeEnv&&runtime.isRuntimeEnv();
    var layerGroupApi = runtime.layerGroup;
    var layerApi = runtime.layer;
    var layerId = layerApi.getCurrentId();
    /**
     * @constructor;
     *
     * LayerGroup???????????????;
     * @extends Control
     *
     * @param {Object} options ???????????????layer??????????????????
     * @param {Array} options.layers LayerGroup??????Layer??????options
     * @param {String} options.layers.url layer???link
     * @param {Boolean} [options.layers.active=false] layer????????????
     * @param {Boolean} [options.layers.autoload=false] ??????????????????
     * @param {String} [options.layers.id] layer???id
     * @param {Function} [options.layers.beforerender] webview??????render??????????????????
     * @param {Function} [options.layers.afterrender] webview??????render???????????????
     * @param {Function} [options.layers.renderfail] webview??????render???????????????
     * @param {Function} [options.layers.onload] webview??????onload?????????
     * @param {Function} [options.layers.onshow] layer??????????????????????????????
     * @param {Function} [options.layers.onhide] layer??????????????????????????????
     *
     * @param {boolean} [options.layers.pullToRefresh] ????????????????????????
     * @param {Array|String} [options.layers.ptrIcon] ???????????????????????????????????????Array?????????0???1???2?????????????????????????????????????????????????????????????????????????????????
     * @param {Array|String} [options.layers.ptrText] ???????????????????????????????????????Array?????????0???1???2?????????????????????????????????????????????????????????????????????????????????
     * @param {String} [options.layers.ptrColor] ????????????
     * @param {Function} [options.layers.ptrOnsuccess] ??????????????????
     * @param {Function} [options.layers.ptrOnfail] ??????????????????
     *
     * @param {string} [options.id] layerGroup??????id
     * @param {string} [options.top=0] layerGroup????????????top?????????
     * @param {string} [options.left=0] layerGroup????????????left?????????
     * @param {string} [options.width] layer???????????????????????????
     * @param {string} [options.height] layer???????????????????????????
    
     * @return this
     */
    var LayerGroup = function(options) {
        /*if(!(this instanceof LayerGroup)){
            return new LayerGroup(options);
        }*/
        Control.call(this, options);
        this._init(options);
    };

    //?????????control
    lib.inherits(LayerGroup, Control);

    LayerGroup.prototype.constructor = LayerGroup;


    /**
     * layerGroup?????????layer id???
     *
     * @cfg {String} layerId
     */

    LayerGroup.prototype.layerId =  layerId;

    /**
     * ???????????????
     *
     * @cfg {String} type
     */

    LayerGroup.prototype.type = 'layerGroup';

    /**
     * layerGroup????????????????????????
     *
     * @cfg {boolean} scrollEnabled
     */

    LayerGroup.prototype.scrollEnabled = true;
    /**
     * @private
     * ???????????????, ????????????;
     * @param {Object} options ??????group??????????????????,
     * @return this
     */
    LayerGroup.prototype._init = function(options) {
        var me = this;
        var layers = {};
        var activeId = null;
        //?????????layers???object
        if (!me.layers || !me.layers.length) {
            return;
        }

        for (var i = 0, len = me.layers.length; i < len; i++) {
            if (!me.layers[i].id) {
                me.layers[i].id = lib.getUniqueID();
            }
            if (me.layers[i].active) {
                activeId = me.layers[i].id;
            }
            layers[me.layers[i].id] = me.layers[i];
        }

        me._layers = layers;

        me.activeId = activeId || me.layers[0].id;


        /* alert(me.get('activeId')); */

        //????????????
        me._initEvent();

        me.render();

        //todo;
        return this;
    };

    /**
     * @private
     * ???????????????
     * @return this
     */
    LayerGroup.prototype._initEvent = function() {
        var me = this;
        var layersLen = me.layers.length;
        var selectedFn = function(event) {
           console.info('group selected:'+ event['groupId']);
            if (event['groupId'] == me.id) {
                if(me['activeId']==me.layers['0'].id&&event['layerId']==me.layers['0'].id) return;
                if(me['activeId']==me.layers[layersLen-1].id&&event['layerId']==me.layers[layersLen-1].id) return;
                event['detail'] = event['layerId'];
                me.onshow && me.onshow.call(me, event);
                me.onselected && me.onselected.call(me, event);
                if (me._layers[event['layerId']].onshow) {
                    me._layers[event['layerId']].onshow.call(me);
                }
                if (me['activeId'] !== event['layerId'] && me._layers[me['activeId']].onhide) {
                    me._layers[me['activeId']].onhide.call(me);
                }
                me.activeId = event['layerId'];
            }
        };
        //????????????????????????
        /*var scrollFn = function() {
            var oTime = +new Date();
            var _op = 0;
            return function(event) {
               console.info('group scroll:'+ event['groupId']);
               console.info('group scroll:'+ event['groupPixelOffset']);
               console.info('group scroll:'+ event['layerId']);
               console.info('group scroll:'+ event['groupPercentOffset']);
               var nTime = +new Date();
               var _stop = (event['groupPercentOffset'] == 0 || event['groupPercentOffset'] == 1);
               if (_stop || (nTime - oTime) < 100) {
                    return;
               }
               oTime = nTime;

               var _swipe = event['groupPixelOffset'] - _op > 0 ? 'left': 'right';
               var _dir = event['layerId'] == me.activeId ? 'left': 'right';
               _op = event['groupPixelOffset'];
               event['swipe'] = _stop ? 'stop': _swipe;
               event['dir'] = _stop ? 'stop': _dir;
               if (event['groupId'] == me.id) {
                   me.onscroll && me.onscroll.call(me, event);
               }
            }
        };*/

        document.addEventListener('groupSelected', selectedFn, false);
        //document.addEventListener('groupScrolled', scrollFn(), false);
        document.addEventListener('layerLoadFinish', function(e){
            var _layer = me._layers[e.origin];
            if(_layer&&_layer.onload){
               _layer.onload&&_laye.onload.call(me);
            }
            if(_layer&&_layer.pullToRefresh){
                layerApi.setPullRefresh(_layer.id, true,{
                    "pullText": _layer.pullText,
                    "loadingText": _layer.loadingText,
                    "releaseText":_layer.releaseText,
                    "pullIcon": _layer.pullIcon,
                    "pullBgColor":_layer.pullBgColor
                })
            }
            _layer.state = "loaded";
        }, false);
        return null;
        /*document.addEventListener('groupStateChanged', function(event) {
            console.log('groupStateChanged ' + event['groupId'] + '  ' + event['layerId'] + '  ' + event['groupState']);
        }, false);*/
    };

    /**
     * ??????layer??????
     */
    LayerGroup.prototype.getLayerValueById = function(layerId){
        return this._layer[layerId];
    }

    /**
     * ??????????????????
     * @return this
     */
    LayerGroup.prototype.paint = function() {
        var me = this;
        if (isRuntimeEnv) {
            var options = {
                left: me.left,
                top: me.top,
                width: me.width,
                height: me.height,
                scrollEnabled: me.scrollEnabled,
                active: me.activeId
            };
            layerGroupApi.create(me.id, me.layers, options);
        }
        return this;
    };

    /**
     * ????????????layer
     *
     * @param {String} layerId layer id
     * @return this
     */
    LayerGroup.prototype.active = function(layerId ) {
        layerGroupApi.showLayer(this.id, layerId);
        return this;
    };

    /**
     * ??????layer
     * @param {string} layerId group???layer id
     * @return this
     */
    LayerGroup.prototype.remove = function(layerId ) {
        layerGroupApi.removeLayer(this.id, layerId);
        delete this._layers[layerId];
        return this;
    };

    /**
     * ??????layer
     * @param {Object} layerOptions layer Options
     * @param {Number} [index=last] ????????????index???????????????
     * @return {Layer}
     */
    LayerGroup.prototype.add = function(layerOptions, index ) {

        if (!layerOptions.id) {
            layerOptions.id = lib.getUniqueID();
        }

        layerGroupApi.addLayer(this.id, layerOptions, index);

        this._layers[layerOptions.id] = layerOptions;

        return this;
    };

    /**
     * ??????layer url
     * @param {Object} layer Options
     * @param {Number} [index=last] ????????????index???????????????
     * @return {Layer}
     */
    LayerGroup.prototype.update = function(layerId, layerOptions) {

        layerGroupApi.updateLayer(this.id, layerId, layerOptions);

        lib.extend(this._layers[layerOptions.id], layerOptions);
        return this;
    };

    /**
     * ?????????layerGroup
     * @return this
     */
    LayerGroup.prototype.destroy = function() {
        Control.prototype.destroy.apply(this, arguments);
    };

    LayerGroup.prototype.isScroll = function() {
        return layerGroupApi.isScroll(this.layerId, this.id);
    };

    LayerGroup.prototype.setScroll = function(isCan) {
        layerGroupApi.setScroll(this.layerId, this.id, isCan);
    };

    LayerGroup.prototype.toggleScroll = function() {
        layerGroupApi.toggleScroll(this.layerId, this.id);
    };


    return LayerGroup;
});

/**
 * Layer??????????????????web????????????????????????????????????????????????????????????????????????
 * @class Layer
 * @extends Control
 * @static
 * @inheritable
 */
define('src/hybrid/Slider',['require','./blend','../common/lib','./runtime','./Control'],function(require) {

    var blend = require('./blend');
    var lib = require('../common/lib');
    var runtime = require('./runtime');
    var Control = require('./Control');
    //?????????runtime????????????
    var isRuntimeEnv = true;//main.inRuntime();//runtime.isRuntimeEnv&&runtime.isRuntimeEnv();
    var sliderApi = runtime.component.slider;


    /**
     * @constructor
     *
     * Slider ???????????????;
     * @param {Object} options ???????????????slider??????????????????
     *
     * @param {String} [options.id] slider??????id
     * @param {String} [options.top=0] slider????????????top?????????
     * @param {String} [options.left=0] slider????????????left?????????
     * @param {String} [options.width] slider???????????????????????????
     * @param {String} [options.height] slider???????????????????????????
     * @param {String} [options.bgColor] ???????????????????????????

     * @param {Obeject} [options.images] ??????json?????? {}

     * @param {Function} [options.tap] ??????slider???????????????
     * @param {Function} [options.slide] ??????slide???????????????


     * @return this
     */
    var Slider = function(options) {
        Control.call(this, options);
        this._init(options);
        return this;
    };

    //??????control???;
    lib.inherits(Slider, Control);

    Slider.prototype.constructor = Slider;

    /**
     * @private
     * ???????????????,??????????????????????????????????????????, ????????????;
     * @param {Object} options ??????layer??????????????????
     */
    Slider.prototype._init = function(options) {

        this._initEvent();

        this.render();

        return this;
    };

    //????????????
    Slider.prototype.type = 'slider';

    /**
     * @private
     * ???????????????
     * @return this
     */
    Slider.prototype._initEvent = function() {
        var me = this;

        sliderApi.on('tap', function(event) {
            me.tap && me.tap.apply(me, arguments);
            me.fire('tap', arguments, me);
        },me.id, me);

        sliderApi.on('slide', function(event) {
            me.slide && me.slide.apply(me, arguments);
            me.fire('slide', arguments, me);
        },me.id, me);

        //????????????????????????
        me.on('afterdistory', function() {
            sliderApi.off('tap', 'all', me.id, me);
            sliderApi.off('slide', 'all', me.id, me);
        });

        window.addEventListener('unload', function(e) {
            me.destroy();
        });

        return me;
    };

    /**
     * ??????????????????
     * @return this ????????????
     */
    Slider.prototype.paint = function() {
        var me = this;
        if (isRuntimeEnv) {
            sliderApi.add(me.id, {
                top: me.top,
                left: me.left,
                width: me.width,
                height: me.height,
                fixed: me.fixed
            });

            sliderApi.addItems(me.id, {
                images: me.images
            });

            if (me.bgColor) {
               //@todo ????????????
                sliderApi.setConfig(me.id, {
                    backgroundColor: me.bgColor
                });
            }

            //?????????????????????
            if (me.hasIndicator) {
                sliderApi.setupIndicator(me.id, {
                    activeColor: me.activeColor,
                    inactiveColor: me.inactiveColor,
                    unitSize: me.unitSize,
                    unitSpace: me.unitSpace,
                    verticalMargin: me.verticalMargin
                });
            }
        }
        return this;
    };

    //prev
    Slider.prototype.prev = function() {
        sliderApi.prev(me.id);
    };

    //next
    Slider.prototype.next = function() {
        sliderApi.next(me.id);
    };

    //to
    Slider.prototype.slideTo = function(index) {
        sliderApi.slideTo(this.id, index, true);
    };

    /**
     * ??????
     * @return this
     */
    Slider.prototype.destroy = function() {
        sliderApi.remove(this.id);
        Control.prototype.destroy.apply(this, arguments);
    };

    return Slider;
});

require(['src/hybrid/blend', 'src/hybrid/Layer', 'src/hybrid/LayerGroup', 'src/hybrid/Slider'], function(blend, Layer, LayerGroup, Slider) {
    blend = blend||{};
    blend.Layer = Layer;
    blend.LayerGroup = LayerGroup;
    blend.Slider = Slider;

    window.Blend = window.Blend || {};
    window.Blend.ui = blend;
    console && console.log('====BlendUI Ok======');
    
    //?????????blendready??????
    var _event = null;
    if (window.CustomEvent) {
        _event = new CustomEvent('blendready', {
            bubbles: false,
            cancelable: false
        });
    }else {
        _event = document.createEvent('Event');
        _event.initEvent('blendready', false, false);
    }
    blend.ready(function() {
        document.dispatchEvent(_event);
        blend._lanch(blend.getLayerId(),document.querySelector("body"));
    });
    //todo ready????????????
},null, true);


define("src/hybrid/main", function(){});
}());