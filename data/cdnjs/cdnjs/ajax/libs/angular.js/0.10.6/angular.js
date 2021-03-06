/**
 * @license AngularJS v0.10.6
 * (c) 2010-2012 AngularJS http://angularjs.org
 * License: MIT
 */
'use strict';
(function(window, document, undefined){

////////////////////////////////////

if (typeof document.getAttribute == $undefined)
  document.getAttribute = function() {};

/**
 * @ngdoc function
 * @name angular.lowercase
 * @function
 *
 * @description Converts the specified string to lowercase.
 * @param {string} string String to be converted to lowercase.
 * @returns {string} Lowercased string.
 */
var lowercase = function(string){return isString(string) ? string.toLowerCase() : string;};


/**
 * @ngdoc function
 * @name angular.uppercase
 * @function
 *
 * @description Converts the specified string to uppercase.
 * @param {string} string String to be converted to uppercase.
 * @returns {string} Uppercased string.
 */
var uppercase = function(string){return isString(string) ? string.toUpperCase() : string;};


var manualLowercase = function(s) {
  return isString(s)
      ? s.replace(/[A-Z]/g, function(ch) {return fromCharCode(ch.charCodeAt(0) | 32);})
      : s;
};
var manualUppercase = function(s) {
  return isString(s)
      ? s.replace(/[a-z]/g, function(ch) {return fromCharCode(ch.charCodeAt(0) & ~32);})
      : s;
};


// String#toLowerCase and String#toUpperCase don't produce correct results in browsers with Turkish
// locale, for this reason we need to detect this case and redefine lowercase/uppercase methods
// with correct but slower alternatives.
if ('i' !== 'I'.toLowerCase()) {
  lowercase = manualLowercase;
  uppercase = manualUppercase;
}

function fromCharCode(code) {return String.fromCharCode(code);}

/**
 * Creates the element for IE8 and below to allow styling of widgets
 * (http://ejohn.org/blog/html5-shiv/). This hack works only if angular is
 * included synchronously at the top of the document before IE sees any
 * unknown elements. See regression/issue-584.html.
 *
 * @param {string} elementName Name of the widget.
 * @returns {string} Lowercased string.
 */
function shivForIE(elementName) {
  elementName = lowercase(elementName);
  if (msie < 9 && elementName.charAt(0) != '@') { // ignore attr-widgets
    document.createElement(elementName);
  }
  return elementName;
}

var $$scope           = '$scope',
    $boolean          = 'boolean',
    $console          = 'console',
    $length           = 'length',
    $name             = 'name',
    $object           = 'object',
    $string           = 'string',
    $undefined        = 'undefined',
    Error             = window.Error,
    /** holds major version number for IE or NaN for real browsers */
    msie              = parseInt((/msie (\d+)/.exec(lowercase(navigator.userAgent)) || [])[1], 10),
    jqLite,           // delay binding since jQuery could be loaded after us.
    jQuery,           // delay binding
    slice             = [].slice,
    push              = [].push,
    toString          = Object.prototype.toString,
    error             = window[$console]
                           ? bind(window[$console], window[$console]['error'] || noop)
                           : noop,

    /** @name angular */
    angular           = window.angular || (window.angular = {}),
    angularModule     = null,
    /** @name angular.markup */
    angularTextMarkup = extensionMap(angular, 'markup'),
    /** @name angular.attrMarkup */
    angularAttrMarkup = extensionMap(angular, 'attrMarkup'),
    /** @name angular.directive */
    angularDirective  = extensionMap(angular, 'directive', lowercase),
    /** @name angular.widget */
    angularWidget     = extensionMap(angular, 'widget', shivForIE),
    /** @name angular.module.ng */
    angularInputType  = extensionMap(angular, 'inputType', lowercase),
    nodeName_,
    uid               = ['0', '0', '0'],
    DATE_ISOSTRING_LN = 24;

/**
 * @ngdoc function
 * @name angular.forEach
 * @function
 *
 * @description
 * Invokes the `iterator` function once for each item in `obj` collection, which can be either an
 * object or an array. The `iterator` function is invoked with `iterator(value, key)`, where `value`
 * is the value of an object property or an array element and `key` is the object property key or
 * array element index. Specifying a `context` for the function is optional.
 *
 * Note: this function was previously known as `angular.foreach`.
 *
   <pre>
     var values = {name: 'misko', gender: 'male'};
     var log = [];
     angular.forEach(values, function(value, key){
       this.push(key + ': ' + value);
     }, log);
     expect(log).toEqual(['name: misko', 'gender:male']);
   </pre>
 *
 * @param {Object|Array} obj Object to iterate over.
 * @param {Function} iterator Iterator function.
 * @param {Object=} context Object to become context (`this`) for the iterator function.
 * @returns {Object|Array} Reference to `obj`.
 */
function forEach(obj, iterator, context) {
  var key;
  if (obj) {
    if (isFunction(obj)){
      for (key in obj) {
        if (key != 'prototype' && key != $length && key != $name && obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key);
        }
      }
    } else if (obj.forEach && obj.forEach !== forEach) {
      obj.forEach(iterator, context);
    } else if (isObject(obj) && isNumber(obj.length)) {
      for (key = 0; key < obj.length; key++)
        iterator.call(context, obj[key], key);
    } else {
      for (key in obj)
        iterator.call(context, obj[key], key);
    }
  }
  return obj;
}

function sortedKeys(obj) {
  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }
  return keys.sort();
}

function forEachSorted(obj, iterator, context) {
  var keys = sortedKeys(obj)
  for ( var i = 0; i < keys.length; i++) {
    iterator.call(context, obj[keys[i]], keys[i]);
  }
  return keys;
}


/**
 * when using forEach the params are value, key, but it is often useful to have key, value.
 * @param {function(string, *)} iteratorFn
 * @returns {function(*, string)}
 */
function reverseParams(iteratorFn) {
  return function(value, key) { iteratorFn(key, value) };
}

/**
 * A consistent way of creating unique IDs in angular. The ID is a sequence of alpha numeric
 * characters such as '012ABC'. The reason why we are not using simply a number counter is that
 * the number string gets longer over time, and it can also overflow, where as the the nextId
 * will grow much slower, it is a string, and it will never overflow.
 *
 * @returns an unique alpha-numeric string
 */
function nextUid() {
  var index = uid.length;
  var digit;

  while(index) {
    index--;
    digit = uid[index].charCodeAt(0);
    if (digit == 57 /*'9'*/) {
      uid[index] = 'A';
      return uid.join('');
    }
    if (digit == 90  /*'Z'*/) {
      uid[index] = '0';
    } else {
      uid[index] = String.fromCharCode(digit + 1);
      return uid.join('');
    }
  }
  uid.unshift('0');
  return uid.join('');
}

/**
 * @ngdoc function
 * @name angular.extend
 * @function
 *
 * @description
 * Extends the destination object `dst` by copying all of the properties from the `src` object(s)
 * to `dst`. You can specify multiple `src` objects.
 *
 * @param {Object} dst Destination object.
 * @param {...Object} src Source object(s).
 */
function extend(dst) {
  forEach(arguments, function(obj){
    if (obj !== dst) {
      forEach(obj, function(value, key){
        dst[key] = value;
      });
    }
  });
  return dst;
}


function inherit(parent, extra) {
  return extend(new (extend(function() {}, {prototype:parent}))(), extra);
}


/**
 * @ngdoc function
 * @name angular.noop
 * @function
 *
 * @description
 * A function that performs no operations. This function can be useful when writing code in the
 * functional style.
   <pre>
     function foo(callback) {
       var result = calculateResult();
       (callback || angular.noop)(result);
     }
   </pre>
 */
function noop() {}
noop.$inject = [];


/**
 * @ngdoc function
 * @name angular.identity
 * @function
 *
 * @description
 * A function that returns its first argument. This function is useful when writing code in the
 * functional style.
 *
   <pre>
     function transformer(transformationFn, value) {
       return (transformationFn || identity)(value);
     };
   </pre>
 */
function identity($) {return $;}
identity.$inject = [];


function valueFn(value) {return function() {return value;};}

function extensionMap(angular, name, transform) {
  var extPoint;
  return angular[name] || (extPoint = angular[name] = function(name, fn, prop){
    name = (transform || identity)(name);
    if (isDefined(fn)) {
      extPoint[name] = extend(fn, prop || {});
    }
    return extPoint[name];
  });
}

/**
 * @ngdoc function
 * @name angular.isUndefined
 * @function
 *
 * @description
 * Determines if a reference is undefined.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is undefined.
 */
function isUndefined(value){return typeof value == $undefined;}


/**
 * @ngdoc function
 * @name angular.isDefined
 * @function
 *
 * @description
 * Determines if a reference is defined.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is defined.
 */
function isDefined(value){return typeof value != $undefined;}


/**
 * @ngdoc function
 * @name angular.isObject
 * @function
 *
 * @description
 * Determines if a reference is an `Object`. Unlike `typeof` in JavaScript, `null`s are not
 * considered to be objects.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is an `Object` but not `null`.
 */
function isObject(value){return value!=null && typeof value == $object;}


/**
 * @ngdoc function
 * @name angular.isString
 * @function
 *
 * @description
 * Determines if a reference is a `String`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `String`.
 */
function isString(value){return typeof value == $string;}


/**
 * @ngdoc function
 * @name angular.isNumber
 * @function
 *
 * @description
 * Determines if a reference is a `Number`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Number`.
 */
function isNumber(value){return typeof value == 'number';}


/**
 * @ngdoc function
 * @name angular.isDate
 * @function
 *
 * @description
 * Determines if a value is a date.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Date`.
 */
function isDate(value){
  return toString.apply(value) == '[object Date]';
}


/**
 * @ngdoc function
 * @name angular.isArray
 * @function
 *
 * @description
 * Determines if a reference is an `Array`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is an `Array`.
 */
function isArray(value) {
  return toString.apply(value) == '[object Array]';
}


/**
 * @ngdoc function
 * @name angular.isFunction
 * @function
 *
 * @description
 * Determines if a reference is a `Function`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Function`.
 */
function isFunction(value){return typeof value == 'function';}


/**
 * Checks if `obj` is a window object.
 *
 * @private
 * @param {*} obj Object to check
 * @returns {boolean} True if `obj` is a window obj.
 */
function isWindow(obj) {
  return obj && obj.document && obj.location && obj.alert && obj.setInterval;
}


function isScope(obj) {
  return obj && obj.$evalAsync && obj.$watch;
}


function isBoolean(value) {return typeof value == $boolean;}
function isTextNode(node) {return nodeName_(node) == '#text';}

function trim(value) {
  return isString(value) ? value.replace(/^\s*/, '').replace(/\s*$/, '') : value;
}

/**
 * @ngdoc function
 * @name angular.isElement
 * @function
 *
 * @description
 * Determines if a reference is a DOM element (or wrapped jQuery element).
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a DOM element (or wrapped jQuery element).
 */
function isElement(node) {
  return node &&
    (node.nodeName  // we are a direct element
    || (node.bind && node.find));  // we have a bind and find method part of jQuery API
}

/**
 * @param str 'key1,key2,...'
 * @returns {object} in the form of {key1:true, key2:true, ...}
 */
function makeMap(str){
  var obj = {}, items = str.split(","), i;
  for ( i = 0; i < items.length; i++ )
    obj[ items[i] ] = true;
  return obj;
}



/**
 * HTML class which is the only class which can be used in ng:bind to inline HTML for security
 * reasons.
 *
 * @constructor
 * @param html raw (unsafe) html
 * @param {string=} option If set to 'usafe', get method will return raw (unsafe/unsanitized) html
 */
function HTML(html, option) {
  this.html = html;
  this.get = lowercase(option) == 'unsafe'
    ? valueFn(html)
    : function htmlSanitize() {
        var buf = [];
        htmlParser(html, htmlSanitizeWriter(buf));
        return buf.join('');
      };
}

if (msie < 9) {
  nodeName_ = function(element) {
    element = element.nodeName ? element : element[0];
    return (element.scopeName && element.scopeName != 'HTML')
      ? uppercase(element.scopeName + ':' + element.nodeName) : element.nodeName;
  };
} else {
  nodeName_ = function(element) {
    return element.nodeName ? element.nodeName : element[0].nodeName;
  };
}

function isVisible(element) {
  var rect = element[0].getBoundingClientRect(),
      width = (rect.width || (rect.right||0 - rect.left||0)),
      height = (rect.height || (rect.bottom||0 - rect.top||0));
  return width>0 && height>0;
}

function map(obj, iterator, context) {
  var results = [];
  forEach(obj, function(value, index, list) {
    results.push(iterator.call(context, value, index, list));
  });
  return results;
}


/**
 * @description
 * Determines the number of elements in an array, the number of properties an object has, or
 * the length of a string.
 *
 * Note: This function is used to augment the Object type in Angular expressions. See
 * {@link angular.Object} for more information about Angular arrays.
 *
 * @param {Object|Array|string} obj Object, array, or string to inspect.
 * @param {boolean} [ownPropsOnly=false] Count only "own" properties in an object
 * @returns {number} The size of `obj` or `0` if `obj` is neither an object nor an array.
 */
function size(obj, ownPropsOnly) {
  var size = 0, key;

  if (isArray(obj) || isString(obj)) {
    return obj.length;
  } else if (isObject(obj)){
    for (key in obj)
      if (!ownPropsOnly || obj.hasOwnProperty(key))
        size++;
  }

  return size;
}


function includes(array, obj) {
  for ( var i = 0; i < array.length; i++) {
    if (obj === array[i]) return true;
  }
  return false;
}

function indexOf(array, obj) {
  for ( var i = 0; i < array.length; i++) {
    if (obj === array[i]) return i;
  }
  return -1;
}

function arrayRemove(array, value) {
  var index = indexOf(array, value);
  if (index >=0)
    array.splice(index, 1);
  return value;
}

function isLeafNode (node) {
  if (node) {
    switch (node.nodeName) {
    case "OPTION":
    case "PRE":
    case "TITLE":
      return true;
    }
  }
  return false;
}

/**
 * @ngdoc function
 * @name angular.copy
 * @function
 *
 * @description
 * Creates a deep copy of `source`, which should be an object or an array.
 *
 * * If no destination is supplied, a copy of the object or array is created.
 * * If a destination is provided, all of its elements (for array) or properties (for objects)
 *   are deleted and then all elements/properties from the source are copied to it.
 * * If  `source` is not an object or array, `source` is returned.
 *
 * Note: this function is used to augment the Object type in Angular expressions. See
 * {@link angular.module.ng.$filter} for more information about Angular arrays.
 *
 * @param {*} source The source that will be used to make a copy.
 *                   Can be any type, including primitives, `null`, and `undefined`.
 * @param {(Object|Array)=} destination Destination into which the source is copied. If
 *     provided, must be of the same type as `source`.
 * @returns {*} The copy or updated `destination`, if `destination` was specified.
 */
function copy(source, destination){
  if (isWindow(source) || isScope(source)) throw Error("Can't copy Window or Scope");
  if (!destination) {
    destination = source;
    if (source) {
      if (isArray(source)) {
        destination = copy(source, []);
      } else if (isDate(source)) {
        destination = new Date(source.getTime());
      } else if (isObject(source)) {
        destination = copy(source, {});
      }
    }
  } else {
    if (source === destination) throw Error("Can't copy equivalent objects or arrays");
    if (isArray(source)) {
      while(destination.length) {
        destination.pop();
      }
      for ( var i = 0; i < source.length; i++) {
        destination.push(copy(source[i]));
      }
    } else {
      forEach(destination, function(value, key){
        delete destination[key];
      });
      for ( var key in source) {
        destination[key] = copy(source[key]);
      }
    }
  }
  return destination;
}

/**
 * @ngdoc function
 * @name angular.equals
 * @function
 *
 * @description
 * Determines if two objects or two values are equivalent. Supports value types, arrays and
 * objects.
 *
 * Two objects or values are considered equivalent if at least one of the following is true:
 *
 * * Both objects or values pass `===` comparison.
 * * Both objects or values are of the same type and all of their properties pass `===` comparison.
 * * Both values are NaN. (In JavasScript, NaN == NaN => false. But we consider two NaN as equal)
 *
 * During a property comparision, properties of `function` type and properties with names
 * that begin with `$` are ignored.
 *
 * Scope and DOMWindow objects are being compared only be identify (`===`).
 *
 * @param {*} o1 Object or value to compare.
 * @param {*} o2 Object or value to compare.
 * @returns {boolean} True if arguments are equal.
 */
function equals(o1, o2) {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
  var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
  if (t1 == t2 && t1 == 'object') {
    if (isArray(o1)) {
      if ((length = o1.length) == o2.length) {
        for(key=0; key<length; key++) {
          if (!equals(o1[key], o2[key])) return false;
        }
        return true;
      }
    } else {
      if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2)) return false;
      keySet = {};
      for(key in o1) {
        if (key.charAt(0) !== '$' && !isFunction(o1[key]) && !equals(o1[key], o2[key])) {
          return false;
        }
        keySet[key] = true;
      }
      for(key in o2) {
        if (!keySet[key] && key.charAt(0) !== '$' && !isFunction(o2[key])) return false;
      }
      return true;
    }
  }
  return false;
}

function setHtml(node, html) {
  if (isLeafNode(node)) {
    if (msie) {
      node.innerText = html;
    } else {
      node.textContent = html;
    }
  } else {
    node.innerHTML = html;
  }
}

function concat(array1, array2, index) {
  return array1.concat(slice.call(array2, index));
}

function sliceArgs(args, startIndex) {
  return slice.call(args, startIndex || 0);
}


/**
 * @ngdoc function
 * @name angular.bind
 * @function
 *
 * @description
 * Returns a function which calls function `fn` bound to `self` (`self` becomes the `this` for
 * `fn`). You can supply optional `args` that are are prebound to the function. This feature is also
 * known as [function currying](http://en.wikipedia.org/wiki/Currying).
 *
 * @param {Object} self Context which `fn` should be evaluated in.
 * @param {function()} fn Function to be bound.
 * @param {...*} args Optional arguments to be prebound to the `fn` function call.
 * @returns {function()} Function that wraps the `fn` with all the specified bindings.
 */
function bind(self, fn) {
  var curryArgs = arguments.length > 2 ? sliceArgs(arguments, 2) : [];
  if (isFunction(fn) && !(fn instanceof RegExp)) {
    return curryArgs.length
      ? function() {
          return arguments.length
            ? fn.apply(self, curryArgs.concat(slice.call(arguments, 0)))
            : fn.apply(self, curryArgs);
        }
      : function() {
          return arguments.length
            ? fn.apply(self, arguments)
            : fn.call(self);
        };
  } else {
    // in IE, native methods are not functions so they cannot be bound (note: they don't need to be)
    return fn;
  }
}

function toBoolean(value) {
  if (value && value.length !== 0) {
    var v = lowercase("" + value);
    value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
  } else {
    value = false;
  }
  return value;
}


/////////////////////////////////////////////////

/**
 * Parses an escaped url query string into key-value pairs.
 * @returns Object.<(string|boolean)>
 */
function parseKeyValue(/**string*/keyValue) {
  var obj = {}, key_value, key;
  forEach((keyValue || "").split('&'), function(keyValue){
    if (keyValue) {
      key_value = keyValue.split('=');
      key = decodeURIComponent(key_value[0]);
      obj[key] = isDefined(key_value[1]) ? decodeURIComponent(key_value[1]) : true;
    }
  });
  return obj;
}

function toKeyValue(obj) {
  var parts = [];
  forEach(obj, function(value, key) {
    parts.push(encodeUriQuery(key, true) + (value === true ? '' : '=' + encodeUriQuery(value, true)));
  });
  return parts.length ? parts.join('&') : '';
}


/**
 * We need our custom mehtod because encodeURIComponent is too agressive and doesn't follow
 * http://www.ietf.org/rfc/rfc3986.txt with regards to the character set (pchar) allowed in path
 * segments:
 *    segment       = *pchar
 *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
 *    pct-encoded   = "%" HEXDIG HEXDIG
 *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
 *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
 *                     / "*" / "+" / "," / ";" / "="
 */
function encodeUriSegment(val) {
  return encodeUriQuery(val, true).
             replace(/%26/gi, '&').
             replace(/%3D/gi, '=').
             replace(/%2B/gi, '+');
}


/**
 * This method is intended for encoding *key* or *value* parts of query component. We need a custom
 * method becuase encodeURIComponent is too agressive and encodes stuff that doesn't have to be
 * encoded per http://tools.ietf.org/html/rfc3986:
 *    query       = *( pchar / "/" / "?" )
 *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
 *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
 *    pct-encoded   = "%" HEXDIG HEXDIG
 *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
 *                     / "*" / "+" / "," / ";" / "="
 */
function encodeUriQuery(val, pctEncodeSpaces) {
  return encodeURIComponent(val).
             replace(/%40/gi, '@').
             replace(/%3A/gi, ':').
             replace(/%24/g, '$').
             replace(/%2C/gi, ',').
             replace((pctEncodeSpaces ? null : /%20/g), '+');
}


/**
 * @ngdoc directive
 * @name angular.directive.ng:app
 *
 * @element ANY
 * @param {angular.Module} module on optional application
 *   {@link angular.module module} name to load.
 *
 * @description
 *
 * Use this directive to auto-bootstrap on application. Only
 * one directive can be used per HTML document. The directive
 * designates the root of the application and is typically placed
 * ot the root of the page.
 *
 * In the example below if the `ng:app` directive would not be placed
 * on the `html` element then the document would not be compiled
 * and the `{{ 1+2 }}` would not be resolved to `3`.
 *
 * `ng:app` is the easiest way to bootstrap an application.
 *
 <doc:example>
   <doc:source>
    I can add: 1 + 2 =  {{ 1+2 }}
   </doc:source>
 </doc:example>
 *
 */
function angularInit(element, bootstrap) {
  var elements = [element],
      appElement,
      module,
      names = ['ng:app', 'ng-app', 'x-ng-app', 'data-ng-app'],
      NG_APP_CLASS_REGEXP = /\sng[:\-]app(:\s*([\w\d_]+);?)?\s/;

  function append(element) {
    element && elements.push(element);
  }

  forEach(names, function(name) {
    names[name] = true;
    append(document.getElementById(name));
    name = name.replace(':', '\\:');
    if (element.querySelectorAll) {
      forEach(element.querySelectorAll('.' + name), append);
      forEach(element.querySelectorAll('.' + name + '\\:'), append);
      forEach(element.querySelectorAll('[' + name + ']'), append);
    };
  });

  forEach(elements, function(element) {
    if (!appElement) {
      var className = ' ' + element.className + ' ';
      var match = NG_APP_CLASS_REGEXP.exec(className);
      if (match) {
        appElement = element;
        module = (match[2] || '').replace(/\s+/g, ',');
      } else {
        forEach(element.attributes, function(attr) {
          if (!appElement && names[attr.name]) {
            appElement = element;
            module = attr.value;
          }
        });
      }
    }
  });
  if (appElement) {
    bootstrap(appElement, module ? [module] : []);
  }
}

/**
 * @ngdoc function
 * @name angular.bootstrap
 * @description
 * Use this function to manually start up angular application.
 *
 * See: {@link guide/dev_guide.bootstrap.manual_bootstrap Bootstrap}
 *
 * @param {Element} element DOM element which is the root of angular application.
 * @param {Array<String,function>=} modules an array of module declarations. See: {@link angular.module modules}
 * @param {angular.module.auta.$injector} the injector;
 */
function bootstrap(element, modules) {
  element = jqLite(element);
  modules = modules || [];
  modules.unshift('ng');
  var injector = createInjector(modules);
  injector.invoke(
    ['$rootScope', '$compile', '$injector', function(scope, compile, injector){
      scope.$apply(function() {
        element.data('$injector', injector);
        compile(element)(scope);
      });
    }]
  );
  return injector;
}

function bindJQuery() {
  // bind to jQuery if present;
  jQuery = window.jQuery;
  // reset to jQuery or default to us.
  if (jQuery) {
    jqLite = jQuery;
    extend(jQuery.fn, {
      scope: JQLitePrototype.scope,
      injector: JQLitePrototype.injector,
      inheritedData: JQLitePrototype.inheritedData
    });
    JQLitePatchJQueryRemove('remove', true);
    JQLitePatchJQueryRemove('empty');
    JQLitePatchJQueryRemove('html');
  } else {
    jqLite = jqLiteWrap;
  }
  angular.element = jqLite;
}

/**
 * throw error of the argument is falsy.
 */
function assertArg(arg, name, reason) {
  if (!arg) {
    var error = new Error("Argument '" + (name||'?') + "' is " +
        (reason || "required"));
    throw error;
  }
  return arg;
}

function assertArgFn(arg, name) {
  assertArg(isFunction(arg), name, 'not a function, got ' +
      (typeof arg == 'object' ? arg.constructor.name || 'Object' : typeof arg));
  return arg;
}

/**
 * @ngdoc interface
 * @name angular.Module
 * @description
 *
 * Interface for configuring angular {@link angular.module modules}.
 */

function setupModuleLoader(window) {

  function ensure(obj, name, factory) {
    return obj[name] || (obj[name] = factory());
  }

  return ensure(ensure(window, 'angular', Object), 'module', function() {
    /** @type {Object.<string, angular.Module>} */
    var modules = {};

    /**
     * @ngdoc function
     * @name angular.module
     * @description
     *
     * The `angular.module` is a global place for creating and registering Angular modules. All
     * modules (angular core or 3rd party) that should be available to an application must be
     * registered using this mechanism.
     *
     *
     * # Module
     *
     * A module is a collocation of services, directives, filters, and configure information. Module
     * is used to configure the {@link angular.module.AUTO.$injector $injector}.
     *
     * <pre>
     * // Create a new module
     * var myModule = angular.module('myModule', []);
     *
     * // register a new service
     * myModule.value('appName', 'MyCoolApp');
     *
     * // configure existing services inside initialization blocks.
     * myModule.config(function($locationProvider) {
     *   // Configure existing providers
     *   $locationProvider.hashPrefix('!');
     * });
     * </pre>
     *
     * Then you can create an injector and load your modules like this:
     *
     * <pre>
     * var injector = angular.injector(['ng', 'MyModule'])
     * </pre>
     *
     * However it's more likely that you'll just use {@link angular.directive.ng:app ng:app} or
     * {@link angular.bootstrap} to simplify this process for you.
     *
     * @param {!string} name The name of the module to create or retrieve.
     * @param {Array.<string>=} requires If specified then new module is being created. If unspecified then the
     *        the module is being retrieved for further configuration.
     * @param {Function} configFn Option configuration function for the module. Same as
     *        {@link angular.Module#config Module#config()}.
     * @returns {module} new module with the {@link angular.Module} api.
     */
    return function module(name, requires, configFn) {
      if (requires && modules.hasOwnProperty(name)) {
        modules[name] = null;
      }
      return ensure(modules, name, function() {
        if (!requires) {
          throw Error('No module: ' + name);
        }

        /** @type {!Array.<Array.<*>>} */
        var invokeQueue = [];

        /** @type {!Array.<Function>} */
        var runBlocks = [];

        var config = invokeLater('$injector', 'invoke');

        /** @type {angular.Module} */
        var moduleInstance = {
          // Private state
          _invokeQueue: invokeQueue,
          _runBlocks: runBlocks,

          /**
           * @ngdoc property
           * @name angular.Module#requires
           * @propertyOf angular.Module
           * @returns {Array.<string>} List of module names which must be loaded before this module.
           * @description
           * Holds the list of modules which the injector will load before the current module is loaded.
           */
          requires: requires,

          /**
           * @ngdoc property
           * @name angular.Module#name
           * @propertyOf angular.Module
           * @returns {string} Name of the module.
           * @description
           */
          name: name,


          /**
           * @ngdoc method
           * @name angular.Module#service
           * @methodOf angular.Module
           * @param {string} name service name
           * @param {Function} providerType Construction function for creating new instance of the service.
           * @description
           * See {@link angular.module.AUTO.$provide#service $provide.service()}.
           */
          service: invokeLater('$provide', 'service'),

          /**
           * @ngdoc method
           * @name angular.Module#factory
           * @methodOf angular.Module
           * @param {string} name service name
           * @param {Function} providerFunction Function for creating new instance of the service.
           * @description
           * See {@link angular.module.AUTO.$provide#service $provide.factory()}.
           */
          factory: invokeLater('$provide', 'factory'),

          /**
           * @ngdoc method
           * @name angular.Module#value
           * @methodOf angular.Module
           * @param {string} name service name
           * @param {*} object Service instance object.
           * @description
           * See {@link angular.module.AUTO.$provide#value $provide.value()}.
           */
          value: invokeLater('$provide', 'value'),

          /**
           * @ngdoc method
           * @name angular.Module#filter
           * @methodOf angular.Module
           * @param {string} name filterr name
           * @param {Function} filterFactory Factory function for creating new instance of filter.
           * @description
           * See {@link angular.module.ng.$filterProvider#register $filterProvider.register()}.
           */
          filter: invokeLater('$filterProvider', 'register'),

          /**
           * @ngdoc method
           * @name angular.Module#config
           * @methodOf angular.Module
           * @param {Function} configFn Execute this function on module load. Useful for service
           *    configuration.
           * @description
           * Use this method to register work which needs to be performed on module loading.
           */
          config: config,

          /**
           * @ngdoc method
           * @name angular.Module#run
           * @methodOf angular.Module
           * @param {Function} initializationFn Execute this function after injector creation.
           *    Useful for application initialization.
           * @description
           * Use this method to register work which needs to be performed when the injector with
           * with the current module is finished loading.
           */
          run: function(block) {
            runBlocks.push(block);
            return this;
          }
        };

        if (configFn) {
          config(configFn);
        }

        return  moduleInstance;

        /**
         * @param {string} provider
         * @param {string} method
         * @returns {angular.Module}
         */
        function invokeLater(provider, method) {
          return function() {
            invokeQueue.push([provider, method, arguments]);
            return moduleInstance;
          }
        }
      });
    };
  });

}

/**
 * @ngdoc property
 * @name angular.version
 * @description
 * An object that contains information about the current AngularJS version. This object has the
 * following properties:
 *
 * - `full` ??? `{string}` ??? Full version string, such as "0.9.18".
 * - `major` ??? `{number}` ??? Major version number, such as "0".
 * - `minor` ??? `{number}` ??? Minor version number, such as "9".
 * - `dot` ??? `{number}` ??? Dot version number, such as "18".
 * - `codeName` ??? `{string}` ??? Code name of the release, such as "jiggling-armfat".
 */
var version = {
  full: '0.10.6',    // all of these placeholder strings will be replaced by rake's
  major: 0,    // compile task
  minor: 10,
  dot: 6,
  codeName: 'bubblewrap-cape'
};


function publishExternalAPI(angular){
  extend(angular, {
    'bootstrap': bootstrap,
    'copy': copy,
    'extend': extend,
    'equals': equals,
    'element': jqLite,
    'forEach': forEach,
    'injector': createInjector,
    'noop':noop,
    'bind':bind,
    'toJson': toJson,
    'fromJson': fromJson,
    'identity':identity,
    'isUndefined': isUndefined,
    'isDefined': isDefined,
    'isString': isString,
    'isFunction': isFunction,
    'isObject': isObject,
    'isNumber': isNumber,
    'isElement': isElement,
    'isArray': isArray,
    'version': version,
    'isDate': isDate,
    'lowercase': lowercase,
    'uppercase': uppercase,
    'callbacks': {counter: 0}
  });

  angularModule = setupModuleLoader(window);
  try {
    angularModule('ngLocale');
  } catch (e) {
    angularModule('ngLocale', []).service('$locale', $LocaleProvider);
  }

  angularModule('ng', ['ngLocale'], ['$provide',
    function ngModule($provide) {
    // TODO(misko): temporary services to get the compiler working;
      $provide.value('$textMarkup', angularTextMarkup);
      $provide.value('$attrMarkup', angularAttrMarkup);
      $provide.value('$directive', angularDirective);
      $provide.value('$widget', angularWidget);

      $provide.service('$anchorScroll', $AnchorScrollProvider);
      $provide.service('$browser', $BrowserProvider);
      $provide.service('$cacheFactory', $CacheFactoryProvider);
      $provide.service('$compile', $CompileProvider);
      $provide.service('$cookies', $CookiesProvider);
      $provide.service('$cookieStore', $CookieStoreProvider);
      $provide.service('$defer', $DeferProvider);
      $provide.service('$document', $DocumentProvider);
      $provide.service('$exceptionHandler', $ExceptionHandlerProvider);
      $provide.service('$filter', $FilterProvider);
      $provide.service('$interpolate', $InterpolateProvider);
      $provide.service('$formFactory', $FormFactoryProvider);
      $provide.service('$http', $HttpProvider);
      $provide.service('$httpBackend', $HttpBackendProvider);
      $provide.service('$location', $LocationProvider);
      $provide.service('$log', $LogProvider);
      $provide.service('$parse', $ParseProvider);
      $provide.service('$resource', $ResourceProvider);
      $provide.service('$route', $RouteProvider);
      $provide.service('$routeParams', $RouteParamsProvider);
      $provide.service('$rootScope', $RootScopeProvider);
      $provide.service('$q', $QProvider);
      $provide.service('$sniffer', $SnifferProvider);
      $provide.service('$templateCache', $TemplateCacheProvider);
      $provide.service('$window', $WindowProvider);
    }]);
}

var array = [].constructor;

/**
 * @ngdoc function
 * @name angular.toJson
 * @function
 *
 * @description
 * Serializes input into a JSON-formatted string.
 *
 * @param {Object|Array|Date|string|number} obj Input to be serialized into JSON.
 * @param {boolean=} pretty If set to true, the JSON output will contain newlines and whitespace.
 * @returns {string} Jsonified string representing `obj`.
 */
function toJson(obj, pretty) {
  var buf = [];
  toJsonArray(buf, obj, pretty ? "\n  " : null, []);
  return buf.join('');
}

/**
 * @ngdoc function
 * @name angular.fromJson
 * @function
 *
 * @description
 * Deserializes a JSON string.
 *
 * @param {string} json JSON string to deserialize.
 * @param {boolean} [useNative=false] Use native JSON parser, if available.
 * @returns {Object|Array|Date|string|number} Deserialized thingy.
 */
function fromJson(json, useNative) {
  if (!isString(json)) return json;

  var obj;

  try {
    if (useNative && window.JSON && window.JSON.parse) {
      obj = JSON.parse(json);
    } else {
      obj = parseJson(json, true)();
    }
    return transformDates(obj);
  } catch (e) {
    error("fromJson error: ", json, e);
    throw e;
  }

  // TODO make forEach optionally recursive and remove this function
  // TODO(misko): remove this once the $http service is checked in.
  function transformDates(obj) {
    if (isString(obj) && obj.length === DATE_ISOSTRING_LN) {
      return jsonStringToDate(obj);
    } else if (isArray(obj) || isObject(obj)) {
      forEach(obj, function(val, name) {
        obj[name] = transformDates(val);
      });
    }
    return obj;
  }
}

var R_ISO8061_STR = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d)(?:\:(\d\d)(?:\:(\d\d)(?:\.(\d{3}))?)?)?Z)?$/;
function jsonStringToDate(string){
  var match;
  if (isString(string) && (match = string.match(R_ISO8061_STR))){
    var date = new Date(0);
    date.setUTCFullYear(match[1], match[2] - 1, match[3]);
    date.setUTCHours(match[4]||0, match[5]||0, match[6]||0, match[7]||0);
    return date;
  }
  return string;
}

function jsonDateToString(date){
  if (!date) return date;
  var isoString = date.toISOString ? date.toISOString() : '';
  return (isoString.length==24)
    ? isoString
    : padNumber(date.getUTCFullYear(), 4) + '-' +
      padNumber(date.getUTCMonth() + 1, 2) + '-' +
      padNumber(date.getUTCDate(), 2) + 'T' +
      padNumber(date.getUTCHours(), 2) + ':' +
      padNumber(date.getUTCMinutes(), 2) + ':' +
      padNumber(date.getUTCSeconds(), 2) + '.' +
      padNumber(date.getUTCMilliseconds(), 3) + 'Z';
}

function quoteUnicode(string) {
    var chars = ['"'];
    for ( var i = 0; i < string.length; i++) {
      var code = string.charCodeAt(i);
      var ch = string.charAt(i);
      switch(ch) {
        case '"': chars.push('\\"'); break;
        case '\\': chars.push('\\\\'); break;
        case '\n': chars.push('\\n'); break;
        case '\f': chars.push('\\f'); break;
        case '\r': chars.push(ch = '\\r'); break;
        case '\t': chars.push(ch = '\\t'); break;
        default:
          if (32 <= code && code <= 126) {
            chars.push(ch);
          } else {
            var encode = "000" + code.toString(16);
            chars.push("\\u" + encode.substring(encode.length - 4));
          }
      }
    }
    chars.push('"');
    return chars.join('');
  }


function toJsonArray(buf, obj, pretty, stack) {
  if (isObject(obj)) {
    if (obj === window) {
      buf.push('WINDOW');
      return;
    }

    if (obj === document) {
      buf.push('DOCUMENT');
      return;
    }

    if (includes(stack, obj)) {
      buf.push('RECURSION');
      return;
    }
    stack.push(obj);
  }
  if (obj === null) {
    buf.push('null');
  } else if (obj instanceof RegExp) {
    buf.push(quoteUnicode(obj.toString()));
  } else if (isFunction(obj)) {
    return;
  } else if (isBoolean(obj)) {
    buf.push('' + obj);
  } else if (isNumber(obj)) {
    if (isNaN(obj)) {
      buf.push('null');
    } else {
      buf.push('' + obj);
    }
  } else if (isString(obj)) {
    return buf.push(quoteUnicode(obj));
  } else if (isObject(obj)) {
    if (isArray(obj)) {
      buf.push("[");
      var len = obj.length;
      var sep = false;
      for(var i=0; i<len; i++) {
        var item = obj[i];
        if (sep) buf.push(",");
        if (!(item instanceof RegExp) && (isFunction(item) || isUndefined(item))) {
          buf.push('null');
        } else {
          toJsonArray(buf, item, pretty, stack);
        }
        sep = true;
      }
      buf.push("]");
    } else if (isElement(obj)) {
      // TODO(misko): maybe in dev mode have a better error reporting?
      buf.push('DOM_ELEMENT');
    } else if (isDate(obj)) {
      buf.push(quoteUnicode(jsonDateToString(obj)));
    } else {
      buf.push("{");
      if (pretty) buf.push(pretty);
      var comma = false;
      var childPretty = pretty ? pretty + "  " : false;
      var keys = [];
      for(var k in obj) {
        if (k!='this' && k!='$parent' && k.substring(0,2) != '$$' && obj.hasOwnProperty(k) && obj[k] !== undefined) {
          keys.push(k);
        }
      }
      keys.sort();
      for ( var keyIndex = 0; keyIndex < keys.length; keyIndex++) {
        var key = keys[keyIndex];
        var value = obj[key];
        if (!isFunction(value)) {
          if (comma) {
            buf.push(",");
            if (pretty) buf.push(pretty);
          }
          buf.push(quoteUnicode(key));
          buf.push(":");
          toJsonArray(buf, value, childPretty, stack);
          comma = true;
        }
      }
      buf.push("}");
    }
  }
  if (isObject(obj)) {
    stack.pop();
  }
}

/**
 * @ngdoc function
 * @name angular.injector
 * @function
 *
 * @description
 * Creates an injector function that can be used for retrieving services as well as for
 * dependency injection (see {@link guide/dev_guide.di dependency injection}).
 *

 * @param {Array.<string|Function>} modules A list of module functions or their aliases. See
 *        {@link angular.module}. The `ng` module must be explicitly added.
 * @returns {function()} Injector function. See {@link angular.module.AUTO.$injector $injector}.
 *
 * @example
 * Typical usage
 * <pre>
 *   // create an injector
 *   var $injector = angular.injector(['ng']);
 *
 *   // use the injector to kick of your application
 *   // use the type inference to auto inject arguments, or use implicit injection
 *   $injector.invoke(function($rootScope, $compile, $document){
 *     $compile($document)($rootScope);
 *     $rootScope.$digest();
 *   });
 * </pre>
 */


/**
 * @ngdoc overview
 * @name angular.module.AUTO
 * @description
 *
 * Implicit module which gets automatically added to each {@link angular.module.AUTO.$injector $injector}.
 */

var FN_ARGS = /^function\s*[^\(]*\(([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(.+?)\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function inferInjectionArgs(fn) {
  assertArgFn(fn);
  if (!fn.$inject) {
    var args = fn.$inject = [];
    var fnText = fn.toString().replace(STRIP_COMMENTS, '');
    var argDecl = fnText.match(FN_ARGS);
    forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg){
      arg.replace(FN_ARG, function(all, name){
        args.push(name);
      });
    });
  }
  return fn.$inject;
}

///////////////////////////////////////

/**
 * @ngdoc object
 * @name angular.module.AUTO.$injector
 * @function
 *
 * @description
 *
 * `$injector` is used to retrieve object instances as defined by
 * {@link angular.module.AUTO.$provide provider}, instantiate types, invoke methods,
 * and load modules.
 *
 * The following always holds true:
 *
 * <pre>
 *   var $injector = angular.injector();
 *   expect($injector.get('$injector')).toBe($injector);
 *   expect($injector.invoke(function($injector){
 *     return $injector;
 *   }).toBe($injector);
 * </pre>
 *
 * # Injection Function Annotation
 *
 * JavaScript does not have annotations, and annotations are needed for dependency injection. The
 * following ways are all valid way of annotating function with injection arguments and are equivalent.
 *
 * <pre>
 *   // inferred (only works if code not minified/obfuscated)
 *   $inject.invoke(function(serviceA){});
 *
 *   // annotated
 *   function explicit(serviceA) {};
 *   explicit.$inject = ['serviceA'];
 *   $inject.invoke(explicit);
 *
 *   // inline
 *   $inject.invoke(['serviceA', function(serviceA){}]);
 * </pre>
 *
 * ## Inference
 *
 * In JavaScript calling `toString()` on a function returns the function definition. The definition can then be
 * parsed and the function arguments can be extracted. *NOTE:* This does not work with minfication, and obfuscation
 * tools since these tools change the argument names.
 *
 * ## `$inject` Annotation
 * By adding a `$inject` property onto a function the injection parameters can be specified.
 *
 * ## Inline
 * As an array of injection names, where the last item in the array is the function to call.
 */

/**
 * @ngdoc method
 * @name angular.module.AUTO.$injector#get
 * @methodOf angular.module.AUTO.$injector
 *
 * @description
 * Return an instance of the service.
 *
 * @param {string} name The name of the instance to retrieve.
 * @return {*} The instance.
 */

/**
 * @ngdoc method
 * @name angular.module.AUTO.$injector#invoke
 * @methodOf angular.module.AUTO.$injector
 *
 * @description
 * Invoke the method and supply the method arguments from the `$injector`.
 *
 * @param {!function} fn The function to invoke. The function arguments come form the function annotation.
 * @param {Object=} self The `this` for the invoked method.
 * @param {Object=} locals Optional object. If preset then any argument names are read from this object first, before
 *   the `$injector` is consulted.
 * @return the value returned by the invoked `fn` function.
 */

/**
 * @ngdoc method
 * @name angular.module.AUTO.$injector#instantiate
 * @methodOf angular.module.AUTO.$injector
 * @description
 * Create a new instance of JS type. The method takes a constructor function invokes the new operator and supplies
 * all of the arguments to the constructor function as specified by the constructor annotation.
 *
 * @param {function} Type Annotated constructor function.
 * @param {Object=} locals Optional object. If preset then any argument names are read from this object first, before
 *   the `$injector` is consulted.
 * @return new instance of `Type`.
 */


/**
 * @ngdoc object
 * @name angular.module.AUTO.$provide
 *
 * @description
 *
 * Use `$provide` to register new providers with the `$injector`. The providers are the factories for the instance.
 * The providers share the same name as the instance they create with the `Provide` suffixed to them.
 *
 * A provider is an object with a `$get()` method. The injector calls the `$get` method to create a new instance of
 * a service. The Provider can have additional methods which would allow for configuration of the provider.
 *
 * <pre>
 *   function GreetProvider() {
 *     var salutation = 'Hello';
 *
 *     this.salutation = function(text) {
 *       salutation = text;
 *     };
 *
 *     this.$get = function() {
 *       return function (name) {
 *         return salutation + ' ' + name + '!';
 *       };
 *     };
 *   }
 *
 *   describe('Greeter', function(){
 *
 *     beforeEach(module(function($provide) {
 *       $provide.service('greet', GreetProvider);
 *     });
 *
 *     it('should greet', inject(function(greet) {
 *       expect(greet('angular')).toEqual('Hello angular!');
 *     }));
 *
 *     it('should allow configuration of salutation', function() {
 *       module(function(greetProvider) {
 *         greetProvider.salutation('Ahoj');
 *       });
 *       inject(function(greet) {
 *         expect(greet('angular')).toEqual('Ahoj angular!');
 *       });
 *     )};
 *
 *   });
 * </pre>
 */

/**
 * @ngdoc method
 * @name angular.module.AUTO.$provide#service
 * @methodOf angular.module.AUTO.$provide
 * @description
 *
 * Register a provider for a service. The providers can be retrieved and can have additional configuration methods.
 *
 * @param {string} name The name of the instance. NOTE: the provider will be available under `name + 'Provide'` key.
 * @param {(Object|function())} provider If the provider is:
 *
 *   - `Object`: then it should have a `$get` method. The `$get` method will be invoked using
 *               {@link angular.module.AUTO.$injector#invoke $injector.invoke()} when an instance needs to be created.
 *   - `Constructor`: a new instance of the provider will be created using
 *               {@link angular.module.AUTO.$injector#instantiate $injector.instantiate()}, then treated as `object`.
 *
 */

/**
 * @ngdoc method
 * @name angular.module.AUTO.$provide#factory
 * @methodOf angular.module.AUTO.$provide
 * @description
 *
 * A short hand for configuring services if only `$get` method is required.
 *
 * @param {string} name The name of the instance. NOTE: the provider will be available under `name + 'Provide'` key.
 * @param {function()} $getFn The $getFn for the instance creation. Internally this is a short hand for
 * `$provide.service(name, {$get:$getFn})`.
 */


/**
 * @ngdoc method
 * @name angular.module.AUTO.$provide#value
 * @methodOf angular.module.AUTO.$provide
 * @description
 *
 * A short hand for configuring services if the `$get` method is a constant.
 *
 * @param {string} name The name of the instance. NOTE: the provider will be available under `name + 'Provide'` key.
 * @param {function()} value The $getFn for the instance creation. Internally this is a short hand for
 * `$provide.service(name, {$get:function(){ return value; }})`.
 */


function createInjector(modulesToLoad) {
  var providerSuffix = 'Provider',
      path = [],
      loadedModules = new HashMap(),
      providerCache = {
        $provide: {
            service: supportObject(service),
            factory: supportObject(factory),
            value: supportObject(value),
            decorator: decorator
          }
      },
      providerInjector = createInternalInjector(providerCache, function() {
        throw Error("Unknown provider: " + path.join(' <- '));
      }),
      instanceCache = {},
      instanceInjector = (instanceCache.$injector =
          createInternalInjector(instanceCache, function(servicename) {
            var provider = providerInjector.get(servicename + providerSuffix);
            return instanceInjector.invoke(provider.$get, provider);
          }));


  forEach(loadModules(modulesToLoad), function(fn) { instanceInjector.invoke(fn || noop); });

  return instanceInjector;

  ////////////////////////////////////
  // $provider
  ////////////////////////////////////

  function supportObject(delegate) {
    return function(key, value) {
      if (isObject(key)) {
        forEach(key, reverseParams(delegate));
      } else {
        delegate(key, value);
      }
    }
  }

  function service(name, provider) {
    if (isFunction(provider)){
      provider = providerInjector.instantiate(provider);
    }
    if (!provider.$get) {
      throw Error('Provider ' + name + ' must define $get factory method.');
    }
    providerCache[name + providerSuffix] = provider;
  }

  function factory(name, factoryFn) { service(name, { $get:factoryFn }); }

  function value(name, value) { factory(name, valueFn(value)); }

  function decorator(serviceName, decorFn) {
    var origProvider = providerInjector.get(serviceName + providerSuffix),
        orig$get = origProvider.$get;

    origProvider.$get = function() {
      var origInstance = instanceInjector.invoke(orig$get, origProvider);
      return instanceInjector.invoke(decorFn, null, {$delegate: origInstance});
    };
  }

  ////////////////////////////////////
  // Module Loading
  ////////////////////////////////////
  function loadModules(modulesToLoad){
    var runBlocks = [];
    forEach(modulesToLoad, function(module) {
      if (loadedModules.get(module)) return;
      loadedModules.put(module, true);
      if (isString(module)) {
        var moduleFn = angularModule(module);
        runBlocks = runBlocks.concat(loadModules(moduleFn.requires)).concat(moduleFn._runBlocks);

        try {
          for(var invokeQueue = moduleFn._invokeQueue, i = 0, ii = invokeQueue.length; i < ii; i++) {
            var invokeArgs = invokeQueue[i],
                provider = invokeArgs[0] == '$injector'
                    ? providerInjector
                    : providerInjector.get(invokeArgs[0]);

            provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
          }
        } catch (e) {
          if (e.message) e.message += ' from ' + module;
          throw e;
        }
      } else if (isFunction(module)) {
        try {
          runBlocks.push(providerInjector.invoke(module));
        } catch (e) {
          if (e.message) e.message += ' from ' + module;
          throw e;
        }
      } else if (isArray(module)) {
        try {
          runBlocks.push(providerInjector.invoke(module));
        } catch (e) {
          if (e.message) e.message += ' from ' + String(module[module.length - 1]);
          throw e;
        }
      } else {
        assertArgFn(module, 'module');
      }
    });
    return runBlocks;
  }

  ////////////////////////////////////
  // internal Injector
  ////////////////////////////////////

  function createInternalInjector(cache, factory) {

    function getService(serviceName) {
      if (typeof serviceName !== 'string') {
        throw Error('Service name expected');
      }
      if (cache.hasOwnProperty(serviceName)) {
        return cache[serviceName];
      } else {
        try {
          path.unshift(serviceName);
          return cache[serviceName] = factory(serviceName);
        } finally {
          path.shift();
        }
      }
    }

    function invoke(fn, self, locals){
      var args = [],
          $injectAnnotation,
          $injectAnnotationIndex,
          key;

      if (typeof fn == 'function') {
        $injectAnnotation = inferInjectionArgs(fn);
        $injectAnnotationIndex = $injectAnnotation.length;
      } else {
        if (isArray(fn)) {
          $injectAnnotation = fn;
          $injectAnnotationIndex = $injectAnnotation.length;
          fn = $injectAnnotation[--$injectAnnotationIndex];
        }
        assertArgFn(fn, 'fn');
      }

      while($injectAnnotationIndex--) {
        key = $injectAnnotation[$injectAnnotationIndex];
        args.unshift(locals && locals.hasOwnProperty(key) ? locals[key] : getService(key));
      }

      // Performance optimization: http://jsperf.com/apply-vs-call-vs-invoke
      switch (self ? -1 : args.length) {
        case  0: return fn();
        case  1: return fn(args[0]);
        case  2: return fn(args[0], args[1]);
        case  3: return fn(args[0], args[1], args[2]);
        case  4: return fn(args[0], args[1], args[2], args[3]);
        case  5: return fn(args[0], args[1], args[2], args[3], args[4]);
        case  6: return fn(args[0], args[1], args[2], args[3], args[4], args[5]);
        case  7: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        case  8: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        case  9: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
        case 10: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
        default: return fn.apply(self, args);
      }
    }

    function instantiate(Type, locals){
      var Constructor = function(){},
          instance;
      Constructor.prototype = Type.prototype;
      instance = new Constructor();
      return invoke(Type, instance, locals) || instance;
    }

    return {
      invoke: invoke,
      instantiate: instantiate,
      get: getService
    };
  }
}

function Route(template, defaults) {
  this.template = template = template + '#';
  this.defaults = defaults || {};
  var urlParams = this.urlParams = {};
  forEach(template.split(/\W/), function(param){
    if (param && template.match(new RegExp(":" + param + "\\W"))) {
      urlParams[param] = true;
    }
  });
}

Route.prototype = {
  url: function(params) {
    var self = this,
        url = this.template,
        encodedVal;

    params = params || {};
    forEach(this.urlParams, function(_, urlParam){
      encodedVal = encodeUriSegment(params[urlParam] || self.defaults[urlParam] || "");
      url = url.replace(new RegExp(":" + urlParam + "(\\W)"), encodedVal + "$1");
    });
    url = url.replace(/\/?#$/, '');
    var query = [];
    forEachSorted(params, function(value, key){
      if (!self.urlParams[key]) {
        query.push(encodeUriQuery(key) + '=' + encodeUriQuery(value));
      }
    });
    url = url.replace(/\/*$/, '');
    return url + (query.length ? '?' + query.join('&') : '');
  }
};

function ResourceFactory($http) {
  this.$http = $http;
}

ResourceFactory.DEFAULT_ACTIONS = {
  'get':    {method:'GET'},
  'save':   {method:'POST'},
  'query':  {method:'GET', isArray:true},
  'remove': {method:'DELETE'},
  'delete': {method:'DELETE'}
};

ResourceFactory.prototype = {
  route: function(url, paramDefaults, actions){
    var self = this;
    var route = new Route(url);
    actions = extend({}, ResourceFactory.DEFAULT_ACTIONS, actions);
    function extractParams(data){
      var ids = {};
      forEach(paramDefaults || {}, function(value, key){
        ids[key] = value.charAt && value.charAt(0) == '@' ? getter(data, value.substr(1)) : value;
      });
      return ids;
    }

    function Resource(value){
      copy(value || {}, this);
    }

    forEach(actions, function(action, name){
      var isPostOrPut = action.method == 'POST' || action.method == 'PUT';
      Resource[name] = function(a1, a2, a3, a4) {
        var params = {};
        var data;
        var success = noop;
        var error = null;
        switch(arguments.length) {
        case 4:
          error = a4;
          success = a3;
          //fallthrough
        case 3:
        case 2:
          if (isFunction(a2)) {
            if (isFunction(a1)) {
              success = a1;
              error = a2;
              break;
            }

            success = a2;
            error = a3;
            //fallthrough
          } else {
            params = a1;
            data = a2;
            success = a3;
            break;
          }
        case 1:
          if (isFunction(a1)) success = a1;
          else if (isPostOrPut) data = a1;
          else params = a1;
          break;
        case 0: break;
        default:
          throw "Expected between 0-4 arguments [params, data, success, error], got " +
            arguments.length + " arguments.";
        }

        var value = this instanceof Resource ? this : (action.isArray ? [] : new Resource(data));
        self.$http({
          method: action.method,
          url: route.url(extend({}, extractParams(data), action.params || {}, params)),
          data: data
        }).then(function(response) {
            var data = response.data;

            if (data) {
              if (action.isArray) {
                value.length = 0;
                forEach(data, function(item) {
                  value.push(new Resource(item));
                });
              } else {
                copy(data, value);
              }
            }
            (success||noop)(value, response.headers);
          }, error);

        return value;
      };

      Resource.bind = function(additionalParamDefaults){
        return self.route(url, extend({}, paramDefaults, additionalParamDefaults), actions);
      };

      Resource.prototype['$' + name] = function(a1, a2, a3) {
        var params = extractParams(this),
            success = noop,
            error;

        switch(arguments.length) {
        case 3: params = a1; success = a2; error = a3; break;
        case 2:
        case 1:
          if (isFunction(a1)) {
            success = a1;
            error = a2;
          } else {
            params = a1;
            success = a2 || noop;
          }
        case 0: break;
        default:
          throw "Expected between 1-3 arguments [params, success, error], got " +
            arguments.length + " arguments.";
        }
        var data = isPostOrPut ? this : undefined;
        Resource[name].call(this, params, data, success, error);
      };
    });
    return Resource;
  }
};

/*
 * HTML Parser By Misko Hevery (misko@hevery.com)
 * based on:  HTML Parser By John Resig (ejohn.org)
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 *
 * // Use like so:
 * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 */

// Regular Expressions for parsing tags and attributes
var START_TAG_REGEXP = /^<\s*([\w:-]+)((?:\s+[\w:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*>/,
  END_TAG_REGEXP = /^<\s*\/\s*([\w:-]+)[^>]*>/,
  ATTR_REGEXP = /([\w:-]+)(?:\s*=\s*(?:(?:"((?:[^"])*)")|(?:'((?:[^'])*)')|([^>\s]+)))?/g,
  BEGIN_TAG_REGEXP = /^</,
  BEGING_END_TAGE_REGEXP = /^<\s*\//,
  COMMENT_REGEXP = /<!--(.*?)-->/g,
  CDATA_REGEXP = /<!\[CDATA\[(.*?)]]>/g,
  URI_REGEXP = /^((ftp|https?):\/\/|mailto:|#)/,
  NON_ALPHANUMERIC_REGEXP = /([^\#-~| |!])/g; // Match everything outside of normal chars and " (quote character)


// Good source of info about elements and attributes
// http://dev.w3.org/html5/spec/Overview.html#semantics
// http://simon.html5.org/html-elements

// Safe Void Elements - HTML5
// http://dev.w3.org/html5/spec/Overview.html#void-elements
var voidElements = makeMap("area,br,col,hr,img,wbr");

// Elements that you can, intentionally, leave open (and which close themselves)
// http://dev.w3.org/html5/spec/Overview.html#optional-tags
var optionalEndTagBlockElements = makeMap("colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr"),
    optionalEndTagInlineElements = makeMap("rp,rt"),
    optionalEndTagElements = extend({}, optionalEndTagInlineElements, optionalEndTagBlockElements);

// Safe Block Elements - HTML5
var blockElements = extend({}, optionalEndTagBlockElements, makeMap("address,article,aside," +
        "blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,h6," +
        "header,hgroup,hr,ins,map,menu,nav,ol,pre,script,section,table,ul"));

// Inline Elements - HTML5
var inlineElements = extend({}, optionalEndTagInlineElements, makeMap("a,abbr,acronym,b,bdi,bdo," +
        "big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s,samp,small," +
        "span,strike,strong,sub,sup,time,tt,u,var"));


// Special Elements (can contain anything)
var specialElements = makeMap("script,style");

var validElements = extend({}, voidElements, blockElements, inlineElements, optionalEndTagElements);

//Attributes that have href and hence need to be sanitized
var uriAttrs = makeMap("background,cite,href,longdesc,src,usemap");
var validAttrs = extend({}, uriAttrs, makeMap(
    'abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,'+
    'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,'+
    'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,'+
    'scope,scrolling,shape,span,start,summary,target,title,type,'+
    'valign,value,vspace,width'));

/**
 * @example
 * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 * @param {string} html string
 * @param {object} handler
 */
function htmlParser( html, handler ) {
  var index, chars, match, stack = [], last = html;
  stack.last = function() { return stack[ stack.length - 1 ]; };

  while ( html ) {
    chars = true;

    // Make sure we're not in a script or style element
    if ( !stack.last() || !specialElements[ stack.last() ] ) {

      // Comment
      if ( html.indexOf("<!--") === 0 ) {
        index = html.indexOf("-->");

        if ( index >= 0 ) {
          if (handler.comment) handler.comment( html.substring( 4, index ) );
          html = html.substring( index + 3 );
          chars = false;
        }

      // end tag
      } else if ( BEGING_END_TAGE_REGEXP.test(html) ) {
        match = html.match( END_TAG_REGEXP );

        if ( match ) {
          html = html.substring( match[0].length );
          match[0].replace( END_TAG_REGEXP, parseEndTag );
          chars = false;
        }

      // start tag
      } else if ( BEGIN_TAG_REGEXP.test(html) ) {
        match = html.match( START_TAG_REGEXP );

        if ( match ) {
          html = html.substring( match[0].length );
          match[0].replace( START_TAG_REGEXP, parseStartTag );
          chars = false;
        }
      }

      if ( chars ) {
        index = html.indexOf("<");

        var text = index < 0 ? html : html.substring( 0, index );
        html = index < 0 ? "" : html.substring( index );

        if (handler.chars) handler.chars( decodeEntities(text) );
      }

    } else {
      html = html.replace(new RegExp("(.*)<\\s*\\/\\s*" + stack.last() + "[^>]*>", 'i'), function(all, text){
        text = text.
          replace(COMMENT_REGEXP, "$1").
          replace(CDATA_REGEXP, "$1");

        if (handler.chars) handler.chars( decodeEntities(text) );

        return "";
      });

      parseEndTag( "", stack.last() );
    }

    if ( html == last ) {
      throw "Parse Error: " + html;
    }
    last = html;
  }

  // Clean up any remaining tags
  parseEndTag();

  function parseStartTag( tag, tagName, rest, unary ) {
    tagName = lowercase(tagName);
    if ( blockElements[ tagName ] ) {
      while ( stack.last() && inlineElements[ stack.last() ] ) {
        parseEndTag( "", stack.last() );
      }
    }

    if ( optionalEndTagElements[ tagName ] && stack.last() == tagName ) {
      parseEndTag( "", tagName );
    }

    unary = voidElements[ tagName ] || !!unary;

    if ( !unary )
      stack.push( tagName );

    var attrs = {};

    rest.replace(ATTR_REGEXP, function(match, name, doubleQuotedValue, singleQoutedValue, unqoutedValue) {
      var value = doubleQuotedValue
        || singleQoutedValue
        || unqoutedValue
        || '';

      attrs[name] = decodeEntities(value);
    });
    if (handler.start) handler.start( tagName, attrs, unary );
  }

  function parseEndTag( tag, tagName ) {
    var pos = 0, i;
    tagName = lowercase(tagName);
    if ( tagName )
      // Find the closest opened tag of the same type
      for ( pos = stack.length - 1; pos >= 0; pos-- )
        if ( stack[ pos ] == tagName )
          break;

    if ( pos >= 0 ) {
      // Close all the open elements, up the stack
      for ( i = stack.length - 1; i >= pos; i-- )
        if (handler.end) handler.end( stack[ i ] );

      // Remove the open elements from the stack
      stack.length = pos;
    }
  }
}

/**
 * decodes all entities into regular string
 * @param value
 * @returns {string} A string with decoded entities.
 */
var hiddenPre=document.createElement("pre");
function decodeEntities(value) {
  hiddenPre.innerHTML=value.replace(/</g,"&lt;");
  return hiddenPre.innerText || hiddenPre.textContent || '';
}

/**
 * Escapes all potentially dangerous characters, so that the
 * resulting string can be safely inserted into attribute or
 * element text.
 * @param value
 * @returns escaped text
 */
function encodeEntities(value) {
  return value.
    replace(/&/g, '&amp;').
    replace(NON_ALPHANUMERIC_REGEXP, function(value){
      return '&#' + value.charCodeAt(0) + ';';
    }).
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;');
}

/**
 * create an HTML/XML writer which writes to buffer
 * @param {Array} buf use buf.jain('') to get out sanitized html string
 * @returns {object} in the form of {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * }
 */
function htmlSanitizeWriter(buf){
  var ignore = false;
  var out = bind(buf, buf.push);
  return {
    start: function(tag, attrs, unary){
      tag = lowercase(tag);
      if (!ignore && specialElements[tag]) {
        ignore = tag;
      }
      if (!ignore && validElements[tag] == true) {
        out('<');
        out(tag);
        forEach(attrs, function(value, key){
          var lkey=lowercase(key);
          if (validAttrs[lkey]==true && (uriAttrs[lkey]!==true || value.match(URI_REGEXP))) {
            out(' ');
            out(key);
            out('="');
            out(encodeEntities(value));
            out('"');
          }
        });
        out(unary ? '/>' : '>');
      }
    },
    end: function(tag){
        tag = lowercase(tag);
        if (!ignore && validElements[tag] == true) {
          out('</');
          out(tag);
          out('>');
        }
        if (tag == ignore) {
          ignore = false;
        }
      },
    chars: function(chars){
        if (!ignore) {
          out(encodeEntities(chars));
        }
      }
  };
}

//////////////////////////////////
//JQLite
//////////////////////////////////

/**
 * @ngdoc function
 * @name angular.element
 * @function
 *
 * @description
 * Wraps a raw DOM element or HTML string as a [jQuery](http://jquery.com) element.
 * `angular.element` can be either an alias for [jQuery](http://api.jquery.com/jQuery/) function, if
 * jQuery is available, or a function that wraps the element or string in Angular's jQuery lite
 * implementation (commonly referred to as jqLite).
 *
 * Real jQuery always takes precedence over jqLite, provided it was loaded before `DOMContentLoaded`
 * event fired.
 *
 * jqLite is a tiny, API-compatible subset of jQuery that allows
 * Angular to manipulate the DOM. jqLite implements only the most commonly needed functionality
 * within a very small footprint, so only a subset of the jQuery API - methods, arguments and
 * invocation styles - are supported.
 *
 * Note: All element references in Angular are always wrapped with jQuery or jqLite; they are never
 * raw DOM references.
 *
 * ## Angular's jQuery lite provides the following methods:
 *
 * - [addClass()](http://api.jquery.com/addClass/)
 * - [after()](http://api.jquery.com/after/)
 * - [append()](http://api.jquery.com/append/)
 * - [attr()](http://api.jquery.com/attr/)
 * - [bind()](http://api.jquery.com/bind/)
 * - [children()](http://api.jquery.com/children/)
 * - [clone()](http://api.jquery.com/clone/)
 * - [css()](http://api.jquery.com/css/)
 * - [data()](http://api.jquery.com/data/)
 * - [eq()](http://api.jquery.com/eq/)
 * - [find()](http://api.jquery.com/find/) - Limited to lookups by tag name.
 * - [hasClass()](http://api.jquery.com/hasClass/)
 * - [html()](http://api.jquery.com/html/)
 * - [next()](http://api.jquery.com/next/)
 * - [parent()](http://api.jquery.com/parent/)
 * - [prepend()](http://api.jquery.com/prepend/)
 * - [prop()](http://api.jquery.com/prop/)
 * - [ready()](http://api.jquery.com/ready/)
 * - [remove()](http://api.jquery.com/remove/)
 * - [removeAttr()](http://api.jquery.com/removeAttr/)
 * - [removeClass()](http://api.jquery.com/removeClass/)
 * - [removeData()](http://api.jquery.com/removeData/)
 * - [replaceWith()](http://api.jquery.com/replaceWith/)
 * - [text()](http://api.jquery.com/text/)
 * - [toggleClass()](http://api.jquery.com/toggleClass/)
 * - [unbind()](http://api.jquery.com/unbind/)
 * - [val()](http://api.jquery.com/val/)
 *
 * ## In addtion to the above, Angular privides an additional method to both jQuery and jQuery lite:
 *
 * - `scope()` - retrieves the current Angular scope of the element.
 * - `injector()` - retrieves the Angular injector associated with application that the element is
 *   part of.
 * - `inheritedData()` - same as `data()`, but walks up the DOM until a value is found or the top
 *   parent element is reached.
 *
 * @param {string|DOMElement} element HTML string or DOMElement to be wrapped into jQuery.
 * @returns {Object} jQuery object.
 */

var jqCache = {},
    jqName = 'ng-' + new Date().getTime(),
    jqId = 1,
    addEventListenerFn = (window.document.addEventListener
      ? function(element, type, fn) {element.addEventListener(type, fn, false);}
      : function(element, type, fn) {element.attachEvent('on' + type, fn);}),
    removeEventListenerFn = (window.document.removeEventListener
      ? function(element, type, fn) {element.removeEventListener(type, fn, false); }
      : function(element, type, fn) {element.detachEvent('on' + type, fn); });

function jqNextId() { return (jqId++); }


function getStyle(element) {
  var current = {}, style = element[0].style, value, name, i;
  if (typeof style.length == 'number') {
    for(i = 0; i < style.length; i++) {
      name = style[i];
      current[name] = style[name];
    }
  } else {
    for (name in style) {
      value = style[name];
      if (1*name != name && name != 'cssText' && value && typeof value == 'string' && value !='false')
        current[name] = value;
    }
  }
  return current;
}


/**
 * Converts dash-separated names to camelCase. Useful for dealing with css properties.
 */
function camelCase(name) {
  return name.replace(/\-(\w)/g, function(all, letter, offset){
    return (offset == 0 && letter == 'w') ? 'w' : letter.toUpperCase();
  });
}

/////////////////////////////////////////////
// jQuery mutation patch
//
//  In conjunction with bindJQuery intercepts all jQuery's DOM destruction apis and fires a
// $destroy event on all DOM nodes being removed.
//
/////////////////////////////////////////////

function JQLitePatchJQueryRemove(name, dispatchThis) {
  var originalJqFn = jQuery.fn[name];
  originalJqFn = originalJqFn.$original || originalJqFn;
  removePatch.$original = originalJqFn;
  jQuery.fn[name] = removePatch;

  function removePatch() {
    var list = [this],
        fireEvent = dispatchThis,
        set, setIndex, setLength,
        element, childIndex, childLength, children,
        fns, data;

    while(list.length) {
      set = list.shift();
      for(setIndex = 0, setLength = set.length; setIndex < setLength; setIndex++) {
        element = jqLite(set[setIndex]);
        if (fireEvent) {
          data = element.data('events');
          if ( (fns = data && data.$destroy) ) {
            forEach(fns, function(fn){
              fn.handler();
            });
          }
        } else {
          fireEvent = !fireEvent;
        }
        for(childIndex = 0, childLength = (children = element.children()).length;
            childIndex < childLength;
            childIndex++) {
          list.push(jQuery(children[childIndex]));
        }
      }
    }
    return originalJqFn.apply(this, arguments);
  }
}

/////////////////////////////////////////////
function jqLiteWrap(element) {
  if (isString(element) && element.charAt(0) != '<') {
    throw new Error('selectors not implemented');
  }
  return new JQLite(element);
}

function JQLite(element) {
  if (element instanceof JQLite) {
    return element;
  } else if (isString(element)) {
    var div = document.createElement('div');
    // Read about the NoScope elements here:
    // http://msdn.microsoft.com/en-us/library/ms533897(VS.85).aspx
    div.innerHTML = '<div>&nbsp;</div>' + element; // IE insanity to make NoScope elements work!
    div.removeChild(div.firstChild); // remove the superfluous div
    JQLiteAddNodes(this, div.childNodes);
    this.remove(); // detach the elements from the temporary DOM div.
  } else {
    JQLiteAddNodes(this, element);
  }
}

function JQLiteClone(element) {
  return element.cloneNode(true);
}

function JQLiteDealoc(element){
  JQLiteRemoveData(element);
  for ( var i = 0, children = element.childNodes || []; i < children.length; i++) {
    JQLiteDealoc(children[i]);
  }
}

function JQLiteRemoveData(element) {
  var cacheId = element[jqName],
  cache = jqCache[cacheId];
  if (cache) {
    if (cache.bind) {
      forEach(cache.bind, function(fn, type){
        if (type == '$destroy') {
          fn({});
        } else {
          removeEventListenerFn(element, type, fn);
        }
      });
    }
    delete jqCache[cacheId];
    element[jqName] = undefined; // ie does not allow deletion of attributes on elements.
  }
}

function JQLiteData(element, key, value) {
  var cacheId = element[jqName],
      cache = jqCache[cacheId || -1];
  if (isDefined(value)) {
    if (!cache) {
      element[jqName] = cacheId = jqNextId();
      cache = jqCache[cacheId] = {};
    }
    cache[key] = value;
  } else {
    return cache ? cache[key] : null;
  }
}

function JQLiteHasClass(element, selector) {
  return ((" " + element.className + " ").replace(/[\n\t]/g, " ").
      indexOf( " " + selector + " " ) > -1);
}

function JQLiteRemoveClass(element, selector) {
  if (selector) {
    forEach(selector.split(' '), function(cssClass) {
      element.className = trim(
          (" " + element.className + " ")
          .replace(/[\n\t]/g, " ")
          .replace(" " + trim(cssClass) + " ", " ")
      );
    });
  }
}

function JQLiteAddClass(element, selector) {
  if (selector) {
    forEach(selector.split(' '), function(cssClass) {
      if (!JQLiteHasClass(element, cssClass)) {
        element.className = trim(element.className + ' ' + trim(cssClass));
      }
    });
  }
}

function JQLiteAddNodes(root, elements) {
  if (elements) {
    elements = (!elements.nodeName && isDefined(elements.length) && !isWindow(elements))
      ? elements
      : [ elements ];
    for(var i=0; i < elements.length; i++) {
      root.push(elements[i]);
    }
  }
}

//////////////////////////////////////////
// Functions which are declared directly.
//////////////////////////////////////////
var JQLitePrototype = JQLite.prototype = {
  ready: function(fn) {
    var fired = false;

    function trigger() {
      if (fired) return;
      fired = true;
      fn();
    }

    this.bind('DOMContentLoaded', trigger); // works for modern browsers and IE9
    // we can not use jqLite since we are not done loading and jQuery could be loaded later.
    jqLiteWrap(window).bind('load', trigger); // fallback to window.onload for others
  },
  toString: function() {
    var value = [];
    forEach(this, function(e){ value.push('' + e);});
    return '[' + value.join(', ') + ']';
  },

  eq: function(index) {
      return (index >= 0) ? jqLite(this[index]) : jqLite(this[this.length + index]);
  },

  length: 0,
  push: push,
  sort: [].sort,
  splice: [].splice
};

//////////////////////////////////////////
// Functions iterating getter/setters.
// these functions return self on setter and
// value on get.
//////////////////////////////////////////
var BOOLEAN_ATTR = {};
forEach('multiple,selected,checked,disabled,readOnly,required'.split(','), function(value) {
  BOOLEAN_ATTR[lowercase(value)] = value;
});

forEach({
  data: JQLiteData,
  inheritedData: function(element, name, value) {
    element = jqLite(element);
    while (element.length) {
      if (value = element.data(name)) return value;
      element = element.parent();
    }
  },

  scope: function(element) {
    return jqLite(element).inheritedData($$scope);
  },

  injector: function(element) {
      return jqLite(element).inheritedData('$injector');
  },

  removeAttr: function(element,name) {
    element.removeAttribute(name);
  },

  hasClass: JQLiteHasClass,

  css: function(element, name, value) {
    name = camelCase(name);

    if (isDefined(value)) {
      element.style[name] = value;
    } else {
      var val;

      if (msie <= 8) {
        // this is some IE specific weirdness that jQuery 1.6.4 does not sure why
        val = element.currentStyle && element.currentStyle[name];
        if (val === '') val = 'auto';
      }

      val = val || element.style[name];

      if (msie <= 8) {
        // jquery weirdness :-/
        val = (val === '') ? undefined : val;
      }

      return  val;
    }
  },

  attr: function(element, name, value){
    var lowercasedName = lowercase(name);
    if (BOOLEAN_ATTR[lowercasedName]) {
      if (isDefined(value)) {
        if (!!value) {
          element[name] = true;
          element.setAttribute(name, lowercasedName);
        } else {
          element[name] = false;
          element.removeAttribute(lowercasedName);
        }
      } else {
        return (element[name] ||
                 element.getAttribute(name) !== null &&
                 (msie < 9 ? element.getAttribute(name) !== '' : true))
               ? lowercasedName
               : undefined;
      }
    } else if (isDefined(value)) {
      element.setAttribute(name, value);
    } else if (element.getAttribute) {
      // the extra argument "2" is to get the right thing for a.href in IE, see jQuery code
      // some elements (e.g. Document) don't have get attribute, so return undefined
      var ret = element.getAttribute(name, 2);
      // normalize non-existing attributes to undefined (as jQuery)
      return ret === null ? undefined : ret;
    }
  },

  prop: function(element, name, value) {
    if (isDefined(value)) {
      element[name] = value;
    } else {
      return element[name];
    }
  },

  text: extend((msie < 9)
      ? function(element, value) {
        // NodeType == 3 is text node
        if (element.nodeType == 3) {
          if (isUndefined(value))
            return element.nodeValue;
          element.nodeValue = value;
        } else {
          if (isUndefined(value))
            return element.innerText;
          element.innerText = value;
        }
      }
      : function(element, value) {
        if (isUndefined(value)) {
          return element.textContent;
        }
        element.textContent = value;
      }, {$dv:''}),

  val: function(element, value) {
    if (isUndefined(value)) {
      return element.value;
    }
    element.value = value;
  },

  html: function(element, value) {
    if (isUndefined(value)) {
      return element.innerHTML;
    }
    for (var i = 0, childNodes = element.childNodes; i < childNodes.length; i++) {
      JQLiteDealoc(childNodes[i]);
    }
    element.innerHTML = value;
  }
}, function(fn, name){
  /**
   * Properties: writes return selection, reads return first value
   */
  JQLite.prototype[name] = function(arg1, arg2) {
    var i, key;

    // JQLiteHasClass has only two arguments, but is a getter-only fn, so we need to special-case it
    // in a way that survives minification.
    if (((fn.length == 2 && fn !== JQLiteHasClass) ? arg1 : arg2) === undefined) {
      if (isObject(arg1)) {
        // we are a write, but the object properties are the key/values
        for(i=0; i < this.length; i++) {
          for (key in arg1) {
            fn(this[i], key, arg1[key]);
          }
        }
        // return self for chaining
        return this;
      } else {
        // we are a read, so read the first child.
        if (this.length)
          return fn(this[0], arg1, arg2);
      }
    } else {
      // we are a write, so apply to all children
      for(i=0; i < this.length; i++) {
        fn(this[i], arg1, arg2);
      }
      // return self for chaining
      return this;
    }
    return fn.$dv;
  };
});

//////////////////////////////////////////
// Functions iterating traversal.
// These functions chain results into a single
// selector.
//////////////////////////////////////////
forEach({
  removeData: JQLiteRemoveData,

  dealoc: JQLiteDealoc,

  bind: function(element, type, fn){
    var bind = JQLiteData(element, 'bind');
    if (!bind) JQLiteData(element, 'bind', bind = {});
    forEach(type.split(' '), function(type){
      var eventHandler = bind[type];
      if (!eventHandler) {
        bind[type] = eventHandler = function(event) {
          if (!event.preventDefault) {
            event.preventDefault = function() {
              event.returnValue = false; //ie
            };
          }
          if (!event.stopPropagation) {
            event.stopPropagation = function() {
              event.cancelBubble = true; //ie
            };
          }
          if (!event.target) {
            event.target = event.srcElement || document;
          }

          if (isUndefined(event.defaultPrevented)) {
            var prevent = event.preventDefault;
            event.preventDefault = function() {
              event.defaultPrevented = true;
              prevent.call(event);
            };
            event.defaultPrevented = false;
          }

          event.isDefaultPrevented = function() {
            return event.defaultPrevented;
          };

          forEach(eventHandler.fns, function(fn){
            fn.call(element, event);
          });
        };
        eventHandler.fns = [];
        addEventListenerFn(element, type, eventHandler);
      }
      eventHandler.fns.push(fn);
    });
  },

  unbind: function(element, type, fn) {
    var bind = JQLiteData(element, 'bind');
    if (!bind) return; //no listeners registered

    if (isUndefined(type)) {
      forEach(bind, function(eventHandler, type) {
        removeEventListenerFn(element, type, eventHandler);
        delete bind[type];
      });
    } else {
      if (isUndefined(fn)) {
        removeEventListenerFn(element, type, bind[type]);
        delete bind[type];
      } else {
        arrayRemove(bind[type].fns, fn);
      }
    }
  },

  replaceWith: function(element, replaceNode) {
    var index, parent = element.parentNode;
    JQLiteDealoc(element);
    forEach(new JQLite(replaceNode), function(node){
      if (index) {
        parent.insertBefore(node, index.nextSibling);
      } else {
        parent.replaceChild(node, element);
      }
      index = node;
    });
  },

  children: function(element) {
    var children = [];
    forEach(element.childNodes, function(element){
      if (element.nodeName != '#text')
        children.push(element);
    });
    return children;
  },

  append: function(element, node) {
    forEach(new JQLite(node), function(child){
      if (element.nodeType === 1)
        element.appendChild(child);
    });
  },

  prepend: function(element, node) {
    if (element.nodeType === 1) {
      var index = element.firstChild;
      forEach(new JQLite(node), function(child){
        if (index) {
          element.insertBefore(child, index);
        } else {
          element.appendChild(child);
          index = child;
        }
      });
    }
  },

  remove: function(element) {
    JQLiteDealoc(element);
    var parent = element.parentNode;
    if (parent) parent.removeChild(element);
  },

  after: function(element, newElement) {
    var index = element, parent = element.parentNode;
    forEach(new JQLite(newElement), function(node){
      parent.insertBefore(node, index.nextSibling);
      index = node;
    });
  },

  addClass: JQLiteAddClass,
  removeClass: JQLiteRemoveClass,

  toggleClass: function(element, selector, condition) {
    if (isUndefined(condition)) {
      condition = !JQLiteHasClass(element, selector);
    }
    (condition ? JQLiteAddClass : JQLiteRemoveClass)(element, selector);
  },

  parent: function(element) {
    var parent = element.parentNode;
    return parent && parent.nodeType !== 11 ? parent : null;
  },

  next: function(element) {
    return element.nextSibling;
  },

  find: function(element, selector) {
    return element.getElementsByTagName(selector);
  },

  clone: JQLiteClone
}, function(fn, name){
  /**
   * chaining functions
   */
  JQLite.prototype[name] = function(arg1, arg2) {
    var value;
    for(var i=0; i < this.length; i++) {
      if (value == undefined) {
        value = fn(this[i], arg1, arg2);
        if (value !== undefined) {
          // any function which returns a value needs to be wrapped
          value = jqLite(value);
        }
      } else {
        JQLiteAddNodes(value, fn(this[i], arg1, arg2));
      }
    }
    return value == undefined ? this : value;
  };
});

/**
 * Computes a hash of an 'obj'.
 * Hash of a:
 *  string is string
 *  number is number as string
 *  object is either result of calling $$hashKey function on the object or uniquely generated id,
 *         that is also assigned to the $$hashKey property of the object.
 *
 * @param obj
 * @returns {string} hash string such that the same input will have the same hash string.
 *         The resulting string key is in 'type:hashKey' format.
 */
function hashKey(obj) {
  var objType = typeof obj,
      key;

  if (objType == 'object' && obj !== null) {
    if (typeof (key = obj.$$hashKey) == 'function') {
      // must invoke on object to keep the right this
      key = obj.$$hashKey();
    } else if (key === undefined) {
      key = obj.$$hashKey = nextUid();
    }
  } else {
    key = obj;
  }

  return objType + ':' + key;
}

/**
 * HashMap which can use objects as keys
 */
function HashMap(array){
  forEach(array, this.put, this);
}
HashMap.prototype = {
  /**
   * Store key value pair
   * @param key key to store can be any type
   * @param value value to store can be any type
   */
  put: function(key, value) {
    this[hashKey(key)] = value;
  },

  /**
   * @param key
   * @returns the value for the key
   */
  get: function(key) {
    return this[hashKey(key)];
  },

  /**
   * Remove the key/value pair
   * @param key
   */
  remove: function(key) {
    var value = this[key = hashKey(key)];
    delete this[key];
    return value;
  }
};

/**
 * A map where multiple values can be added to the same key such that they form a queue.
 * @returns {HashQueueMap}
 */
function HashQueueMap() {}
HashQueueMap.prototype = {
  /**
   * Same as array push, but using an array as the value for the hash
   */
  push: function(key, value) {
    var array = this[key = hashKey(key)];
    if (!array) {
      this[key] = [value];
    } else {
      array.push(value);
    }
  },

  /**
   * Same as array shift, but using an array as the value for the hash
   */
  shift: function(key) {
    var array = this[key = hashKey(key)];
    if (array) {
      if (array.length == 1) {
        delete this[key];
        return array[0];
      } else {
        return array.shift();
      }
    }
  }
};
/**
 * @ngdoc function
 * @name angular.module.ng.$anchorScroll
 * @requires $window
 * @requires $location
 * @requires $rootScope
 *
 * @description
 * When called, it checks current value of `$location.hash()` and scroll to related element,
 * according to rules specified in
 * {@link http://dev.w3.org/html5/spec/Overview.html#the-indicated-part-of-the-document Html5 spec}.
 *
 * It also watches the `$location.hash()` and scroll whenever it changes to match any anchor.
 * This can be disabled by calling `$anchorScrollProvider.disableAutoScrolling()`.
 */
function $AnchorScrollProvider() {

  var autoScrollingEnabled = true;

  this.disableAutoScrolling = function() {
    autoScrollingEnabled = false;
  };

  this.$get = ['$window', '$location', '$rootScope', function($window, $location, $rootScope) {
    var document = $window.document;

    // helper function to get first anchor from a NodeList
    // can't use filter.filter, as it accepts only instances of Array
    // and IE can't convert NodeList to an array using [].slice
    // TODO(vojta): use filter if we change it to accept lists as well
    function getFirstAnchor(list) {
      var result = null;
      forEach(list, function(element) {
        if (!result && lowercase(element.nodeName) === 'a') result = element;
      });
      return result;
    }

    function scroll() {
      var hash = $location.hash(), elm;

      // empty hash, scroll to the top of the page
      if (!hash) $window.scrollTo(0, 0);

      // element with given id
      else if ((elm = document.getElementById(hash))) elm.scrollIntoView();

      // first anchor with given name :-D
      else if ((elm = getFirstAnchor(document.getElementsByName(hash)))) elm.scrollIntoView();

      // no element and hash == 'top', scroll to the top of the page
      else if (hash === 'top') $window.scrollTo(0, 0);
    }

    // does not scroll when user clicks on anchor link that is currently on
    // (no url change, no $locaiton.hash() change), browser native does scroll
    if (autoScrollingEnabled) {
      $rootScope.$watch(function() {return $location.hash();}, function() {
        $rootScope.$evalAsync(scroll);
      });
    }

    return scroll;
  }];
}

/**
 * @ngdoc object
 * @name angular.module.ng.$browser
 * @requires $log
 * @description
 * This object has two goals:
 *
 * - hide all the global state in the browser caused by the window object
 * - abstract away all the browser specific features and inconsistencies
 *
 * For tests we provide {@link angular.module.ngMock.$browser mock implementation} of the `$browser`
 * service, which can be used for convenient testing of the application without the interaction with
 * the real browser apis.
 */
/**
 * @param {object} window The global window object.
 * @param {object} document jQuery wrapped document.
 * @param {object} body jQuery wrapped document.body.
 * @param {function()} XHR XMLHttpRequest constructor.
 * @param {object} $log console.log or an object with the same interface.
 * @param {object} $sniffer $sniffer service
 */
function Browser(window, document, body, $log, $sniffer) {
  var self = this,
      rawDocument = document[0],
      location = window.location,
      history = window.history,
      setTimeout = window.setTimeout,
      clearTimeout = window.clearTimeout,
      pendingDeferIds = {};

  self.isMock = false;

  var outstandingRequestCount = 0;
  var outstandingRequestCallbacks = [];

  // TODO(vojta): remove this temporary api
  self.$$completeOutstandingRequest = completeOutstandingRequest;
  self.$$incOutstandingRequestCount = function() { outstandingRequestCount++; };

  /**
   * Executes the `fn` function(supports currying) and decrements the `outstandingRequestCallbacks`
   * counter. If the counter reaches 0, all the `outstandingRequestCallbacks` are executed.
   */
  function completeOutstandingRequest(fn) {
    try {
      fn.apply(null, sliceArgs(arguments, 1));
    } finally {
      outstandingRequestCount--;
      if (outstandingRequestCount === 0) {
        while(outstandingRequestCallbacks.length) {
          try {
            outstandingRequestCallbacks.pop()();
          } catch (e) {
            $log.error(e);
          }
        }
      }
    }
  }

  /**
   * @private
   * Note: this method is used only by scenario runner
   * TODO(vojta): prefix this method with $$ ?
   * @param {function()} callback Function that will be called when no outstanding request
   */
  self.notifyWhenNoOutstandingRequests = function(callback) {
    // force browser to execute all pollFns - this is needed so that cookies and other pollers fire
    // at some deterministic time in respect to the test runner's actions. Leaving things up to the
    // regular poller would result in flaky tests.
    forEach(pollFns, function(pollFn){ pollFn(); });

    if (outstandingRequestCount === 0) {
      callback();
    } else {
      outstandingRequestCallbacks.push(callback);
    }
  };

  //////////////////////////////////////////////////////////////
  // Poll Watcher API
  //////////////////////////////////////////////////////////////
  var pollFns = [],
      pollTimeout;

  /**
   * @ngdoc method
   * @name angular.module.ng.$browser#addPollFn
   * @methodOf angular.module.ng.$browser
   *
   * @param {function()} fn Poll function to add
   *
   * @description
   * Adds a function to the list of functions that poller periodically executes,
   * and starts polling if not started yet.
   *
   * @returns {function()} the added function
   */
  self.addPollFn = function(fn) {
    if (isUndefined(pollTimeout)) startPoller(100, setTimeout);
    pollFns.push(fn);
    return fn;
  };

  /**
   * @param {number} interval How often should browser call poll functions (ms)
   * @param {function()} setTimeout Reference to a real or fake `setTimeout` function.
   *
   * @description
   * Configures the poller to run in the specified intervals, using the specified
   * setTimeout fn and kicks it off.
   */
  function startPoller(interval, setTimeout) {
    (function check() {
      forEach(pollFns, function(pollFn){ pollFn(); });
      pollTimeout = setTimeout(check, interval);
    })();
  }

  //////////////////////////////////////////////////////////////
  // URL API
  //////////////////////////////////////////////////////////////

  var lastBrowserUrl = location.href;

  /**
   * @ngdoc method
   * @name angular.module.ng.$browser#url
   * @methodOf angular.module.ng.$browser
   *
   * @description
   * GETTER:
   * Without any argument, this method just returns current value of location.href.
   *
   * SETTER:
   * With at least one argument, this method sets url to new value.
   * If html5 history api supported, pushState/replaceState is used, otherwise
   * location.href/location.replace is used.
   * Returns its own instance to allow chaining
   *
   * NOTE: this api is intended for use only by the $location service. Please use the
   * {@link angular.module.ng.$location $location service} to change url.
   *
   * @param {string} url New url (when used as setter)
   * @param {boolean=} replace Should new url replace current history record ?
   */
  self.url = function(url, replace) {
    // setter
    if (url) {
      lastBrowserUrl = url;
      if ($sniffer.history) {
        if (replace) history.replaceState(null, '', url);
        else history.pushState(null, '', url);
      } else {
        if (replace) location.replace(url);
        else location.href = url;
      }
      return self;
    // getter
    } else {
      return location.href;
    }
  };

  var urlChangeListeners = [],
      urlChangeInit = false;

  function fireUrlChange() {
    if (lastBrowserUrl == self.url()) return;

    lastBrowserUrl = self.url();
    forEach(urlChangeListeners, function(listener) {
      listener(self.url());
    });
  }

  /**
   * @ngdoc method
   * @name angular.module.ng.$browser#onUrlChange
   * @methodOf angular.module.ng.$browser
   * @TODO(vojta): refactor to use node's syntax for events
   *
   * @description
   * Register callback function that will be called, when url changes.
   *
   * It's only called when the url is changed by outside of angular:
   * - user types different url into address bar
   * - user clicks on history (forward/back) button
   * - user clicks on a link
   *
   * It's not called when url is changed by $browser.url() method
   *
   * The listener gets called with new url as parameter.
   *
   * NOTE: this api is intended for use only by the $location service. Please use the
   * {@link angular.module.ng.$location $location service} to monitor url changes in angular apps.
   *
   * @param {function(string)} listener Listener function to be called when url changes.
   * @return {function(string)} Returns the registered listener fn - handy if the fn is anonymous.
   */
  self.onUrlChange = function(callback) {
    if (!urlChangeInit) {
      // We listen on both (hashchange/popstate) when available, as some browsers (e.g. Opera)
      // don't fire popstate when user change the address bar and don't fire hashchange when url
      // changed by push/replaceState

      // html5 history api - popstate event
      if ($sniffer.history) jqLite(window).bind('popstate', fireUrlChange);
      // hashchange event
      if ($sniffer.hashchange) jqLite(window).bind('hashchange', fireUrlChange);
      // polling
      else self.addPollFn(fireUrlChange);

      urlChangeInit = true;
    }

    urlChangeListeners.push(callback);
    return callback;
  };

  //////////////////////////////////////////////////////////////
  // Cookies API
  //////////////////////////////////////////////////////////////
  var lastCookies = {};
  var lastCookieString = '';

  /**
   * @ngdoc method
   * @name angular.module.ng.$browser#cookies
   * @methodOf angular.module.ng.$browser
   *
   * @param {string=} name Cookie name
   * @param {string=} value Cokkie value
   *
   * @description
   * The cookies method provides a 'private' low level access to browser cookies.
   * It is not meant to be used directly, use the $cookie service instead.
   *
   * The return values vary depending on the arguments that the method was called with as follows:
   * <ul>
   *   <li>cookies() -> hash of all cookies, this is NOT a copy of the internal state, so do not modify it</li>
   *   <li>cookies(name, value) -> set name to value, if value is undefined delete the cookie</li>
   *   <li>cookies(name) -> the same as (name, undefined) == DELETES (no one calls it right now that way)</li>
   * </ul>
   *
   * @returns {Object} Hash of all cookies (if called without any parameter)
   */
  self.cookies = function(name, value) {
    var cookieLength, cookieArray, cookie, i, keyValue, index;

    if (name) {
      if (value === undefined) {
        rawDocument.cookie = escape(name) + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } else {
        if (isString(value)) {
          rawDocument.cookie = escape(name) + '=' + escape(value);

          cookieLength = name.length + value.length + 1;
          if (cookieLength > 4096) {
            $log.warn("Cookie '"+ name +"' possibly not set or overflowed because it was too large ("+
              cookieLength + " > 4096 bytes)!");
          }
          if (lastCookies.length > 20) {
            $log.warn("Cookie '"+ name +"' possibly not set or overflowed because too many cookies " +
              "were already set (" + lastCookies.length + " > 20 )");
          }
        }
      }
    } else {
      if (rawDocument.cookie !== lastCookieString) {
        lastCookieString = rawDocument.cookie;
        cookieArray = lastCookieString.split("; ");
        lastCookies = {};

        for (i = 0; i < cookieArray.length; i++) {
          cookie = cookieArray[i];
          index = cookie.indexOf('=');
          if (index > 0) { //ignore nameless cookies
            lastCookies[unescape(cookie.substring(0, index))] = unescape(cookie.substring(index + 1));
          }
        }
      }
      return lastCookies;
    }
  };


  /**
   * @ngdoc method
   * @name angular.module.ng.$browser#defer
   * @methodOf angular.module.ng.$browser
   * @param {function()} fn A function, who's execution should be defered.
   * @param {number=} [delay=0] of milliseconds to defer the function execution.
   * @returns {*} DeferId that can be used to cancel the task via `$browser.defer.cancel()`.
   *
   * @description
   * Executes a fn asynchroniously via `setTimeout(fn, delay)`.
   *
   * Unlike when calling `setTimeout` directly, in test this function is mocked and instead of using
   * `setTimeout` in tests, the fns are queued in an array, which can be programmatically flushed
   * via `$browser.defer.flush()`.
   *
   */
  self.defer = function(fn, delay) {
    var timeoutId;
    outstandingRequestCount++;
    timeoutId = setTimeout(function() {
      delete pendingDeferIds[timeoutId];
      completeOutstandingRequest(fn);
    }, delay || 0);
    pendingDeferIds[timeoutId] = true;
    return timeoutId;
  };


  /**
   * THIS DOC IS NOT VISIBLE because ngdocs can't process docs for foo#method.method
   *
   * @name angular.module.ng.$browser#defer.cancel
   * @methodOf angular.module.ng.$browser.defer
   *
   * @description
   * Cancels a defered task identified with `deferId`.
   *
   * @param {*} deferId Token returned by the `$browser.defer` function.
   * @returns {boolean} Returns `true` if the task hasn't executed yet and was successfuly canceled.
   */
  self.defer.cancel = function(deferId) {
    if (pendingDeferIds[deferId]) {
      delete pendingDeferIds[deferId];
      clearTimeout(deferId);
      completeOutstandingRequest(noop);
      return true;
    }
    return false;
  };


  //////////////////////////////////////////////////////////////
  // Misc API
  //////////////////////////////////////////////////////////////

  /**
   * @ngdoc method
   * @name angular.module.ng.$browser#addCss
   * @methodOf angular.module.ng.$browser
   *
   * @param {string} url Url to css file
   * @description
   * Adds a stylesheet tag to the head.
   */
  self.addCss = function(url) {
    var link = jqLite(rawDocument.createElement('link'));
    link.attr('rel', 'stylesheet');
    link.attr('type', 'text/css');
    link.attr('href', url);
    body.append(link);
  };


  /**
   * @ngdoc method
   * @name angular.module.ng.$browser#addJs
   * @methodOf angular.module.ng.$browser
   *
   * @param {string} url Url to js file
   *
   * @description
   * Adds a script tag to the head.
   */
  self.addJs = function(url, done) {
    // we can't use jQuery/jqLite here because jQuery does crazy shit with script elements, e.g.:
    // - fetches local scripts via XHR and evals them
    // - adds and immediately removes script elements from the document
    var script = rawDocument.createElement('script');

    script.type = 'text/javascript';
    script.src = url;

    if (msie) {
      script.onreadystatechange = function() {
        /loaded|complete/.test(script.readyState) && done && done();
      };
    } else {
      if (done) script.onload = script.onerror = done;
    }

    body[0].appendChild(script);

    return script;
  };

  /**
   * Returns current <base href>
   * (always relative - without domain)
   *
   * @returns {string=}
   */
  self.baseHref = function() {
    var href = document.find('base').attr('href');
    return href ? href.replace(/^https?\:\/\/[^\/]*/, '') : href;
  };
}

function $BrowserProvider(){
  this.$get = ['$window', '$log', '$sniffer', '$document',
      function( $window,   $log,   $sniffer,   $document){
        return new Browser($window, $document, $document.find('body'), $log, $sniffer);
      }];
}
/**
 * @ngdoc object
 * @name angular.module.ng.$cacheFactory
 *
 * @description
 * Factory that constructs cache objects.
 *
 *
 * @param {string} cacheId Name or id of the newly created cache.
 * @param {object=} options Options object that specifies the cache behavior. Properties:
 *
 *   - `{number=}` `capacity` ??? turns the cache into LRU cache.
 *
 * @returns {object} Newly created cache object with the following set of methods:
 *
 * - `{string}` `id()` ??? Returns id or name of the cache.
 * - `{number}` `size()` ??? Returns number of items currently in the cache
 * - `{void}` `put({string} key, {*} value)` ??? Puts a new key-value pair into the cache
 * - `{(*}} `get({string} key) ??? Returns cached value for `key` or undefined for cache miss.
 * - `{void}` `remove{string} key) ??? Removes a key-value pair from the cache.
 * - `{void}` `removeAll() ??? Removes all cached values.
 *
 */
function $CacheFactoryProvider() {

  this.$get = function() {
    var caches = {};

    function cacheFactory(cacheId, options) {
      if (cacheId in caches) {
        throw Error('cacheId ' + cacheId + ' taken');
      }

      var size = 0,
          stats = extend({}, options, {id: cacheId}),
          data = {},
          capacity = (options && options.capacity) || Number.MAX_VALUE,
          lruHash = {},
          freshEnd = null,
          staleEnd = null;

      return caches[cacheId] = {

        put: function(key, value) {
          var lruEntry = lruHash[key] || (lruHash[key] = {key: key});

          refresh(lruEntry);

          if (isUndefined(value)) return;
          if (!(key in data)) size++;
          data[key] = value;

          if (size > capacity) {
            this.remove(staleEnd.key);
          }
        },


        get: function(key) {
          var lruEntry = lruHash[key];

          if (!lruEntry) return;

          refresh(lruEntry);

          return data[key];
        },


        remove: function(key) {
          var lruEntry = lruHash[key];

          if (lruEntry == freshEnd) freshEnd = lruEntry.p;
          if (lruEntry == staleEnd) staleEnd = lruEntry.n;
          link(lruEntry.n,lruEntry.p);

          delete lruHash[key];
          delete data[key];
          size--;
        },


        removeAll: function() {
          data = {};
          size = 0;
          lruHash = {};
          freshEnd = staleEnd = null;
        },


        destroy: function() {
          data = null;
          stats = null;
          lruHash = null;
          delete caches[cacheId];
        },


        info: function() {
          return extend({}, stats, {size: size});
        }
      };


      /**
       * makes the `entry` the freshEnd of the LRU linked list
       */
      function refresh(entry) {
        if (entry != freshEnd) {
          if (!staleEnd) {
            staleEnd = entry;
          } else if (staleEnd == entry) {
            staleEnd = entry.n;
          }

          link(entry.n, entry.p);
          link(entry, freshEnd);
          freshEnd = entry;
          freshEnd.n = null;
        }
      }


      /**
       * bidirectionally links two entries of the LRU linked list
       */
      function link(nextEntry, prevEntry) {
        if (nextEntry != prevEntry) {
          if (nextEntry) nextEntry.p = prevEntry; //p stands for previous, 'prev' didn't minify
          if (prevEntry) prevEntry.n = nextEntry; //n stands for next, 'next' didn't minify
        }
      }
    }


    cacheFactory.info = function() {
      var info = {};
      forEach(caches, function(cache, cacheId) {
        info[cacheId] = cache.info();
      });
      return info;
    };


    cacheFactory.get = function(cacheId) {
      return caches[cacheId];
    };


    return cacheFactory;
  };
}

function $TemplateCacheProvider() {
  this.$get = ['$cacheFactory', function($cacheFactory) {
    return $cacheFactory('templates');
  }];
}

function $CompileProvider(){
  this.$get = ['$injector', '$exceptionHandler', '$textMarkup', '$attrMarkup', '$directive', '$widget',
    function(   $injector,   $exceptionHandler,   $textMarkup,   $attrMarkup,   $directive,   $widget){
      /**
       * Template provides directions an how to bind to a given element.
       * It contains a list of init functions which need to be called to
       * bind to a new instance of elements. It also provides a list
       * of child paths which contain child templates
       */
      function Template() {
        this.paths = [];
        this.children = [];
        this.linkFns = [];
        this.newScope = false;
      }

      Template.prototype = {
        link: function(element, scope) {
          var childScope = scope,
              locals = {$element: element};
          if (this.newScope) {
            childScope = isFunction(this.newScope) ? scope.$new(this.newScope(scope)) : scope.$new();
            element.data($$scope, childScope);
          }
          forEach(this.linkFns, function(fn) {
            try {
              if (isArray(fn) || fn.$inject) {
                $injector.invoke(fn, childScope, locals);
              } else {
                fn.call(childScope, element);
              }
            } catch (e) {
              $exceptionHandler(e);
            }
          });
          var i,
              childNodes = element[0].childNodes,
              children = this.children,
              paths = this.paths,
              length = paths.length;
          for (i = 0; i < length; i++) {
            // sometimes `element` can be modified by one of the linker functions in `this.linkFns`
            // and childNodes may be added or removed
            // TODO: element structure needs to be re-evaluated if new children added
            // if the childNode still exists
            if (childNodes[paths[i]])
              children[i].link(jqLite(childNodes[paths[i]]), childScope);
            else
              delete paths[i]; // if child no longer available, delete path
          }
        },


        addLinkFn:function(linkingFn) {
          if (linkingFn) {
            this.linkFns.push(linkingFn);
          }
        },


        addChild: function(index, template) {
          if (template) {
            this.paths.push(index);
            this.children.push(template);
          }
        },

        empty: function() {
          return this.linkFns.length === 0 && this.paths.length === 0;
        }
      };

      ///////////////////////////////////
      //Compiler
      //////////////////////////////////

      /**
       * @ngdoc function
       * @name angular.module.ng.$compile
       * @function
       *
       * @description
       * Compiles a piece of HTML string or DOM into a template and produces a template function, which
       * can then be used to link {@link angular.module.ng.$rootScope.Scope scope} and the template together.
       *
       * The compilation is a process of walking the DOM tree and trying to match DOM elements to
       * {@link angular.markup markup}, {@link angular.attrMarkup attrMarkup},
       * {@link angular.widget widgets}, and {@link angular.directive directives}. For each match it
       * executes corresponding markup, attrMarkup, widget or directive template function and collects the
       * instance functions into a single template function which is then returned.
       *
       * The template function can then be used once to produce the view or as it is the case with
       * {@link angular.widget.@ng:repeat repeater} many-times, in which case each call results in a view
       * that is a DOM clone of the original template.
       *
         <pre>
          angular.injector(['ng']).invoke(function($rootScope, $compile) {
            // Chose one:

            // A: compile the entire window.document.
            var element = $compile(window.document)($rootScope);

            // B: compile a piece of html
            var element = $compile('<div ng:click="clicked = true">click me</div>')($rootScope);

            // C: compile a piece of html and retain reference to both the dom and scope
            var element = $compile('<div ng:click="clicked = true">click me</div>')(scope);
            // at this point template was transformed into a view
          });
         </pre>
       *
       *
       * @param {string|DOMElement} element Element or HTML to compile into a template function.
       * @returns {function(scope[, cloneAttachFn])} a template function which is used to bind template
       * (a DOM element/tree) to a scope. Where:
       *
       *  * `scope` - A {@link angular.module.ng.$rootScope.Scope Scope} to bind to.
       *  * `cloneAttachFn` - If `cloneAttachFn` is provided, then the link function will clone the
       *               `template` and call the `cloneAttachFn` function allowing the caller to attach the
       *               cloned elements to the DOM document at the appropriate place. The `cloneAttachFn` is
       *               called as: <br/> `cloneAttachFn(clonedElement, scope)` where:
       *
       *      * `clonedElement` - is a clone of the original `element` passed into the compiler.
       *      * `scope` - is the current scope with which the linking function is working with.
       *
       * Calling the template function returns the element of the template. It is either the original element
       * passed in, or the clone of the element if the `cloneAttachFn` is provided.
       *
       * It is important to understand that the returned scope is "linked" to the view DOM, but no linking
       * (instance) functions registered by {@link angular.directive directives} or
       * {@link angular.widget widgets} found in the template have been executed yet. This means that the
       * view is likely empty and doesn't contain any values that result from evaluation on the scope. To
       * bring the view to life, the scope needs to run through a $digest phase which typically is done by
       * Angular automatically, except for the case when an application is being
       * {@link guide/dev_guide.bootstrap.manual_bootstrap} manually bootstrapped, in which case the
       * $digest phase must be invoked by calling {@link angular.module.ng.$rootScope.Scope#$apply}.
       *
       * If you need access to the bound view, there are two ways to do it:
       *
       * - If you are not asking the linking function to clone the template, create the DOM element(s)
       *   before you send them to the compiler and keep this reference around.
       *   <pre>
       *     var $injector = angular.injector(['ng']);
       *     var scope = $injector.invoke(function($rootScope, $compile){
       *       var element = $compile('<p>{{total}}</p>')($rootScope);
       *     });
       *   </pre>
       *
       * - if on the other hand, you need the element to be cloned, the view reference from the original
       *   example would not point to the clone, but rather to the original template that was cloned. In
       *   this case, you can access the clone via the cloneAttachFn:
       *   <pre>
       *     var original = angular.element('<p>{{total}}</p>'),
       *         scope = someParentScope.$new(),
       *         clone;
       *
       *     $compile(original)(scope, function(clonedElement, scope) {
       *       clone = clonedElement;
       *       //attach the clone to DOM document at the right place
       *     });
       *
       *     //now we have reference to the cloned DOM via `clone`
       *   </pre>
       *
       *
       * Compiler Methods For Widgets and Directives:
       *
       * The following methods are available for use when you write your own widgets, directives,
       * and markup.  (Recall that the compile function's this is a reference to the compiler.)
       *
       *  `compile(element)` - returns linker -
       *  Invoke a new instance of the compiler to compile a DOM element and return a linker function.
       *  You can apply the linker function to the original element or a clone of the original element.
       *  The linker function returns a scope.
       *
       *  * `comment(commentText)` - returns element - Create a comment element.
       *
       *  * `element(elementName)` - returns element - Create an element by name.
       *
       *  * `text(text)` - returns element - Create a text element.
       *
       *  * `descend([set])` - returns descend state (true or false). Get or set the current descend
       *  state. If true the compiler will descend to children elements.
       *
       *  * `directives([set])` - returns directive state (true or false). Get or set the current
       *  directives processing state. The compiler will process directives only when directives set to
       *  true.
       *
       * For information on how the compiler works, see the
       * {@link guide/dev_guide.compiler Angular HTML Compiler} section of the Developer Guide.
       */
      function Compiler(markup, attrMarkup, directives, widgets){
        this.markup = markup;
        this.attrMarkup = attrMarkup;
        this.directives = directives;
        this.widgets = widgets;
      }

      Compiler.prototype = {
        compile: function(templateElement) {
          templateElement = jqLite(templateElement);
          var index = 0,
              template,
              parent = templateElement.parent();
          if (templateElement.length > 1) {
            // https://github.com/angular/angular.js/issues/338
            throw Error("Cannot compile multiple element roots: " +
                jqLite('<div>').append(templateElement.clone()).html());
          }
          if (parent && parent[0]) {
            parent = parent[0];
            for(var i = 0; i < parent.childNodes.length; i++) {
              if (parent.childNodes[i] == templateElement[0]) {
                index = i;
              }
            }
          }
          template = this.templatize(templateElement, index) || new Template();
          return function(scope, cloneConnectFn){
            assertArg(scope, 'scope');
            // important!!: we must call our jqLite.clone() since the jQuery one is trying to be smart
            // and sometimes changes the structure of the DOM.
            var element = cloneConnectFn
              ? JQLitePrototype.clone.call(templateElement) // IMPORTANT!!!
              : templateElement;
            element.data($$scope, scope);
            scope.$element = element;
            (cloneConnectFn||noop)(element, scope);
            template.link(element, scope);
            return element;
          };
        },

        templatize: function(element, elementIndex){
          var self = this,
              widget,
              fn,
              directiveFns = self.directives,
              descend = true,
              directives = true,
              elementName = nodeName_(element),
              elementNamespace = elementName.indexOf(':') > 0 ? lowercase(elementName).replace(':', '-') : '',
              template,
              locals = {$element: element},
              selfApi = {
                compile: bind(self, self.compile),
                descend: function(value){ if(isDefined(value)) descend = value; return descend;},
                directives: function(value){ if(isDefined(value)) directives = value; return directives;},
                scope: function(value){ if(isDefined(value)) template.newScope = template.newScope || value; return template.newScope;}
              };
          element.addClass(elementNamespace);
          template = new Template();
          eachAttribute(element, function(value, name){
            if (!widget) {
              if ((widget = self.widgets('@' + name))) {
                element.addClass('ng-attr-widget');
                if (isFunction(widget) && !widget.$inject) {
                  widget.$inject = ['$value', '$element'];
                }
                locals.$value = value;
              }
            }
          });
          if (!widget) {
            if ((widget = self.widgets(elementName))) {
              if (elementNamespace)
                element.addClass('ng-widget');
              if (isFunction(widget) && !widget.$inject) {
                widget.$inject = ['$element'];
              }
            }
          }
          if (widget) {
            descend = false;
            directives = false;
            var parent = element.parent();
            template.addLinkFn($injector.invoke(widget, selfApi, locals));
            if (parent && parent[0]) {
              element = jqLite(parent[0].childNodes[elementIndex]);
            }
          }
          if (descend){
            // process markup for text nodes only
            for(var i=0, child=element[0].childNodes;
                i<child.length; i++) {
              if (isTextNode(child[i])) {
                forEach(self.markup, function(markup){
                  if (i<child.length) {
                    var textNode = jqLite(child[i]);
                    markup.call(selfApi, textNode.text(), textNode, element);
                  }
                });
              }
            }
          }

          if (directives) {
            // Process attributes/directives
            eachAttribute(element, function(value, name){
              forEach(self.attrMarkup, function(markup){
                markup.call(selfApi, value, name, element);
              });
            });
            eachAttribute(element, function(value, name){
              name = lowercase(name);
              fn = directiveFns[name];
              if (fn) {
                element.addClass('ng-directive');
                template.addLinkFn((isArray(fn) || fn.$inject)
                  ? $injector.invoke(fn, selfApi, {$value:value, $element: element})
                  : fn.call(selfApi, value, element));
              }
            });
          }
          // Process non text child nodes
          if (descend) {
            eachNode(element, function(child, i){
              template.addChild(i, self.templatize(child, i));
            });
          }
          return template.empty() ? null : template;
        }
      };

      /////////////////////////////////////////////////////////////////////
      var compiler = new Compiler($textMarkup, $attrMarkup, $directive, $widget);
      return bind(compiler, compiler.compile);
    }];
};


function eachNode(element, fn){
  var i, chldNodes = element[0].childNodes || [], chld;
  for (i = 0; i < chldNodes.length; i++) {
    if(!isTextNode(chld = chldNodes[i])) {
      fn(jqLite(chld), i);
    }
  }
}

function eachAttribute(element, fn){
  var i, attrs = element[0].attributes || [], chld, attr, name, value, attrValue = {};
  for (i = 0; i < attrs.length; i++) {
    attr = attrs[i];
    name = attr.name;
    value = attr.value;
    if (msie && name == 'href') {
      value = decodeURIComponent(element[0].getAttribute(name, 2));
    }
    attrValue[name] = value;
  }
  forEachSorted(attrValue, fn);
}

/**
 * @ngdoc object
 * @name angular.module.ng.$cookieStore
 * @requires $cookies
 *
 * @description
 * Provides a key-value (string-object) storage, that is backed by session cookies.
 * Objects put or retrieved from this storage are automatically serialized or
 * deserialized by angular's toJson/fromJson.
 * @example
 */
function $CookieStoreProvider(){
  this.$get = ['$cookies', function($cookies) {

    return {
      /**
       * @ngdoc method
       * @name angular.module.ng.$cookieStore#get
       * @methodOf angular.module.ng.$cookieStore
       *
       * @description
       * Returns the value of given cookie key
       *
       * @param {string} key Id to use for lookup.
       * @returns {Object} Deserialized cookie value.
       */
      get: function(key) {
        return fromJson($cookies[key]);
      },

      /**
       * @ngdoc method
       * @name angular.module.ng.$cookieStore#put
       * @methodOf angular.module.ng.$cookieStore
       *
       * @description
       * Sets a value for given cookie key
       *
       * @param {string} key Id for the `value`.
       * @param {Object} value Value to be stored.
       */
      put: function(key, value) {
        $cookies[key] = toJson(value);
      },

      /**
       * @ngdoc method
       * @name angular.module.ng.$cookieStore#remove
       * @methodOf angular.module.ng.$cookieStore
       *
       * @description
       * Remove given cookie
       *
       * @param {string} key Id of the key-value pair to delete.
       */
      remove: function(key) {
        delete $cookies[key];
      }
    };

  }];
}

/**
 * @ngdoc object
 * @name angular.module.ng.$cookies
 * @requires $browser
 *
 * @description
 * Provides read/write access to browser's cookies.
 *
 * Only a simple Object is exposed and by adding or removing properties to/from
 * this object, new cookies are created/deleted at the end of current $eval.
 *
 * @example
 */
function $CookiesProvider() {
  this.$get = ['$rootScope', '$browser', function ($rootScope, $browser) {
    var cookies = {},
        lastCookies = {},
        lastBrowserCookies,
        runEval = false;

    //creates a poller fn that copies all cookies from the $browser to service & inits the service
    $browser.addPollFn(function() {
      var currentCookies = $browser.cookies();
      if (lastBrowserCookies != currentCookies) { //relies on browser.cookies() impl
        lastBrowserCookies = currentCookies;
        copy(currentCookies, lastCookies);
        copy(currentCookies, cookies);
        if (runEval) $rootScope.$apply();
      }
    })();

    runEval = true;

    //at the end of each eval, push cookies
    //TODO: this should happen before the "delayed" watches fire, because if some cookies are not
    //      strings or browser refuses to store some cookies, we update the model in the push fn.
    $rootScope.$watch(push);

    return cookies;


    /**
     * Pushes all the cookies from the service to the browser and verifies if all cookies were stored.
     */
    function push() {
      var name,
          value,
          browserCookies,
          updated;

      //delete any cookies deleted in $cookies
      for (name in lastCookies) {
        if (isUndefined(cookies[name])) {
          $browser.cookies(name, undefined);
        }
      }

      //update all cookies updated in $cookies
      for(name in cookies) {
        value = cookies[name];
        if (!isString(value)) {
          if (isDefined(lastCookies[name])) {
            cookies[name] = lastCookies[name];
          } else {
            delete cookies[name];
          }
        } else if (value !== lastCookies[name]) {
          $browser.cookies(name, value);
          updated = true;
        }
      }

      //verify what was actually stored
      if (updated){
        updated = false;
        browserCookies = $browser.cookies();

        for (name in cookies) {
          if (cookies[name] !== browserCookies[name]) {
            //delete or reset all cookies that the browser dropped from $cookies
            if (isUndefined(browserCookies[name])) {
              delete cookies[name];
            } else {
              cookies[name] = browserCookies[name];
            }
            updated = true;
          }
        }
      }
    }
  }];
}

/**
 * @ngdoc function
 * @name angular.module.ng.$defer
 * @requires $browser
 *
 * @description
 * Delegates to {@link angular.module.ng.$browser#defer $browser.defer}, but wraps the `fn` function
 * into a try/catch block and delegates any exceptions to
 * {@link angular.module.ng.$exceptionHandler $exceptionHandler} service.
 *
 * In tests you can use `$browser.defer.flush()` to flush the queue of deferred functions.
 *
 * @param {function()} fn A function, who's execution should be deferred.
 * @param {number=} [delay=0] of milliseconds to defer the function execution.
 * @returns {*} DeferId that can be used to cancel the task via `$defer.cancel()`.
 */

/**
 * @ngdoc function
 * @name angular.module.ng.$defer#cancel
 * @methodOf angular.module.ng.$defer
 *
 * @description
 * Cancels a defered task identified with `deferId`.
 *
 * @param {*} deferId Token returned by the `$defer` function.
 * @returns {boolean} Returns `true` if the task hasn't executed yet and was successfuly canceled.
 */
function $DeferProvider(){
  this.$get = ['$rootScope', '$browser', function($rootScope, $browser) {
    function defer(fn, delay) {
      return $browser.defer(function() {
        $rootScope.$apply(fn);
      }, delay);
    }

    defer.cancel = function(deferId) {
      return $browser.defer.cancel(deferId);
    };

    return defer;
  }];
}

/**
 * @ngdoc object
 * @name angular.module.ng.$document
 * @requires $window
 *
 * @description
 * A {@link angular.element jQuery (lite)}-wrapped reference to the browser's `window.document`
 * element.
 */
function $DocumentProvider(){
  this.$get = ['$window', function(window){
    return jqLite(window.document);
  }];
}

/**
 * @ngdoc function
 * @name angular.module.ng.$exceptionHandler
 * @requires $log
 *
 * @description
 * Any uncaught exception in angular expressions is delegated to this service.
 * The default implementation simply delegates to `$log.error` which logs it into
 * the browser console.
 *
 * In unit tests, if `angular-mocks.js` is loaded, this service is overriden by
 * {@link angular.module.ngMock.$exceptionHandler mock $exceptionHandler}
 */
function $ExceptionHandlerProvider(){
  this.$get = ['$log', function($log){
    return function(e) {
      $log.error(e);
    };
  }];
}

/**
 * @ngdoc object
 * @name angular.module.ng.$filterProvider
 * @description
 *
 * Filters are just functions which transform input to an output. However filters need to be Dependency Injected. To
 * achieve this a filter definition consists of a factory function which is annotated with dependencies and is
 * responsible for creating a the filter function.
 *
 * <pre>
 *   // Filter registration
 *   function MyModule($provide, $filterProvider) {
 *     // create a service to demonstrate injection (not always needed)
 *     $provide.value('greet', function(name){
 *       return 'Hello ' + name + '!':
 *     });
 *
 *     // register a filter factory which uses the
 *     // greet service to demonstrate DI.
 *     $filterProvider.register('greet', function(greet){
 *       // return the filter function which uses the greet service
 *       // to generate salutation
 *       return function(text) {
 *         // filters need to be forgiving so check input validity
 *         return text && greet(text) || text;
 *       };
 *     };
 *   }
 * </pre>
 *
 * The filter function is registered with the `$injector` under the filter name suffixe with `Filter`.
 * <pre>
 *   it('should be the same instance', inject(
 *     function($filterProvider) {
 *       $filterProvider.register('reverse', function(){
 *         return ...;
 *       });
 *     },
 *     function($filter, reverseFilter) {
 *       expect($filter('reverse')).toBe(reverseFilter);
 *     });
 * </pre>
 *
 *
 * For more information about how angular filters work, and how to create your own filters, see
 * {@link guide/dev_guide.templates.filters Understanding Angular Filters} in the angular Developer
 * Guide.
 */
/**
 * @ngdoc method
 * @name angular.module.ng.$filterProvider#register
 * @methodOf angular.module.ng.$filterProvider
 * @description
 * Register filter factory function.
 *
 * @param {String} name Name of the filter.
 * @param {function} fn The filter factory function which is injectable.
 */


/**
 * @ngdoc function
 * @name angular.module.ng.$filter
 * @function
 * @description
 * Filters are used for formatting data displayed to the user.
 *
 * The general syntax in templates is as follows:
 *
 *         {{ expression | [ filter_name ] }}
 *
 * @param {String} name Name of the filter function to retrieve
 * @return {Function} the filter function
 */
$FilterProvider.$inject = ['$provide'];
function $FilterProvider($provide) {
  var suffix = 'Filter';

  function register(name, factory) {
    return $provide.factory(name + suffix, factory);
  }
  this.register = register;

  this.$get = ['$injector', function($injector) {
    return function(name) {
      return $injector.get(name + suffix);
    }
  }];

  ////////////////////////////////////////

  register('currency', currencyFilter);
  register('date', dateFilter);
  register('filter', filterFilter);
  register('html', htmlFilter);
  register('json', jsonFilter);
  register('limitTo', limitToFilter);
  register('linky', linkyFilter);
  register('lowercase', lowercaseFilter);
  register('number', numberFilter);
  register('orderBy', orderByFilter);
  register('uppercase', uppercaseFilter);
}

/**
 * @ngdoc filter
 * @name angular.module.ng.$filter.filter
 * @function
 *
 * @description
 * Selects a subset of items from `array` and returns it as a new array.
 *
 * Note: This function is used to augment the `Array` type in Angular expressions. See
 * {@link angular.module.ng.$filter} for more information about Angular arrays.
 *
 * @param {Array} array The source array.
 * @param {string|Object|function()} expression The predicate to be used for selecting items from
 *   `array`.
 *
 *   Can be one of:
 *
 *   - `string`: Predicate that results in a substring match using the value of `expression`
 *     string. All strings or objects with string properties in `array` that contain this string
 *     will be returned. The predicate can be negated by prefixing the string with `!`.
 *
 *   - `Object`: A pattern object can be used to filter specific properties on objects contained
 *     by `array`. For example `{name:"M", phone:"1"}` predicate will return an array of items
 *     which have property `name` containing "M" and property `phone` containing "1". A special
 *     property name `$` can be used (as in `{$:"text"}`) to accept a match against any
 *     property of the object. That's equivalent to the simple substring match with a `string`
 *     as described above.
 *
 *   - `function`: A predicate function can be used to write arbitrary filters. The function is
 *     called for each element of `array`. The final result is an array of those elements that
 *     the predicate returned true for.
 *
 * @example
   <doc:example>
     <doc:source>
       <div ng:init="friends = [{name:'John', phone:'555-1276'},
                                {name:'Mary', phone:'800-BIG-MARY'},
                                {name:'Mike', phone:'555-4321'},
                                {name:'Adam', phone:'555-5678'},
                                {name:'Julie', phone:'555-8765'}]"></div>

       Search: <input ng:model="searchText"/>
       <table id="searchTextResults">
         <tr><th>Name</th><th>Phone</th><tr>
         <tr ng:repeat="friend in friends | filter:searchText">
           <td>{{friend.name}}</td>
           <td>{{friend.phone}}</td>
         <tr>
       </table>
       <hr>
       Any: <input ng:model="search.$"/> <br>
       Name only <input ng:model="search.name"/><br>
       Phone only <input ng:model="search.phone"/><br>
       <table id="searchObjResults">
         <tr><th>Name</th><th>Phone</th><tr>
         <tr ng:repeat="friend in friends | filter:search">
           <td>{{friend.name}}</td>
           <td>{{friend.phone}}</td>
         <tr>
       </table>
     </doc:source>
     <doc:scenario>
       it('should search across all fields when filtering with a string', function() {
         input('searchText').enter('m');
         expect(repeater('#searchTextResults tr', 'friend in friends').column('name')).
           toEqual(['Mary', 'Mike', 'Adam']);

         input('searchText').enter('76');
         expect(repeater('#searchTextResults tr', 'friend in friends').column('name')).
           toEqual(['John', 'Julie']);
       });

       it('should search in specific fields when filtering with a predicate object', function() {
         input('search.$').enter('i');
         expect(repeater('#searchObjResults tr', 'friend in friends').column('name')).
           toEqual(['Mary', 'Mike', 'Julie']);
       });
     </doc:scenario>
   </doc:example>
 */
function filterFilter() {
  return function(array, expression) {
    if (!(array instanceof Array)) return array;
    var predicates = [];
    predicates.check = function(value) {
      for (var j = 0; j < predicates.length; j++) {
        if(!predicates[j](value)) {
          return false;
        }
      }
      return true;
    };
    var search = function(obj, text){
      if (text.charAt(0) === '!') {
        return !search(obj, text.substr(1));
      }
      switch (typeof obj) {
        case "boolean":
        case "number":
        case "string":
          return ('' + obj).toLowerCase().indexOf(text) > -1;
        case "object":
          for ( var objKey in obj) {
            if (objKey.charAt(0) !== '$' && search(obj[objKey], text)) {
              return true;
            }
          }
          return false;
        case "array":
          for ( var i = 0; i < obj.length; i++) {
            if (search(obj[i], text)) {
              return true;
            }
          }
          return false;
        default:
          return false;
      }
    };
    switch (typeof expression) {
      case "boolean":
      case "number":
      case "string":
        expression = {$:expression};
      case "object":
        for (var key in expression) {
          if (key == '$') {
            (function() {
              var text = (''+expression[key]).toLowerCase();
              if (!text) return;
              predicates.push(function(value) {
                return search(value, text);
              });
            })();
          } else {
            (function() {
              var path = key;
              var text = (''+expression[key]).toLowerCase();
              if (!text) return;
              predicates.push(function(value) {
                return search(getter(value, path), text);
              });
            })();
          }
        }
        break;
      case 'function':
        predicates.push(expression);
        break;
      default:
        return array;
    }
    var filtered = [];
    for ( var j = 0; j < array.length; j++) {
      var value = array[j];
      if (predicates.check(value)) {
        filtered.push(value);
      }
    }
    return filtered;
  }
}

/**
 * @ngdoc filter
 * @name angular.module.ng.$filter.currency
 * @function
 *
 * @description
 * Formats a number as a currency (ie $1,234.56). When no currency symbol is provided, default
 * symbol for current locale is used.
 *
 * @param {number} amount Input to filter.
 * @param {string=} symbol Currency symbol or identifier to be displayed.
 * @returns {string} Formatted number.
 *
 *
 * @example
   <doc:example>
     <doc:source>
       <script>
         function Ctrl() {
           this.amount = 1234.56;
         }
       </script>
       <div ng:controller="Ctrl">
         <input type="number" ng:model="amount"/> <br/>
         default currency symbol ($): {{amount | currency}}<br/>
         custom currency identifier (USD$): {{amount | currency:"USD$"}}
       </div>
     </doc:source>
     <doc:scenario>
       it('should init with 1234.56', function() {
         expect(binding('amount | currency')).toBe('$1,234.56');
         expect(binding('amount | currency:"USD$"')).toBe('USD$1,234.56');
       });
       it('should update', function() {
         input('amount').enter('-1234');
         expect(binding('amount | currency')).toBe('($1,234.00)');
         expect(binding('amount | currency:"USD$"')).toBe('(USD$1,234.00)');
       });
     </doc:scenario>
   </doc:example>
 */
currencyFilter.$inject = ['$locale'];
function currencyFilter($locale) {
  var formats = $locale.NUMBER_FORMATS;
  return function(amount, currencySymbol){
    if (isUndefined(currencySymbol)) currencySymbol = formats.CURRENCY_SYM;
    return formatNumber(amount, formats.PATTERNS[1], formats.GROUP_SEP, formats.DECIMAL_SEP, 2).
                replace(/\u00A4/g, currencySymbol);
  };
}

/**
 * @ngdoc filter
 * @name angular.module.ng.$filter.number
 * @function
 *
 * @description
 * Formats a number as text.
 *
 * If the input is not a number an empty string is returned.
 *
 * @param {number|string} number Number to format.
 * @param {(number|string)=} [fractionSize=2] Number of decimal places to round the number to.
 * @returns {string} Number rounded to decimalPlaces and places a ???,??? after each third digit.
 *
 * @example
   <doc:example>
     <doc:source>
       <script>
         function Ctrl() {
           this.val = 1234.56789;
         }
       </script>
       <div ng:controller="Ctrl">
         Enter number: <input ng:model='val'><br/>
         Default formatting: {{val | number}}<br/>
         No fractions: {{val | number:0}}<br/>
         Negative number: {{-val | number:4}}
       </div>
     </doc:source>
     <doc:scenario>
       it('should format numbers', function() {
         expect(binding('val | number')).toBe('1,234.568');
         expect(binding('val | number:0')).toBe('1,235');
         expect(binding('-val | number:4')).toBe('-1,234.5679');
       });

       it('should update', function() {
         input('val').enter('3374.333');
         expect(binding('val | number')).toBe('3,374.333');
         expect(binding('val | number:0')).toBe('3,374');
         expect(binding('-val | number:4')).toBe('-3,374.3330');
       });
     </doc:scenario>
   </doc:example>
 */


numberFilter.$inject = ['$locale'];
function numberFilter($locale) {
  var formats = $locale.NUMBER_FORMATS;
  return function(number, fractionSize) {
    return formatNumber(number, formats.PATTERNS[0], formats.GROUP_SEP, formats.DECIMAL_SEP,
      fractionSize);
  };
}

var DECIMAL_SEP = '.';
function formatNumber(number, pattern, groupSep, decimalSep, fractionSize) {
  if (isNaN(number) || !isFinite(number)) return '';

  var isNegative = number < 0;
  number = Math.abs(number);
  var numStr = number + '',
      formatedText = '',
      parts = [];

  if (numStr.indexOf('e') !== -1) {
    formatedText = numStr;
  } else {
    var fractionLen = (numStr.split(DECIMAL_SEP)[1] || '').length;

    // determine fractionSize if it is not specified
    if (isUndefined(fractionSize)) {
      fractionSize = Math.min(Math.max(pattern.minFrac, fractionLen), pattern.maxFrac);
    }

    var pow = Math.pow(10, fractionSize);
    number = Math.round(number * pow) / pow;
    var fraction = ('' + number).split(DECIMAL_SEP);
    var whole = fraction[0];
    fraction = fraction[1] || '';

    var pos = 0,
        lgroup = pattern.lgSize,
        group = pattern.gSize;

    if (whole.length >= (lgroup + group)) {
      pos = whole.length - lgroup;
      for (var i = 0; i < pos; i++) {
        if ((pos - i)%group === 0 && i !== 0) {
          formatedText += groupSep;
        }
        formatedText += whole.charAt(i);
      }
    }

    for (i = pos; i < whole.length; i++) {
      if ((whole.length - i)%lgroup === 0 && i !== 0) {
        formatedText += groupSep;
      }
      formatedText += whole.charAt(i);
    }

    // format fraction part.
    while(fraction.length < fractionSize) {
      fraction += '0';
    }

    if (fractionSize) formatedText += decimalSep + fraction.substr(0, fractionSize);
  }

  parts.push(isNegative ? pattern.negPre : pattern.posPre);
  parts.push(formatedText);
  parts.push(isNegative ? pattern.negSuf : pattern.posSuf);
  return parts.join('');
}

function padNumber(num, digits, trim) {
  var neg = '';
  if (num < 0) {
    neg =  '-';
    num = -num;
  }
  num = '' + num;
  while(num.length < digits) num = '0' + num;
  if (trim)
    num = num.substr(num.length - digits);
  return neg + num;
}


function dateGetter(name, size, offset, trim) {
  return function(date) {
    var value = date['get' + name]();
    if (offset > 0 || value > -offset)
      value += offset;
    if (value === 0 && offset == -12 ) value = 12;
    return padNumber(value, size, trim);
  };
}

function dateStrGetter(name, shortForm) {
  return function(date, formats) {
    var value = date['get' + name]();
    var get = uppercase(shortForm ? ('SHORT' + name) : name);

    return formats[get][value];
  };
}

function timeZoneGetter(date) {
  var offset = date.getTimezoneOffset();
  return padNumber(offset / 60, 2) + padNumber(Math.abs(offset % 60), 2);
}

function ampmGetter(date, formats) {
  return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
}

var DATE_FORMATS = {
  yyyy: dateGetter('FullYear', 4),
    yy: dateGetter('FullYear', 2, 0, true),
     y: dateGetter('FullYear', 1),
  MMMM: dateStrGetter('Month'),
   MMM: dateStrGetter('Month', true),
    MM: dateGetter('Month', 2, 1),
     M: dateGetter('Month', 1, 1),
    dd: dateGetter('Date', 2),
     d: dateGetter('Date', 1),
    HH: dateGetter('Hours', 2),
     H: dateGetter('Hours', 1),
    hh: dateGetter('Hours', 2, -12),
     h: dateGetter('Hours', 1, -12),
    mm: dateGetter('Minutes', 2),
     m: dateGetter('Minutes', 1),
    ss: dateGetter('Seconds', 2),
     s: dateGetter('Seconds', 1),
  EEEE: dateStrGetter('Day'),
   EEE: dateStrGetter('Day', true),
     a: ampmGetter,
     Z: timeZoneGetter
};

var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/,
    NUMBER_STRING = /^\d+$/;

/**
 * @ngdoc filter
 * @name angular.module.ng.$filter.date
 * @function
 *
 * @description
 *   Formats `date` to a string based on the requested `format`.
 *
 *   `format` string can be composed of the following elements:
 *
 *   * `'yyyy'`: 4 digit representation of year (e.g. AD 1 => 0001, AD 2010 => 2010)
 *   * `'yy'`: 2 digit representation of year, padded (00-99). (e.g. AD 2001 => 01, AD 2010 => 10)
 *   * `'y'`: 1 digit representation of year, e.g. (AD 1 => 1, AD 199 => 199)
 *   * `'MMMM'`: Month in year (January-December)
 *   * `'MMM'`: Month in year (Jan-Dec)
 *   * `'MM'`: Month in year, padded (01-12)
 *   * `'M'`: Month in year (1-12)
 *   * `'dd'`: Day in month, padded (01-31)
 *   * `'d'`: Day in month (1-31)
 *   * `'EEEE'`: Day in Week,(Sunday-Saturday)
 *   * `'EEE'`: Day in Week, (Sun-Sat)
 *   * `'HH'`: Hour in day, padded (00-23)
 *   * `'H'`: Hour in day (0-23)
 *   * `'hh'`: Hour in am/pm, padded (01-12)
 *   * `'h'`: Hour in am/pm, (1-12)
 *   * `'mm'`: Minute in hour, padded (00-59)
 *   * `'m'`: Minute in hour (0-59)
 *   * `'ss'`: Second in minute, padded (00-59)
 *   * `'s'`: Second in minute (0-59)
 *   * `'a'`: am/pm marker
 *   * `'Z'`: 4 digit (+sign) representation of the timezone offset (-1200-1200)
 *
 *   `format` string can also be one of the following predefined
 *   {@link guide/dev_guide.i18n localizable formats}:
 *
 *   * `'medium'`: equivalent to `'MMM d, y h:mm:ss a'` for en_US locale
 *     (e.g. Sep 3, 2010 12:05:08 pm)
 *   * `'short'`: equivalent to `'M/d/yy h:mm a'` for en_US  locale (e.g. 9/3/10 12:05 pm)
 *   * `'fullDate'`: equivalent to `'EEEE, MMMM d,y'` for en_US  locale
 *     (e.g. Friday, September 3, 2010)
 *   * `'longDate'`: equivalent to `'MMMM d, y'` for en_US  locale (e.g. September 3, 2010
 *   * `'mediumDate'`: equivalent to `'MMM d, y'` for en_US  locale (e.g. Sep 3, 2010)
 *   * `'shortDate'`: equivalent to `'M/d/yy'` for en_US locale (e.g. 9/3/10)
 *   * `'mediumTime'`: equivalent to `'h:mm:ss a'` for en_US locale (e.g. 12:05:08 pm)
 *   * `'shortTime'`: equivalent to `'h:mm a'` for en_US locale (e.g. 12:05 pm)
 *
 *   `format` string can contain literal values. These need to be quoted with single quotes (e.g.
 *   `"h 'in the morning'"`). In order to output single quote, use two single quotes in a sequence
 *   (e.g. `"h o''clock"`).
 *
 * @param {(Date|number|string)} date Date to format either as Date object, milliseconds (string or
 *    number) or ISO 8601 extended datetime string (yyyy-MM-ddTHH:mm:ss.SSSZ).
 * @param {string=} format Formatting rules (see Description). If not specified,
 *    `mediumDate` is used.
 * @returns {string} Formatted string or the input if input is not recognized as date/millis.
 *
 * @example
   <doc:example>
     <doc:source>
       <span ng:non-bindable>{{1288323623006 | date:'medium'}}</span>:
           {{1288323623006 | date:'medium'}}<br/>
       <span ng:non-bindable>{{1288323623006 | date:'yyyy-MM-dd HH:mm:ss Z'}}</span>:
          {{1288323623006 | date:'yyyy-MM-dd HH:mm:ss Z'}}<br/>
       <span ng:non-bindable>{{1288323623006 | date:'MM/dd/yyyy @ h:mma'}}</span>:
          {{'1288323623006' | date:'MM/dd/yyyy @ h:mma'}}<br/>
     </doc:source>
     <doc:scenario>
       it('should format date', function() {
         expect(binding("1288323623006 | date:'medium'")).
            toMatch(/Oct 2\d, 2010 \d{1,2}:\d{2}:\d{2} (AM|PM)/);
         expect(binding("1288323623006 | date:'yyyy-MM-dd HH:mm:ss Z'")).
            toMatch(/2010\-10\-2\d \d{2}:\d{2}:\d{2} \-?\d{4}/);
         expect(binding("'1288323623006' | date:'MM/dd/yyyy @ h:mma'")).
            toMatch(/10\/2\d\/2010 @ \d{1,2}:\d{2}(AM|PM)/);
       });
     </doc:scenario>
   </doc:example>
 */
dateFilter.$inject = ['$locale'];
function dateFilter($locale) {
  return function(date, format) {
    var text = '',
        parts = [],
        fn, match;

    format = format || 'mediumDate'
    format = $locale.DATETIME_FORMATS[format] || format;
    if (isString(date)) {
      if (NUMBER_STRING.test(date)) {
        date = parseInt(date, 10);
      } else {
        date = jsonStringToDate(date);
      }
    }

    if (isNumber(date)) {
      date = new Date(date);
    }

    if (!isDate(date)) {
      return date;
    }

    while(format) {
      match = DATE_FORMATS_SPLIT.exec(format);
      if (match) {
        parts = concat(parts, match, 1);
        format = parts.pop();
      } else {
        parts.push(format);
        format = null;
      }
    }

    forEach(parts, function(value){
      fn = DATE_FORMATS[value];
      text += fn ? fn(date, $locale.DATETIME_FORMATS)
                 : value.replace(/(^'|'$)/g, '').replace(/''/g, "'");
    });

    return text;
  };
}


/**
 * @ngdoc filter
 * @name angular.module.ng.$filter.json
 * @function
 *
 * @description
 *   Allows you to convert a JavaScript object into JSON string.
 *
 *   This filter is mostly useful for debugging. When using the double curly {{value}} notation
 *   the binding is automatically converted to JSON.
 *
 * @param {*} object Any JavaScript object (including arrays and primitive types) to filter.
 * @returns {string} JSON string.
 *
 * @css ng-monospace Always applied to the encapsulating element.
 *
 * @example:
   <doc:example>
     <doc:source>
       <pre>{{ {'name':'value'} | json }}</pre>
     </doc:source>
     <doc:scenario>
       it('should jsonify filtered objects', function() {
         expect(binding('| json')).toBe('{\n  "name":"value"}');
       });
     </doc:scenario>
   </doc:example>
 *
 */
function jsonFilter() {
  return function(object) {
    return toJson(object, true);
  };
}


/**
 * @ngdoc filter
 * @name angular.module.ng.$filter.lowercase
 * @function
 * @description
 * Converts string to lowercase.
 * @see angular.lowercase
 */
var lowercaseFilter = valueFn(lowercase);


/**
 * @ngdoc filter
 * @name angular.module.ng.$filter.uppercase
 * @function
 * @description
 * Converts string to uppercase.
 * @see angular.uppercase
 */
var uppercaseFilter = valueFn(uppercase);


/**
 * @ngdoc filter
 * @name angular.module.ng.$filter.html
 * @function
 *
 * @description
 *   Prevents the input from getting escaped by angular. By default the input is sanitized and
 *   inserted into the DOM as is.
 *
 *   The input is sanitized by parsing the html into tokens. All safe tokens (from a whitelist) are
 *   then serialized back to properly escaped html string. This means that no unsafe input can make
 *   it into the returned string, however, since our parser is more strict than a typical browser
 *   parser, it's possible that some obscure input, which would be recognized as valid HTML by a
 *   browser, won't make it through the sanitizer.
 *
 *   If you hate your users, you may call the filter with optional 'unsafe' argument, which bypasses
 *   the html sanitizer, but makes your application vulnerable to XSS and other attacks. Using this
 *   option is strongly discouraged and should be used only if you absolutely trust the input being
 *   filtered and you can't get the content through the sanitizer.
 *
 * @param {string} html Html input.
 * @param {string=} option If 'unsafe' then do not sanitize the HTML input.
 * @returns {string} Sanitized or raw html.
 *
 * @example
   <doc:example>
     <doc:source>
       <script>
         function Ctrl() {
           this.snippet =
             '<p style="color:blue">an html\n' +
             '<em onmouseover="this.textContent=\'PWN3D!\'">click here</em>\n' +
             'snippet</p>';
         }
       </script>
       <div ng:controller="Ctrl">
          Snippet: <textarea ng:model="snippet" cols="60" rows="3"></textarea>
           <table>
             <tr>
               <td>Filter</td>
               <td>Source</td>
               <td>Rendered</td>
             </tr>
             <tr id="html-filter">
               <td>html filter</td>
               <td>
                 <pre>&lt;div ng:bind="snippet | html"&gt;<br/>&lt;/div&gt;</pre>
               </td>
               <td>
                 <div ng:bind="snippet | html"></div>
               </td>
             </tr>
             <tr id="escaped-html">
               <td>no filter</td>
               <td><pre>&lt;div ng:bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
               <td><div ng:bind="snippet"></div></td>
             </tr>
             <tr id="html-unsafe-filter">
               <td>unsafe html filter</td>
               <td><pre>&lt;div ng:bind="snippet | html:'unsafe'"&gt;<br/>&lt;/div&gt;</pre></td>
               <td><div ng:bind="snippet | html:'unsafe'"></div></td>
             </tr>
           </table>
         </div>
     </doc:source>
     <doc:scenario>
       it('should sanitize the html snippet ', function() {
         expect(using('#html-filter').binding('snippet | html')).
           toBe('<p>an html\n<em>click here</em>\nsnippet</p>');
       });

       it('should escape snippet without any filter', function() {
         expect(using('#escaped-html').binding('snippet')).
           toBe("&lt;p style=\"color:blue\"&gt;an html\n" +
                "&lt;em onmouseover=\"this.textContent='PWN3D!'\"&gt;click here&lt;/em&gt;\n" +
                "snippet&lt;/p&gt;");
       });

       it('should inline raw snippet if filtered as unsafe', function() {
         expect(using('#html-unsafe-filter').binding("snippet | html:'unsafe'")).
           toBe("<p style=\"color:blue\">an html\n" +
                "<em onmouseover=\"this.textContent='PWN3D!'\">click here</em>\n" +
                "snippet</p>");
       });

       it('should update', function() {
         input('snippet').enter('new <b>text</b>');
         expect(using('#html-filter').binding('snippet | html')).toBe('new <b>text</b>');
         expect(using('#escaped-html').binding('snippet')).toBe("new &lt;b&gt;text&lt;/b&gt;");
         expect(using('#html-unsafe-filter').binding("snippet | html:'unsafe'")).toBe('new <b>text</b>');
       });
     </doc:scenario>
   </doc:example>
 */
//TODO(misko): turn sensitization into injectable service
function htmlFilter() {
  return function(html, option){
    return new HTML(html, option);
  };
}


/**
 * @ngdoc filter
 * @name angular.module.ng.$filter.linky
 * @function
 *
 * @description
 *   Finds links in text input and turns them into html links. Supports http/https/ftp/mailto and
 *   plain email address links.
 *
 * @param {string} text Input text.
 * @returns {string} Html-linkified text.
 *
 * @example
   <doc:example>
     <doc:source>
       <script>
         function Ctrl() {
           this.snippet =
             'Pretty text with some links:\n'+
             'http://angularjs.org/,\n'+
             'mailto:us@somewhere.org,\n'+
             'another@somewhere.org,\n'+
             'and one more: ftp://127.0.0.1/.';
         }
       </script>
       <div ng:controller="Ctrl">
       Snippet: <textarea ng:model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Filter</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="linky-filter">
           <td>linky filter</td>
           <td>
             <pre>&lt;div ng:bind="snippet | linky"&gt;<br/>&lt;/div&gt;</pre>
           </td>
           <td>
             <div ng:bind="snippet | linky"></div>
           </td>
         </tr>
         <tr id="escaped-html">
           <td>no filter</td>
           <td><pre>&lt;div ng:bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng:bind="snippet"></div></td>
         </tr>
       </table>
     </doc:source>
     <doc:scenario>
       it('should linkify the snippet with urls', function() {
         expect(using('#linky-filter').binding('snippet | linky')).
           toBe('Pretty text with some links:\n' +
                '<a href="http://angularjs.org/">http://angularjs.org/</a>,\n' +
                '<a href="mailto:us@somewhere.org">us@somewhere.org</a>,\n' +
                '<a href="mailto:another@somewhere.org">another@somewhere.org</a>,\n' +
                'and one more: <a href="ftp://127.0.0.1/">ftp://127.0.0.1/</a>.');
       });

       it ('should not linkify snippet without the linky filter', function() {
         expect(using('#escaped-html').binding('snippet')).
           toBe("Pretty text with some links:\n" +
                "http://angularjs.org/,\n" +
                "mailto:us@somewhere.org,\n" +
                "another@somewhere.org,\n" +
                "and one more: ftp://127.0.0.1/.");
       });

       it('should update', function() {
         input('snippet').enter('new http://link.');
         expect(using('#linky-filter').binding('snippet | linky')).
           toBe('new <a href="http://link">http://link</a>.');
         expect(using('#escaped-html').binding('snippet')).toBe('new http://link.');
       });
     </doc:scenario>
   </doc:example>
 */
function linkyFilter() {
  var LINKY_URL_REGEXP = /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s\.\;\,\(\)\{\}\<\>]/,
      MAILTO_REGEXP = /^mailto:/;

  return function(text) {
    if (!text) return text;
    var match;
    var raw = text;
    var html = [];
    var writer = htmlSanitizeWriter(html);
    var url;
    var i;
    while ((match = raw.match(LINKY_URL_REGEXP))) {
      // We can not end in these as they are sometimes found at the end of the sentence
      url = match[0];
      // if we did not match ftp/http/mailto then assume mailto
      if (match[2] == match[3]) url = 'mailto:' + url;
      i = match.index;
      writer.chars(raw.substr(0, i));
      writer.start('a', {href:url});
      writer.chars(match[0].replace(MAILTO_REGEXP, ''));
      writer.end('a');
      raw = raw.substring(i + match[0].length);
    }
    writer.chars(raw);
    return new HTML(html.join(''));
  };
};

/**
 * @ngdoc function
 * @name angular.module.ng.$filter.limitTo
 * @function
 *
 * @description
 * Creates a new array containing only a specified number of elements in an array. The elements
 * are taken from either the beginning or the end of the source array, as specified by the
 * value and sign (positive or negative) of `limit`.
 *
 * Note: This function is used to augment the `Array` type in Angular expressions. See
 * {@link angular.module.ng.$filter} for more information about Angular arrays.
 *
 * @param {Array} array Source array to be limited.
 * @param {string|Number} limit The length of the returned array. If the `limit` number is
 *     positive, `limit` number of items from the beginning of the source array are copied.
 *     If the number is negative, `limit` number  of items from the end of the source array are
 *     copied. The `limit` will be trimmed if it exceeds `array.length`
 * @returns {Array} A new sub-array of length `limit` or less if input array had less than `limit`
 *     elements.
 *
 * @example
   <doc:example>
     <doc:source>
       <script>
         function Ctrl() {
           this.numbers = [1,2,3,4,5,6,7,8,9];
           this.limit = 3;
         }
       </script>
       <div ng:controller="Ctrl">
         Limit {{numbers}} to: <input type="integer" ng:model="limit"/>
         <p>Output: {{ numbers | limitTo:limit | json }}</p>
       </div>
     </doc:source>
     <doc:scenario>
       it('should limit the numer array to first three items', function() {
         expect(element('.doc-example-live input[ng\\:model=limit]').val()).toBe('3');
         expect(binding('numbers | limitTo:limit | json')).toEqual('[1,2,3]');
       });

       it('should update the output when -3 is entered', function() {
         input('limit').enter(-3);
         expect(binding('numbers | limitTo:limit | json')).toEqual('[7,8,9]');
       });

       it('should not exceed the maximum size of input array', function() {
         input('limit').enter(100);
         expect(binding('numbers | limitTo:limit | json')).toEqual('[1,2,3,4,5,6,7,8,9]');
       });
     </doc:scenario>
   </doc:example>
 */
function limitToFilter(){
  return function(array, limit) {
    if (!(array instanceof Array)) return array;
    limit = parseInt(limit, 10);
    var out = [],
      i, n;

    // check that array is iterable
    if (!array || !(array instanceof Array))
      return out;

    // if abs(limit) exceeds maximum length, trim it
    if (limit > array.length)
      limit = array.length;
    else if (limit < -array.length)
      limit = -array.length;

    if (limit > 0) {
      i = 0;
      n = limit;
    } else {
      i = array.length + limit;
      n = array.length;
    }

    for (; i<n; i++) {
      out.push(array[i]);
    }

    return out;
  }
}

/**
 * @ngdoc function
 * @name angular.module.ng.$filter.orderBy
 * @function
 *
 * @description
 * Orders a specified `array` by the `expression` predicate.
 *
 * Note: this function is used to augment the `Array` type in Angular expressions. See
 * {@link angular.module.ng.$filter} for more informaton about Angular arrays.
 *
 * @param {Array} array The array to sort.
 * @param {function(*)|string|Array.<(function(*)|string)>} expression A predicate to be
 *    used by the comparator to determine the order of elements.
 *
 *    Can be one of:
 *
 *    - `function`: Getter function. The result of this function will be sorted using the
 *      `<`, `=`, `>` operator.
 *    - `string`: An Angular expression which evaluates to an object to order by, such as 'name'
 *      to sort by a property called 'name'. Optionally prefixed with `+` or `-` to control
 *      ascending or descending sort order (for example, +name or -name).
 *    - `Array`: An array of function or string predicates. The first predicate in the array
 *      is used for sorting, but when two items are equivalent, the next predicate is used.
 *
 * @param {boolean=} reverse Reverse the order the array.
 * @returns {Array} Sorted copy of the source array.
 *
 * @example
   <doc:example>
     <doc:source>
       <script>
         function Ctrl() {
           this.friends =
               [{name:'John', phone:'555-1212', age:10},
                {name:'Mary', phone:'555-9876', age:19},
                {name:'Mike', phone:'555-4321', age:21},
                {name:'Adam', phone:'555-5678', age:35},
                {name:'Julie', phone:'555-8765', age:29}]
           this.predicate = '-age';
         }
       </script>
       <div ng:controller="Ctrl">
         <pre>Sorting predicate = {{predicate}}; reverse = {{reverse}}</pre>
         <hr/>
         [ <a href="" ng:click="predicate=''">unsorted</a> ]
         <table class="friend">
           <tr>
             <th><a href="" ng:click="predicate = 'name'; reverse=false">Name</a>
                 (<a href ng:click="predicate = '-name'; reverse=false">^</a>)</th>
             <th><a href="" ng:click="predicate = 'phone'; reverse=!reverse">Phone Number</a></th>
             <th><a href="" ng:click="predicate = 'age'; reverse=!reverse">Age</a></th>
           <tr>
           <tr ng:repeat="friend in friends | orderBy:predicate:reverse">
             <td>{{friend.name}}</td>
             <td>{{friend.phone}}</td>
             <td>{{friend.age}}</td>
           <tr>
         </table>
       </div>
     </doc:source>
     <doc:scenario>
       it('should be reverse ordered by aged', function() {
         expect(binding('predicate')).toBe('Sorting predicate = -age; reverse = ');
         expect(repeater('table.friend', 'friend in friends').column('friend.age')).
           toEqual(['35', '29', '21', '19', '10']);
         expect(repeater('table.friend', 'friend in friends').column('friend.name')).
           toEqual(['Adam', 'Julie', 'Mike', 'Mary', 'John']);
       });

       it('should reorder the table when user selects different predicate', function() {
         element('.doc-example-live a:contains("Name")').click();
         expect(repeater('table.friend', 'friend in friends').column('friend.name')).
           toEqual(['Adam', 'John', 'Julie', 'Mary', 'Mike']);
         expect(repeater('table.friend', 'friend in friends').column('friend.age')).
           toEqual(['35', '10', '29', '19', '21']);

         element('.doc-example-live a:contains("Phone")').click();
         expect(repeater('table.friend', 'friend in friends').column('friend.phone')).
           toEqual(['555-9876', '555-8765', '555-5678', '555-4321', '555-1212']);
         expect(repeater('table.friend', 'friend in friends').column('friend.name')).
           toEqual(['Mary', 'Julie', 'Adam', 'Mike', 'John']);
       });
     </doc:scenario>
   </doc:example>
 */
orderByFilter.$inject = ['$parse'];
function orderByFilter($parse){
  return function(array, sortPredicate, reverseOrder) {
    if (!(array instanceof Array)) return array;
    if (!sortPredicate) return array;
    sortPredicate = isArray(sortPredicate) ? sortPredicate: [sortPredicate];
    sortPredicate = map(sortPredicate, function(predicate){
      var descending = false, get = predicate || identity;
      if (isString(predicate)) {
        if ((predicate.charAt(0) == '+' || predicate.charAt(0) == '-')) {
          descending = predicate.charAt(0) == '-';
          predicate = predicate.substring(1);
        }
        get = $parse(predicate);
      }
      return reverseComparator(function(a,b){
        return compare(get(a),get(b));
      }, descending);
    });
    var arrayCopy = [];
    for ( var i = 0; i < array.length; i++) { arrayCopy.push(array[i]); }
    return arrayCopy.sort(reverseComparator(comparator, reverseOrder));

    function comparator(o1, o2){
      for ( var i = 0; i < sortPredicate.length; i++) {
        var comp = sortPredicate[i](o1, o2);
        if (comp !== 0) return comp;
      }
      return 0;
    }
    function reverseComparator(comp, descending) {
      return toBoolean(descending)
          ? function(a,b){return comp(b,a);}
          : comp;
    }
    function compare(v1, v2){
      var t1 = typeof v1;
      var t2 = typeof v2;
      if (t1 == t2) {
        if (t1 == "string") v1 = v1.toLowerCase();
        if (t1 == "string") v2 = v2.toLowerCase();
        if (v1 === v2) return 0;
        return v1 < v2 ? -1 : 1;
      } else {
        return t1 < t2 ? -1 : 1;
      }
    }
  }
}

/**
 * @ngdoc object
 * @name angular.module.ng.$formFactory
 *
 * @description
 * Use `$formFactory` to create a new instance of a {@link angular.module.ng.$formFactory.Form Form}
 * controller or to find the nearest form instance for a given DOM element.
 *
 * The form instance is a collection of widgets, and is responsible for life cycle and validation
 * of widget.
 *
 * Keep in mind that both form and widget instances are {@link api/angular.module.ng.$rootScope.Scope scopes}.
 *
 * @param {Form=} parentForm The form which should be the parent form of the new form controller.
 *   If none specified default to the `rootForm`.
 * @returns {Form} A new {@link angular.module.ng.$formFactory.Form Form} instance.
 *
 * @example
 *
 * This example shows how one could write a widget which would enable data-binding on
 * `contenteditable` feature of HTML.
 *
    <doc:example>
      <doc:source>
        <script>
          function EditorCntl() {
            this.html = '<b>Hello</b> <i>World</i>!';
          }

          HTMLEditorWidget.$inject = ['$element', 'htmlFilter'];
          function HTMLEditorWidget(element, htmlFilter) {
            var self = this;

            this.$parseModel = function() {
              // need to protect for script injection
              try {
                this.$viewValue = htmlFilter(this.$modelValue || '').get();
                if (this.$error.HTML) {
                  // we were invalid, but now we are OK.
                  this.$emit('$valid', 'HTML');
                }
              } catch (e) {
                // if HTML not parsable invalidate form.
                this.$emit('$invalid', 'HTML');
              }
            }

            this.$render = function() {
              element.html(this.$viewValue);
            }

            element.bind('keyup', function() {
              self.$apply(function() {
                self.$emit('$viewChange', element.html());
              });
            });
          }

          angular.directive('ng:contenteditable', function() {
            return ['$formFactory', '$element', function ($formFactory, element) {
              var exp = element.attr('ng:contenteditable'),
                  form = $formFactory.forElement(element),
                  widget;
              element.attr('contentEditable', true);
              widget = form.$createWidget({
                scope: this,
                model: exp,
                controller: HTMLEditorWidget,
                controllerArgs: {$element: element}});
              // if the element is destroyed, then we need to notify the form.
              element.bind('$destroy', function() {
                widget.$destroy();
              });
            }];
          });
        </script>
        <form name='editorForm' ng:controller="EditorCntl">
          <div ng:contenteditable="html"></div>
          <hr/>
          HTML: <br/>
          <textarea ng:model="html" cols=80></textarea>
          <hr/>
          <pre>editorForm = {{editorForm}}</pre>
        </form>
      </doc:source>
      <doc:scenario>
        it('should enter invalid HTML', function() {
          expect(element('form[name=editorForm]').prop('className')).toMatch(/ng-valid/);
          input('html').enter('<');
          expect(element('form[name=editorForm]').prop('className')).toMatch(/ng-invalid/);
        });
      </doc:scenario>
    </doc:example>
 */

/**
 * @ngdoc object
 * @name angular.module.ng.$formFactory.Form
 * @description
 * The `Form` is a controller which keeps track of the validity of the widgets contained within it.
 */

function $FormFactoryProvider() {
  var $parse;
  this.$get = ['$rootScope', '$parse',  function($rootScope, $parse_) {
    $parse = $parse_;
    /**
     * @ngdoc proprety
     * @name rootForm
     * @propertyOf angular.module.ng.$formFactory
     * @description
     * Static property on `$formFactory`
     *
     * Each application ({@link guide/dev_guide.scopes.internals root scope}) gets a root form which
     * is the top-level parent of all forms.
     */
    formFactory.rootForm = formFactory($rootScope);


    /**
     * @ngdoc method
     * @name forElement
     * @methodOf angular.module.ng.$formFactory
     * @description
     * Static method on `$formFactory` service.
     *
     * Retrieve the closest form for a given element or defaults to the `root` form. Used by the
     * {@link angular.widget.form form} element.
     * @param {Element} element The element where the search for form should initiate.
     */
    formFactory.forElement = function(element) {
      return element.inheritedData('$form') || formFactory.rootForm;
    };
    return formFactory;

    function formFactory(parent) {
      return (parent || formFactory.rootForm).$new(FormController);
    }

  }];

  function propertiesUpdate(widget) {
    widget.$valid = !(widget.$invalid =
      !(widget.$readonly || widget.$disabled || equals(widget.$error, {})));
  }

  /**
   * @ngdoc property
   * @name $error
   * @propertyOf angular.module.ng.$formFactory.Form
   * @description
   * Property of the form and widget instance.
   *
   * Summary of all of the errors on the page. If a widget emits `$invalid` with `REQUIRED` key,
   * then the `$error` object will have a `REQUIRED` key with an array of widgets which have
   * emitted this key. `form.$error.REQUIRED == [ widget ]`.
   */

  /**
   * @ngdoc property
   * @name $invalid
   * @propertyOf angular.module.ng.$formFactory.Form
   * @description
   * Property of the form and widget instance.
   *
   * True if any of the widgets of the form are invalid.
   */

  /**
   * @ngdoc property
   * @name $valid
   * @propertyOf angular.module.ng.$formFactory.Form
   * @description
   * Property of the form and widget instance.
   *
   * True if all of the widgets of the form are valid.
   */

  /**
   * @ngdoc event
   * @name angular.module.ng.$formFactory.Form#$valid
   * @eventOf angular.module.ng.$formFactory.Form
   * @eventType listen on form
   * @description
   * Upon receiving the `$valid` event from the widget update the `$error`, `$valid` and `$invalid`
   * properties of both the widget as well as the from.
   *
   * @param {string} validationKey The validation key to be used when updating the `$error` object.
   *    The validation key is what will allow the template to bind to a specific validation error
   *    such as `<div ng:show="form.$error.KEY">error for key</div>`.
   */

  /**
   * @ngdoc event
   * @name angular.module.ng.$formFactory.Form#$invalid
   * @eventOf angular.module.ng.$formFactory.Form
   * @eventType listen on form
   * @description
   * Upon receiving the `$invalid` event from the widget update the `$error`, `$valid` and `$invalid`
   * properties of both the widget as well as the from.
   *
   * @param {string} validationKey The validation key to be used when updating the `$error` object.
   *    The validation key is what will allow the template to bind to a specific validation error
   *    such as `<div ng:show="form.$error.KEY">error for key</div>`.
   */

  /**
   * @ngdoc event
   * @name angular.module.ng.$formFactory.Form#$validate
   * @eventOf angular.module.ng.$formFactory.Form
   * @eventType emit on widget
   * @description
   * Emit the `$validate` event on the widget, giving a widget a chance to emit a
   * `$valid` / `$invalid` event base on its state. The `$validate` event is triggered when the
   * model or the view changes.
   */

  /**
   * @ngdoc event
   * @name angular.module.ng.$formFactory.Form#$viewChange
   * @eventOf angular.module.ng.$formFactory.Form
   * @eventType listen on widget
   * @description
   * A widget is responsible for emitting this event whenever the view changes do to user interaction.
   * The event takes a `$viewValue` parameter, which is the new value of the view. This
   * event triggers a call to `$parseView()` as well as `$validate` event on widget.
   *
   * @param {*} viewValue The new value for the view which will be assigned to `widget.$viewValue`.
   */

  function FormController() {
    var form = this,
        $error = form.$error = {};

    form.$on('$destroy', function(event){
      var widget = event.targetScope;
      if (widget.$widgetId) {
        delete form[widget.$widgetId];
      }
      forEach($error, removeWidget, widget);
    });

    form.$on('$valid', function(event, error){
      var widget = event.targetScope;
      delete widget.$error[error];
      propertiesUpdate(widget);
      removeWidget($error[error], error, widget);
    });

    form.$on('$invalid', function(event, error){
      var widget = event.targetScope;
      addWidget(error, widget);
      widget.$error[error] = true;
      propertiesUpdate(widget);
    });

    propertiesUpdate(form);

    function removeWidget(queue, errorKey, widget) {
      if (queue) {
        widget = widget || this; // so that we can be used in forEach;
        for (var i = 0, length = queue.length; i < length; i++) {
          if (queue[i] === widget) {
            queue.splice(i, 1);
            if (!queue.length) {
              delete $error[errorKey];
            }
          }
        }
        propertiesUpdate(form);
      }
    }

    function addWidget(errorKey, widget) {
      var queue = $error[errorKey];
      if (queue) {
        for (var i = 0, length = queue.length; i < length; i++) {
          if (queue[i] === widget) {
            return;
          }
        }
      } else {
        $error[errorKey] = queue = [];
      }
      queue.push(widget);
      propertiesUpdate(form);
    }
  }


  /**
   * @ngdoc method
   * @name $createWidget
   * @methodOf angular.module.ng.$formFactory.Form
   * @description
   *
   * Use form's `$createWidget` instance method to create new widgets. The widgets can be created
   * using an alias which makes the accessible from the form and available for data-binding,
   * useful for displaying validation error messages.
   *
   * The creation of a widget sets up:
   *
   *   - `$watch` of `expression` on `model` scope. This code path syncs the model to the view.
   *      The `$watch` listener will:
   *
   *     - assign the new model value of `expression` to `widget.$modelValue`.
   *     - call `widget.$parseModel` method if present. The `$parseModel` is responsible for copying
   *       the `widget.$modelValue` to `widget.$viewValue` and optionally converting the data.
   *       (For example to convert a number into string)
   *     - emits `$validate` event on widget giving a widget a chance to emit `$valid` / `$invalid`
   *       event.
   *     - call `widget.$render()` method on widget. The `$render` method is responsible for
   *       reading the `widget.$viewValue` and updating the DOM.
   *
   *   - Listen on `$viewChange` event from the `widget`. This code path syncs the view to the model.
   *     The `$viewChange` listener will:
   *
   *     - assign the value to `widget.$viewValue`.
   *     - call `widget.$parseView` method if present. The `$parseView` is responsible for copying
   *       the `widget.$viewValue` to `widget.$modelValue` and optionally converting the data.
   *       (For example to convert a string into number)
   *     - emits `$validate` event on widget giving a widget a chance to emit `$valid` / `$invalid`
   *       event.
   *     - Assign the  `widget.$modelValue` to the `expression` on the `model` scope.
   *
   *   - Creates these set of properties on the `widget` which are updated as a response to the
   *     `$valid` / `$invalid` events:
   *
   *     - `$error` -  object - validation errors will be published as keys on this object.
   *       Data-binding to this property is useful for displaying the validation errors.
   *     - `$valid` - boolean - true if there are no validation errors
   *     - `$invalid` - boolean - opposite of `$valid`.
   * @param {Object} params Named parameters:
   *
   *   - `scope` - `{Scope}` -  The scope to which the model for this widget is attached.
   *   - `model` - `{string}` - The name of the model property on model scope.
   *   - `controller` - {WidgetController} - The controller constructor function.
   *      The controller constructor should create these instance methods.
   *     - `$parseView()`: optional method responsible for copying `$viewVale` to `$modelValue`.
   *         The method may fire `$valid`/`$invalid` events.
   *     - `$parseModel()`: optional method responsible for copying `$modelVale` to `$viewValue`.
   *         The method may fire `$valid`/`$invalid` events.
   *     - `$render()`: required method which needs to update the DOM of the widget to match the
   *         `$viewValue`.
   *
   *   - `controllerArgs` - `{Array}` (Optional) -  Any extra arguments will be curried to the
   *     WidgetController constructor.
   *   - `onChange` - `{(string|function())}` (Optional) - Expression to execute when user changes the
   *     value.
   *   - `alias` - `{string}` (Optional) - The name of the form property under which the widget
   *     instance should be published. The name should be unique for each form.
   * @returns {Widget} Instance of a widget scope.
   */
  FormController.prototype.$createWidget = function(params) {
    var form = this,
        modelScope = params.scope,
        onChange = params.onChange,
        alias = params.alias,
        scopeGet = $parse(params.model),
        scopeSet = scopeGet.assign,
        widget = this.$new(params.controller, params.controllerArgs);

    if (!scopeSet) {
      throw Error("Expression '" + params.model + "' is not assignable!");
    };

    widget.$error = {};
    // Set the state to something we know will change to get the process going.
    widget.$modelValue = Number.NaN;
    // watch for scope changes and update the view appropriately
    modelScope.$watch(scopeGet, function(scope, value) {
      if (!equals(widget.$modelValue, value)) {
        widget.$modelValue = value;
        widget.$parseModel ? widget.$parseModel() : (widget.$viewValue = value);
        widget.$emit('$validate');
        widget.$render && widget.$render();
      }
    });

    widget.$on('$viewChange', function(event, viewValue){
      if (!equals(widget.$viewValue, viewValue)) {
        widget.$viewValue = viewValue;
        widget.$parseView ? widget.$parseView() : (widget.$modelValue = widget.$viewValue);
        scopeSet(modelScope, widget.$modelValue);
        if (onChange) modelScope.$eval(onChange);
        widget.$emit('$validate');
      }
    });

    propertiesUpdate(widget);

    // assign the widgetModel to the form
    if (alias && !form.hasOwnProperty(alias)) {
      form[alias] = widget;
      widget.$widgetId = alias;
    } else {
      alias = null;
    }

    return widget;
  };
}

function $InterpolateProvider(){
  this.$get = ['$parse', function($parse){
    return function(text, templateOnly) {
      var bindings = parseBindings(text);
      if (hasBindings(bindings) || !templateOnly) {
        return compileBindTemplate(text);
      }
    };
  }];
}

var bindTemplateCache = {};
function compileBindTemplate(template){
  var fn = bindTemplateCache[template];
  if (!fn) {
    var bindings = [];
    forEach(parseBindings(template), function(text){
      var exp = binding(text);
      bindings.push(exp
        ? function(scope, element) { return scope.$eval(exp); }
        : function() { return text; });
    });
    bindTemplateCache[template] = fn = function(scope, element, prettyPrintJson) {
      var parts = [],
          hadOwnElement = scope.hasOwnProperty('$element'),
          oldElement = scope.$element;

      // TODO(misko): get rid of $element
      scope.$element = element;
      try {
        for (var i = 0; i < bindings.length; i++) {
          var value = bindings[i](scope, element);
          if (isElement(value))
            value = '';
          else if (isObject(value))
            value = toJson(value, prettyPrintJson);
          parts.push(value);
        }
        return parts.join('');
      } finally {
        if (hadOwnElement) {
          scope.$element = oldElement;
        } else {
          delete scope.$element;
        }
      }
    };
  }
  return fn;
}


function parseBindings(string) {
  var results = [];
  var lastIndex = 0;
  var index;
  while((index = string.indexOf('{{', lastIndex)) > -1) {
    if (lastIndex < index)
      results.push(string.substr(lastIndex, index - lastIndex));
    lastIndex = index;

    index = string.indexOf('}}', index);
    index = index < 0 ? string.length : index + 2;

    results.push(string.substr(lastIndex, index - lastIndex));
    lastIndex = index;
  }
  if (lastIndex != string.length)
    results.push(string.substr(lastIndex, string.length - lastIndex));
  return results.length === 0 ? [ string ] : results;
}

function binding(string) {
  var binding = string.replace(/\n/gm, ' ').match(/^\{\{(.*)\}\}$/);
  return binding ? binding[1] : null;
}

function hasBindings(bindings) {
  return bindings.length > 1 || binding(bindings[0]) !== null;
}

var URL_MATCH = /^(file|ftp|http|https):\/\/(\w+:{0,1}\w*@)?([\w\.-]*)(:([0-9]+))?(\/[^\?#]*)?(\?([^#]*))?(#(.*))?$/,
    PATH_MATCH = /^([^\?#]*)?(\?([^#]*))?(#(.*))?$/,
    HASH_MATCH = PATH_MATCH,
    DEFAULT_PORTS = {'http': 80, 'https': 443, 'ftp': 21};


/**
 * Encode path using encodeUriSegment, ignoring forward slashes
 *
 * @param {string} path Path to encode
 * @returns {string}
 */
function encodePath(path) {
  var segments = path.split('/'),
      i = segments.length;

  while (i--) {
    segments[i] = encodeUriSegment(segments[i]);
  }

  return segments.join('/');
}


function matchUrl(url, obj) {
  var match = URL_MATCH.exec(url);

  match = {
      protocol: match[1],
      host: match[3],
      port: parseInt(match[5], 10) || DEFAULT_PORTS[match[1]] || null,
      path: match[6] || '/',
      search: match[8],
      hash: match[10]
    };

  if (obj) {
    obj.$$protocol = match.protocol;
    obj.$$host = match.host;
    obj.$$port = match.port;
  }

  return match;
}


function composeProtocolHostPort(protocol, host, port) {
  return protocol + '://' + host + (port == DEFAULT_PORTS[protocol] ? '' : ':' + port);
}


function pathPrefixFromBase(basePath) {
  return basePath.substr(0, basePath.lastIndexOf('/'));
}


function convertToHtml5Url(url, basePath, hashPrefix) {
  var match = matchUrl(url);

  // already html5 url
  if (decodeURIComponent(match.path) != basePath || isUndefined(match.hash) ||
      match.hash.indexOf(hashPrefix) !== 0) {
    return url;
  // convert hashbang url -> html5 url
  } else {
    return composeProtocolHostPort(match.protocol, match.host, match.port) +
           pathPrefixFromBase(basePath) + match.hash.substr(hashPrefix.length);
  }
}


function convertToHashbangUrl(url, basePath, hashPrefix) {
  var match = matchUrl(url);

  // already hashbang url
  if (decodeURIComponent(match.path) == basePath) {
    return url;
  // convert html5 url -> hashbang url
  } else {
    var search = match.search && '?' + match.search || '',
        hash = match.hash && '#' + match.hash || '',
        pathPrefix = pathPrefixFromBase(basePath),
        path = match.path.substr(pathPrefix.length);

    if (match.path.indexOf(pathPrefix) !== 0) {
      throw 'Invalid url "' + url + '", missing path prefix "' + pathPrefix + '" !';
    }

    return composeProtocolHostPort(match.protocol, match.host, match.port) + basePath +
           '#' + hashPrefix + path + search + hash;
  }
}


/**
 * LocationUrl represents an url
 * This object is exposed as $location service when HTML5 mode is enabled and supported
 *
 * @constructor
 * @param {string} url HTML5 url
 * @param {string} pathPrefix
 */
function LocationUrl(url, pathPrefix) {
  pathPrefix = pathPrefix || '';

  /**
   * Parse given html5 (regular) url string into properties
   * @param {string} url HTML5 url
   * @private
   */
  this.$$parse = function(url) {
    var match = matchUrl(url, this);

    if (match.path.indexOf(pathPrefix) !== 0) {
      throw 'Invalid url "' + url + '", missing path prefix "' + pathPrefix + '" !';
    }

    this.$$path = decodeURIComponent(match.path.substr(pathPrefix.length));
    this.$$search = parseKeyValue(match.search);
    this.$$hash = match.hash && decodeURIComponent(match.hash) || '';

    this.$$compose();
  };

  /**
   * Compose url and update `absUrl` property
   * @private
   */
  this.$$compose = function() {
    var search = toKeyValue(this.$$search),
        hash = this.$$hash ? '#' + encodeUriSegment(this.$$hash) : '';

    this.$$url = encodePath(this.$$path) + (search ? '?' + search : '') + hash;
    this.$$absUrl = composeProtocolHostPort(this.$$protocol, this.$$host, this.$$port) +
                    pathPrefix + this.$$url;
  };

  this.$$parse(url);
}


/**
 * LocationHashbangUrl represents url
 * This object is exposed as $location service when html5 history api is disabled or not supported
 *
 * @constructor
 * @param {string} url Legacy url
 * @param {string} hashPrefix Prefix for hash part (containing path and search)
 */
function LocationHashbangUrl(url, hashPrefix) {
  var basePath;

  /**
   * Parse given hashbang url into properties
   * @param {string} url Hashbang url
   * @private
   */
  this.$$parse = function(url) {
    var match = matchUrl(url, this);

    if (match.hash && match.hash.indexOf(hashPrefix) !== 0) {
      throw 'Invalid url "' + url + '", missing hash prefix "' + hashPrefix + '" !';
    }

    basePath = match.path + (match.search ? '?' + match.search : '');
    match = HASH_MATCH.exec((match.hash || '').substr(hashPrefix.length));
    if (match[1]) {
      this.$$path = (match[1].charAt(0) == '/' ? '' : '/') + decodeURIComponent(match[1]);
    } else {
      this.$$path = '';
    }

    this.$$search = parseKeyValue(match[3]);
    this.$$hash = match[5] && decodeURIComponent(match[5]) || '';

    this.$$compose();
  };

  /**
   * Compose hashbang url and update `absUrl` property
   * @private
   */
  this.$$compose = function() {
    var search = toKeyValue(this.$$search),
        hash = this.$$hash ? '#' + encodeUriSegment(this.$$hash) : '';

    this.$$url = encodePath(this.$$path) + (search ? '?' + search : '') + hash;
    this.$$absUrl = composeProtocolHostPort(this.$$protocol, this.$$host, this.$$port) +
                    basePath + (this.$$url ? '#' + hashPrefix + this.$$url : '');
  };

  this.$$parse(url);
}


LocationUrl.prototype = {

  /**
   * Has any change been replacing ?
   * @private
   */
  $$replace: false,

  /**
   * @ngdoc method
   * @name angular.module.ng.$location#absUrl
   * @methodOf angular.module.ng.$location
   *
   * @description
   * This method is getter only.
   *
   * Return full url representation with all segments encoded according to rules specified in
   * {@link http://www.ietf.org/rfc/rfc3986.txt RFC 3986}.
   *
   * @return {string}
   */
  absUrl: locationGetter('$$absUrl'),

  /**
   * @ngdoc method
   * @name angular.module.ng.$location#url
   * @methodOf angular.module.ng.$location
   *
   * @description
   * This method is getter / setter.
   *
   * Return url (e.g. `/path?a=b#hash`) when called without any parameter.
   *
   * Change path, search and hash, when called with parameter and return `$location`.
   *
   * @param {string=} url New url without base prefix (e.g. `/path?a=b#hash`)
   * @return {string}
   */
  url: function(url, replace) {
    if (isUndefined(url))
      return this.$$url;

    var match = PATH_MATCH.exec(url);
    if (match[1]) this.path(decodeURIComponent(match[1]));
    if (match[2] || match[1]) this.search(match[3] || '');
    this.hash(match[5] || '', replace);

    return this;
  },

  /**
   * @ngdoc method
   * @name angular.module.ng.$location#protocol
   * @methodOf angular.module.ng.$location
   *
   * @description
   * This method is getter only.
   *
   * Return protocol of current url.
   *
   * @return {string}
   */
  protocol: locationGetter('$$protocol'),

  /**
   * @ngdoc method
   * @name angular.module.ng.$location#host
   * @methodOf angular.module.ng.$location
   *
   * @description
   * This method is getter only.
   *
   * Return host of current url.
   *
   * @return {string}
   */
  host: locationGetter('$$host'),

  /**
   * @ngdoc method
   * @name angular.module.ng.$location#port
   * @methodOf angular.module.ng.$location
   *
   * @description
   * This method is getter only.
   *
   * Return port of current url.
   *
   * @return {Number}
   */
  port: locationGetter('$$port'),

  /**
   * @ngdoc method
   * @name angular.module.ng.$location#path
   * @methodOf angular.module.ng.$location
   *
   * @description
   * This method is getter / setter.
   *
   * Return path of current url when called without any parameter.
   *
   * Change path when called with parameter and return `$location`.
   *
   * Note: Path should always begin with forward slash (/), this method will add the forward slash
   * if it is missing.
   *
   * @param {string=} path New path
   * @return {string}
   */
  path: locationGetterSetter('$$path', function(path) {
    return path.charAt(0) == '/' ? path : '/' + path;
  }),

  /**
   * @ngdoc method
   * @name angular.module.ng.$location#search
   * @methodOf angular.module.ng.$location
   *
   * @description
   * This method is getter / setter.
   *
   * Return search part (as object) of current url when called without any parameter.
   *
   * Change search part when called with parameter and return `$location`.
   *
   * @param {string|object<string,string>=} search New search params - string or hash object
   * @param {string=} paramValue If `search` is a string, then `paramValue` will override only a
   *    single search parameter. If the value is `null`, the parameter will be deleted.
   *
   * @return {string}
   */
  search: function(search, paramValue) {
    if (isUndefined(search))
      return this.$$search;

    if (isDefined(paramValue)) {
      if (paramValue === null) {
        delete this.$$search[search];
      } else {
        this.$$search[search] = encodeUriQuery(paramValue);
      }
    } else {
      this.$$search = isString(search) ? parseKeyValue(search) : search;
    }

    this.$$compose();
    return this;
  },

  /**
   * @ngdoc method
   * @name angular.module.ng.$location#hash
   * @methodOf angular.module.ng.$location
   *
   * @description
   * This method is getter / setter.
   *
   * Return hash fragment when called without any parameter.
   *
   * Change hash fragment when called with parameter and return `$location`.
   *
   * @param {string=} hash New hash fragment
   * @return {string}
   */
  hash: locationGetterSetter('$$hash', identity),

  /**
   * @ngdoc method
   * @name angular.module.ng.$location#replace
   * @methodOf angular.module.ng.$location
   *
   * @description
   * If called, all changes to $location during current `$digest` will be replacing current history
   * record, instead of adding new one.
   */
  replace: function() {
    this.$$replace = true;
    return this;
  }
};

LocationHashbangUrl.prototype = inherit(LocationUrl.prototype);

function locationGetter(property) {
  return function() {
    return this[property];
  };
}


function locationGetterSetter(property, preprocess) {
  return function(value) {
    if (isUndefined(value))
      return this[property];

    this[property] = preprocess(value);
    this.$$compose();

    return this;
  };
}


/**
 * @ngdoc object
 * @name angular.module.ng.$location
 *
 * @requires $browser
 * @requires $sniffer
 * @requires $document
 *
 * @description
 * The $location service parses the URL in the browser address bar (based on the {@link https://developer.mozilla.org/en/window.location window.location}) and makes the URL available to your application. Changes to the URL in the address bar are reflected into $location service and changes to $location are reflected into the browser address bar.
 *
 * **The $location service:**
 *
 * - Exposes the current URL in the browser address bar, so you can
 *   - Watch and observe the URL.
 *   - Change the URL.
 * - Synchronizes the URL with the browser when the user
 *   - Changes the address bar.
 *   - Clicks the back or forward button (or clicks a History link).
 *   - Clicks on a link.
 * - Represents the URL object as a set of methods (protocol, host, port, path, search, hash).
 *
 * For more information see {@link guide/dev_guide.services.$location Developer Guide: Angular Services: Using $location}
 */

/**
 * @ngdoc object
 * @name angular.module.ng.$locationProvider
 * @description
 * Use the `$locationProvider` to configure how the application deep linking paths are stored.
 */
function $LocationProvider(){
  var hashPrefix = '',
      html5Mode = false;

  /**
   * @ngdoc property
   * @name angular.module.ng.$locationProvider#hashPrefix
   * @methodOf angular.module.ng.$locationProvider
   * @description
   * @param {string=} prefix Prefix for hash part (containing path and search)
   * @returns {*} current value if used as getter or itself (chaining) if used as setter
   */
  this.hashPrefix = function(prefix) {
    if (isDefined(prefix)) {
      hashPrefix = prefix;
      return this;
    } else {
      return hashPrefix;
    }
  }

  /**
   * @ngdoc property
   * @name angular.module.ng.$locationProvider#html5Mode
   * @methodOf angular.module.ng.$locationProvider
   * @description
   * @param {string=} mode Use HTML5 strategy if available.
   * @returns {*} current value if used as getter or itself (chaining) if used as setter
   */
  this.html5Mode = function(mode) {
    if (isDefined(mode)) {
      html5Mode = mode;
      return this;
    } else {
      return html5Mode;
    }
  };

  this.$get = ['$rootScope', '$browser', '$sniffer', '$document',
      function( $rootScope,   $browser,   $sniffer,   $document) {
    var currentUrl,
        basePath = $browser.baseHref() || '/',
        pathPrefix = pathPrefixFromBase(basePath),
        initUrl = $browser.url();

    if (html5Mode) {
      if ($sniffer.history) {
        currentUrl = new LocationUrl(convertToHtml5Url(initUrl, basePath, hashPrefix), pathPrefix);
      } else {
        currentUrl = new LocationHashbangUrl(convertToHashbangUrl(initUrl, basePath, hashPrefix),
                                             hashPrefix);
      }

      // link rewriting
      var u = currentUrl,
          absUrlPrefix = composeProtocolHostPort(u.protocol(), u.host(), u.port()) + pathPrefix;

      $document.bind('click', function(event) {
        // TODO(vojta): rewrite link when opening in new tab/window (in legacy browser)
        // currently we open nice url link and redirect then

        if (event.ctrlKey || event.metaKey || event.which == 2) return;

        var elm = jqLite(event.target);

        // traverse the DOM up to find first A tag
        while (elm.length && lowercase(elm[0].nodeName) !== 'a') {
          elm = elm.parent();
        }

        var href = elm.attr('href');
        if (!href || isDefined(elm.attr('ng:ext-link')) || elm.attr('target')) return;

        // remove same domain from full url links (IE7 always returns full hrefs)
        href = href.replace(absUrlPrefix, '');

        // link to different domain (or base path)
        if (href.substr(0, 4) == 'http') return;

        // remove pathPrefix from absolute links
        href = href.indexOf(pathPrefix) === 0 ? href.substr(pathPrefix.length) : href;

        currentUrl.url(href);
        $rootScope.$apply();
        event.preventDefault();
        // hack to work around FF6 bug 684208 when scenario runner clicks on links
        window.angular['ff-684208-preventDefault'] = true;
      });
    } else {
      currentUrl = new LocationHashbangUrl(initUrl, hashPrefix);
    }

    // rewrite hashbang url <> html5 url
    if (currentUrl.absUrl() != initUrl) {
      $browser.url(currentUrl.absUrl(), true);
    }

    // update $location when $browser url changes
    $browser.onUrlChange(function(newUrl) {
      if (currentUrl.absUrl() != newUrl) {
        $rootScope.$evalAsync(function() {
          currentUrl.$$parse(newUrl);
        });
        if (!$rootScope.$$phase) $rootScope.$digest();
      }
    });

    // update browser
    var changeCounter = 0;
    $rootScope.$watch(function $locationWatch() {
      if ($browser.url() != currentUrl.absUrl()) {
        changeCounter++;
        $rootScope.$evalAsync(function() {
          $browser.url(currentUrl.absUrl(), currentUrl.$$replace);
          currentUrl.$$replace = false;
        });
      }

      return changeCounter;
    });

    return currentUrl;
}];
}

/**
 * @ngdoc object
 * @name angular.module.ng.$log
 * @requires $window
 *
 * @description
 * Simple service for logging. Default implementation writes the message
 * into the browser's console (if present).
 *
 * The main purpose of this service is to simplify debugging and troubleshooting.
 *
 * @example
    <doc:example>
      <doc:source>
         <script>
           function LogCtrl($log) {
             this.$log = $log;
             this.message = 'Hello World!';
           }
         </script>
         <div ng:controller="LogCtrl">
           <p>Reload this page with open console, enter text and hit the log button...</p>
           Message:
           <input type="text" ng:model="message"/>
           <button ng:click="$log.log(message)">log</button>
           <button ng:click="$log.warn(message)">warn</button>
           <button ng:click="$log.info(message)">info</button>
           <button ng:click="$log.error(message)">error</button>
         </div>
      </doc:source>
      <doc:scenario>
      </doc:scenario>
    </doc:example>
 */

function $LogProvider(){
  this.$get = ['$window', function($window){
    return {
      /**
       * @ngdoc method
       * @name angular.module.ng.$log#log
       * @methodOf angular.module.ng.$log
       *
       * @description
       * Write a log message
       */
      log: consoleLog('log'),

      /**
       * @ngdoc method
       * @name angular.module.ng.$log#warn
       * @methodOf angular.module.ng.$log
       *
       * @description
       * Write a warning message
       */
      warn: consoleLog('warn'),

      /**
       * @ngdoc method
       * @name angular.module.ng.$log#info
       * @methodOf angular.module.ng.$log
       *
       * @description
       * Write an information message
       */
      info: consoleLog('info'),

      /**
       * @ngdoc method
       * @name angular.module.ng.$log#error
       * @methodOf angular.module.ng.$log
       *
       * @description
       * Write an error message
       */
      error: consoleLog('error')
    };

    function formatError(arg) {
      if (arg instanceof Error) {
        if (arg.stack) {
          arg = (arg.message && arg.stack.indexOf(arg.message) === -1) ?
                'Error: ' + arg.message + '\n' + arg.stack : arg.stack;
        } else if (arg.sourceURL) {
          arg = arg.message + '\n' + arg.sourceURL + ':' + arg.line;
        }
      }
      return arg;
    }

    function consoleLog(type) {
      var console = $window.console || {};
      var logFn = console[type] || console.log || noop;
      if (logFn.apply) {
        return function() {
          var args = [];
          forEach(arguments, function(arg){
            args.push(formatError(arg));
          });
          return logFn.apply(console, args);
        };
      } else {
        // we are IE, in which case there is nothing we can do
        return logFn;
      }
    }
  }];
}

/**
 * @ngdoc object
 * @name angular.module.ng.$resource
 * @requires $http
 *
 * @description
 * A factory which creates a resource object that lets you interact with
 * [RESTful](http://en.wikipedia.org/wiki/Representational_State_Transfer) server-side data sources.
 *
 * The returned resource object has action methods which provide high-level behaviors without
 * the need to interact with the low level {@link angular.module.ng.$http $http} service.
 *
 * @param {string} url A parameterized URL template with parameters prefixed by `:` as in
 *   `/user/:username`.
 *
 * @param {Object=} paramDefaults Default values for `url` parameters. These can be overridden in
 *   `actions` methods.
 *
 *   Each key value in the parameter object is first bound to url template if present and then any
 *   excess keys are appended to the url search query after the `?`.
 *
 *   Given a template `/path/:verb` and parameter `{verb:'greet', salutation:'Hello'}` results in
 *   URL `/path/greet?salutation=Hello`.
 *
 *   If the parameter value is prefixed with `@` then the value of that parameter is extracted from
 *   the data object (useful for non-GET operations).
 *
 * @param {Object.<Object>=} actions Hash with declaration of custom action that should extend the
 *   default set of resource actions. The declaration should be created in the following format:
 *
 *       {action1: {method:?, params:?, isArray:?},
 *        action2: {method:?, params:?, isArray:?},
 *        ...}
 *
 *   Where:
 *
 *   - `action` ??? {string} ??? The name of action. This name becomes the name of the method on your
 *     resource object.
 *   - `method` ??? {string} ??? HTTP request method. Valid methods are: `GET`, `POST`, `PUT`, `DELETE`,
 *     and `JSONP`
 *   - `params` ??? {object=} ??? Optional set of pre-bound parameters for this action.
 *   - isArray ??? {boolean=} ??? If true then the returned object for this action is an array, see
 *     `returns` section.
 *
 * @returns {Object} A resource "class" object with methods for the default set of resource actions
 *   optionally extended with custom `actions`. The default set contains these actions:
 *
 *       { 'get':    {method:'GET'},
 *         'save':   {method:'POST'},
 *         'query':  {method:'GET', isArray:true},
 *         'remove': {method:'DELETE'},
 *         'delete': {method:'DELETE'} };
 *
 *   Calling these methods invoke an {@link angular.module.ng.$http} with the specified http method,
 *   destination and parameters. When the data is returned from the server then the object is an
 *   instance of the resource class `save`, `remove` and `delete` actions are available on it as
 *   methods with the `$` prefix. This allows you to easily perform CRUD operations (create, read,
 *   update, delete) on server-side data like this:
 *   <pre>
        var User = $resource('/user/:userId', {userId:'@id'});
        var user = User.get({userId:123}, function() {
          user.abc = true;
          user.$save();
        });
     </pre>
 *
 *   It is important to realize that invoking a $resource object method immediately returns an
 *   empty reference (object or array depending on `isArray`). Once the data is returned from the
 *   server the existing reference is populated with the actual data. This is a useful trick since
 *   usually the resource is assigned to a model which is then rendered by the view. Having an empty
 *   object results in no rendering, once the data arrives from the server then the object is
 *   populated with the data and the view automatically re-renders itself showing the new data. This
 *   means that in most case one never has to write a callback function for the action methods.
 *
 *   The action methods on the class object or instance object can be invoked with the following
 *   parameters:
 *
 *   - HTTP GET "class" actions: `Resource.action([parameters], [success], [error])`
 *   - non-GET "class" actions: `Resource.action([parameters], postData, [success], [error])`
 *   - non-GET instance actions:  `instance.$action([parameters], [success], [error])`
 *
 *
 * @example
 *
 * # Credit card resource
 *
 * <pre>
     // Define CreditCard class
     var CreditCard = $resource('/user/:userId/card/:cardId',
      {userId:123, cardId:'@id'}, {
       charge: {method:'POST', params:{charge:true}}
      });

     // We can retrieve a collection from the server
     var cards = CreditCard.query();
     // GET: /user/123/card
     // server returns: [ {id:456, number:'1234', name:'Smith'} ];

     var card = cards[0];
     // each item is an instance of CreditCard
     expect(card instanceof CreditCard).toEqual(true);
     card.name = "J. Smith";
     // non GET methods are mapped onto the instances
     card.$save();
     // POST: /user/123/card/456 {id:456, number:'1234', name:'J. Smith'}
     // server returns: {id:456, number:'1234', name: 'J. Smith'};

     // our custom method is mapped as well.
     card.$charge({amount:9.99});
     // POST: /user/123/card/456?amount=9.99&charge=true {id:456, number:'1234', name:'J. Smith'}
     // server returns: {id:456, number:'1234', name: 'J. Smith'};

     // we can create an instance as well
     var newCard = new CreditCard({number:'0123'});
     newCard.name = "Mike Smith";
     newCard.$save();
     // POST: /user/123/card {number:'0123', name:'Mike Smith'}
     // server returns: {id:789, number:'01234', name: 'Mike Smith'};
     expect(newCard.id).toEqual(789);
 * </pre>
 *
 * The object returned from this function execution is a resource "class" which has "static" method
 * for each action in the definition.
 *
 * Calling these methods invoke `$http` on the `url` template with the given `method` and `params`.
 * When the data is returned from the server then the object is an instance of the resource type and
 * all of the non-GET methods are available with `$` prefix. This allows you to easily support CRUD
 * operations (create, read, update, delete) on server-side data.

   <pre>
     var User = $resource('/user/:userId', {userId:'@id'});
     var user = User.get({userId:123}, function() {
       user.abc = true;
       user.$save();
     });
   </pre>
 *
 *     It's worth noting that the success callback for `get`, `query` and other method gets passed
 *     in the response that came from the server as well as $http header getter function, so one
 *     could rewrite the above example and get access to http headers as:
 *
   <pre>
     var User = $resource('/user/:userId', {userId:'@id'});
     User.get({userId:123}, function(u, getResponseHeaders){
       u.abc = true;
       u.$save(function(u, putResponseHeaders) {
         //u => saved user object
         //putResponseHeaders => $http header getter
       });
     });
   </pre>

 * # Buzz client

   Let's look at what a buzz client created with the `$resource` service looks like:
    <doc:example>
      <doc:source jsfiddle="false">
       <script>
         function BuzzController($resource) {
           this.userId = 'googlebuzz';
           this.Activity = $resource(
             'https://www.googleapis.com/buzz/v1/activities/:userId/:visibility/:activityId/:comments',
             {alt:'json', callback:'JSON_CALLBACK'},
             {get:{method:'JSONP', params:{visibility:'@self'}}, replies: {method:'JSONP', params:{visibility:'@self', comments:'@comments'}}}
           );
         }

         BuzzController.prototype = {
           fetch: function() {
             this.activities = this.Activity.get({userId:this.userId});
           },
           expandReplies: function(activity) {
             activity.replies = this.Activity.replies({userId:this.userId, activityId:activity.id});
           }
         };
         BuzzController.$inject = ['$resource'];
       </script>

       <div ng:controller="BuzzController">
         <input ng:model="userId"/>
         <button ng:click="fetch()">fetch</button>
         <hr/>
         <div ng:repeat="item in activities.data.items">
           <h1 style="font-size: 15px;">
             <img src="{{item.actor.thumbnailUrl}}" style="max-height:30px;max-width:30px;"/>
             <a href="{{item.actor.profileUrl}}">{{item.actor.name}}</a>
             <a href ng:click="expandReplies(item)" style="float: right;">Expand replies: {{item.links.replies[0].count}}</a>
           </h1>
           {{item.object.content | html}}
           <div ng:repeat="reply in item.replies.data.items" style="margin-left: 20px;">
             <img src="{{reply.actor.thumbnailUrl}}" style="max-height:30px;max-width:30px;"/>
             <a href="{{reply.actor.profileUrl}}">{{reply.actor.name}}</a>: {{reply.content | html}}
           </div>
         </div>
       </div>
      </doc:source>
      <doc:scenario>
      </doc:scenario>
    </doc:example>
 */
function $ResourceProvider() {
  this.$get = ['$http', function($http) {
    var resource = new ResourceFactory($http);
    return bind(resource, resource.route);
  }];
}

var OPERATORS = {
    'null':function(self){return null;},
    'true':function(self){return true;},
    'false':function(self){return false;},
    $undefined:noop,
    '+':function(self, a,b){a=a(self); b=b(self); return (isDefined(a)?a:0)+(isDefined(b)?b:0);},
    '-':function(self, a,b){a=a(self); b=b(self); return (isDefined(a)?a:0)-(isDefined(b)?b:0);},
    '*':function(self, a,b){return a(self)*b(self);},
    '/':function(self, a,b){return a(self)/b(self);},
    '%':function(self, a,b){return a(self)%b(self);},
    '^':function(self, a,b){return a(self)^b(self);},
    '=':noop,
    '==':function(self, a,b){return a(self)==b(self);},
    '!=':function(self, a,b){return a(self)!=b(self);},
    '<':function(self, a,b){return a(self)<b(self);},
    '>':function(self, a,b){return a(self)>b(self);},
    '<=':function(self, a,b){return a(self)<=b(self);},
    '>=':function(self, a,b){return a(self)>=b(self);},
    '&&':function(self, a,b){return a(self)&&b(self);},
    '||':function(self, a,b){return a(self)||b(self);},
    '&':function(self, a,b){return a(self)&b(self);},
//    '|':function(self, a,b){return a|b;},
    '|':function(self, a,b){return b(self)(self, a(self));},
    '!':function(self, a){return !a(self);}
};
var ESCAPE = {"n":"\n", "f":"\f", "r":"\r", "t":"\t", "v":"\v", "'":"'", '"':'"'};

function lex(text){
  var tokens = [],
      token,
      index = 0,
      json = [],
      ch,
      lastCh = ':'; // can start regexp

  while (index < text.length) {
    ch = text.charAt(index);
    if (is('"\'')) {
      readString(ch);
    } else if (isNumber(ch) || is('.') && isNumber(peek())) {
      readNumber();
    } else if (isIdent(ch)) {
      readIdent();
      // identifiers can only be if the preceding char was a { or ,
      if (was('{,') && json[0]=='{' &&
         (token=tokens[tokens.length-1])) {
        token.json = token.text.indexOf('.') == -1;
      }
    } else if (is('(){}[].,;:')) {
      tokens.push({
        index:index,
        text:ch,
        json:(was(':[,') && is('{[')) || is('}]:,')
      });
      if (is('{[')) json.unshift(ch);
      if (is('}]')) json.shift();
      index++;
    } else if (isWhitespace(ch)) {
      index++;
      continue;
    } else {
      var ch2 = ch + peek(),
          fn = OPERATORS[ch],
          fn2 = OPERATORS[ch2];
      if (fn2) {
        tokens.push({index:index, text:ch2, fn:fn2});
        index += 2;
      } else if (fn) {
        tokens.push({index:index, text:ch, fn:fn, json: was('[,:') && is('+-')});
        index += 1;
      } else {
        throwError("Unexpected next character ", index, index+1);
      }
    }
    lastCh = ch;
  }
  return tokens;

  function is(chars) {
    return chars.indexOf(ch) != -1;
  }

  function was(chars) {
    return chars.indexOf(lastCh) != -1;
  }

  function peek() {
    return index + 1 < text.length ? text.charAt(index + 1) : false;
  }
  function isNumber(ch) {
    return '0' <= ch && ch <= '9';
  }
  function isWhitespace(ch) {
    return ch == ' ' || ch == '\r' || ch == '\t' ||
           ch == '\n' || ch == '\v' || ch == '\u00A0'; // IE treats non-breaking space as \u00A0
  }
  function isIdent(ch) {
    return 'a' <= ch && ch <= 'z' ||
           'A' <= ch && ch <= 'Z' ||
           '_' == ch || ch == '$';
  }
  function isExpOperator(ch) {
    return ch == '-' || ch == '+' || isNumber(ch);
  }

  function throwError(error, start, end) {
    end = end || index;
    throw Error("Lexer Error: " + error + " at column" +
        (isDefined(start)
            ? "s " + start +  "-" + index + " [" + text.substring(start, end) + "]"
            : " " + end) +
        " in expression [" + text + "].");
  }

  function readNumber() {
    var number = "";
    var start = index;
    while (index < text.length) {
      var ch = lowercase(text.charAt(index));
      if (ch == '.' || isNumber(ch)) {
        number += ch;
      } else {
        var peekCh = peek();
        if (ch == 'e' && isExpOperator(peekCh)) {
          number += ch;
        } else if (isExpOperator(ch) &&
            peekCh && isNumber(peekCh) &&
            number.charAt(number.length - 1) == 'e') {
          number += ch;
        } else if (isExpOperator(ch) &&
            (!peekCh || !isNumber(peekCh)) &&
            number.charAt(number.length - 1) == 'e') {
          throwError('Invalid exponent');
        } else {
          break;
        }
      }
      index++;
    }
    number = 1 * number;
    tokens.push({index:start, text:number, json:true,
      fn:function() {return number;}});
  }
  function readIdent() {
    var ident = "";
    var start = index;
    var fn;
    while (index < text.length) {
      var ch = text.charAt(index);
      if (ch == '.' || isIdent(ch) || isNumber(ch)) {
        ident += ch;
      } else {
        break;
      }
      index++;
    }
    fn = OPERATORS[ident];
    tokens.push({
      index:start,
      text:ident,
      json: fn,
      fn:fn||extend(getterFn(ident), {
        assign:function(self, value){
          return setter(self, ident, value);
        }
      })
    });
  }

  function readString(quote) {
    var start = index;
    index++;
    var string = "";
    var rawString = quote;
    var escape = false;
    while (index < text.length) {
      var ch = text.charAt(index);
      rawString += ch;
      if (escape) {
        if (ch == 'u') {
          var hex = text.substring(index + 1, index + 5);
          if (!hex.match(/[\da-f]{4}/i))
            throwError( "Invalid unicode escape [\\u" + hex + "]");
          index += 4;
          string += String.fromCharCode(parseInt(hex, 16));
        } else {
          var rep = ESCAPE[ch];
          if (rep) {
            string += rep;
          } else {
            string += ch;
          }
        }
        escape = false;
      } else if (ch == '\\') {
        escape = true;
      } else if (ch == quote) {
        index++;
        tokens.push({
          index:start,
          text:rawString,
          string:string,
          json:true,
          fn:function() { return string; }
        });
        return;
      } else {
        string += ch;
      }
      index++;
    }
    throwError("Unterminated quote", start);
  }
}

/////////////////////////////////////////

function parser(text, json, $filter){
  var ZERO = valueFn(0),
      value,
      tokens = lex(text),
      assignment = _assignment,
      assignable = logicalOR,
      functionCall = _functionCall,
      fieldAccess = _fieldAccess,
      objectIndex = _objectIndex,
      filterChain = _filterChain,
      functionIdent = _functionIdent;
  if(json){
    // The extra level of aliasing is here, just in case the lexer misses something, so that
    // we prevent any accidental execution in JSON.
    assignment = logicalOR;
    functionCall =
      fieldAccess =
      objectIndex =
      assignable =
      filterChain =
      functionIdent =
        function() { throwError("is not valid json", {text:text, index:0}); };
    value = primary();
  } else {
    value = statements();
  }
  if (tokens.length !== 0) {
    throwError("is an unexpected token", tokens[0]);
  }
  return value;

  ///////////////////////////////////
  function throwError(msg, token) {
    throw Error("Syntax Error: Token '" + token.text +
      "' " + msg + " at column " +
      (token.index + 1) + " of the expression [" +
      text + "] starting at [" + text.substring(token.index) + "].");
  }

  function peekToken() {
    if (tokens.length === 0)
      throw Error("Unexpected end of expression: " + text);
    return tokens[0];
  }

  function peek(e1, e2, e3, e4) {
    if (tokens.length > 0) {
      var token = tokens[0];
      var t = token.text;
      if (t==e1 || t==e2 || t==e3 || t==e4 ||
          (!e1 && !e2 && !e3 && !e4)) {
        return token;
      }
    }
    return false;
  }

  function expect(e1, e2, e3, e4){
    var token = peek(e1, e2, e3, e4);
    if (token) {
      if (json && !token.json) {
        throwError("is not valid json", token);
      }
      tokens.shift();
      return token;
    }
    return false;
  }

  function consume(e1){
    if (!expect(e1)) {
      throwError("is unexpected, expecting [" + e1 + "]", peek());
    }
  }

  function unaryFn(fn, right) {
    return function(self) {
      return fn(self, right);
    };
  }

  function binaryFn(left, fn, right) {
    return function(self) {
      return fn(self, left, right);
    };
  }

  function hasTokens () {
    return tokens.length > 0;
  }

  function statements() {
    var statements = [];
    while(true) {
      if (tokens.length > 0 && !peek('}', ')', ';', ']'))
        statements.push(filterChain());
      if (!expect(';')) {
        // optimize for the common case where there is only one statement.
        // TODO(size): maybe we should not support multiple statements?
        return statements.length == 1
          ? statements[0]
          : function(self){
            var value;
            for ( var i = 0; i < statements.length; i++) {
              var statement = statements[i];
              if (statement)
                value = statement(self);
            }
            return value;
          };
      }
    }
  }

  function _filterChain() {
    var left = expression();
    var token;
    while(true) {
      if ((token = expect('|'))) {
        left = binaryFn(left, token.fn, filter());
      } else {
        return left;
      }
    }
  }

  function filter() {
    var token = expect();
    var fn = $filter(token.text);
    var argsFn = [];
    while(true) {
      if ((token = expect(':'))) {
        argsFn.push(expression());
      } else {
        var fnInvoke = function(self, input){
          var args = [input];
          for ( var i = 0; i < argsFn.length; i++) {
            args.push(argsFn[i](self));
          }
          return fn.apply(self, args);
        };
        return function() {
          return fnInvoke;
        };
      }
    }
  }

  function expression() {
    return assignment();
  }

  function _assignment() {
    var left = logicalOR();
    var right;
    var token;
    if ((token = expect('='))) {
      if (!left.assign) {
        throwError("implies assignment but [" +
          text.substring(0, token.index) + "] can not be assigned to", token);
      }
      right = logicalOR();
      return function(self){
        return left.assign(self, right(self));
      };
    } else {
      return left;
    }
  }

  function logicalOR() {
    var left = logicalAND();
    var token;
    while(true) {
      if ((token = expect('||'))) {
        left = binaryFn(left, token.fn, logicalAND());
      } else {
        return left;
      }
    }
  }

  function logicalAND() {
    var left = equality();
    var token;
    if ((token = expect('&&'))) {
      left = binaryFn(left, token.fn, logicalAND());
    }
    return left;
  }

  function equality() {
    var left = relational();
    var token;
    if ((token = expect('==','!='))) {
      left = binaryFn(left, token.fn, equality());
    }
    return left;
  }

  function relational() {
    var left = additive();
    var token;
    if ((token = expect('<', '>', '<=', '>='))) {
      left = binaryFn(left, token.fn, relational());
    }
    return left;
  }

  function additive() {
    var left = multiplicative();
    var token;
    while ((token = expect('+','-'))) {
      left = binaryFn(left, token.fn, multiplicative());
    }
    return left;
  }

  function multiplicative() {
    var left = unary();
    var token;
    while ((token = expect('*','/','%'))) {
      left = binaryFn(left, token.fn, unary());
    }
    return left;
  }

  function unary() {
    var token;
    if (expect('+')) {
      return primary();
    } else if ((token = expect('-'))) {
      return binaryFn(ZERO, token.fn, unary());
    } else if ((token = expect('!'))) {
      return unaryFn(token.fn, unary());
    } else {
      return primary();
    }
  }

  function _functionIdent(fnScope) {
    var token = expect();
    var element = token.text.split('.');
    var instance = fnScope;
    var key;
    for ( var i = 0; i < element.length; i++) {
      key = element[i];
      if (instance)
        instance = instance[key];
    }
    if (!isFunction(instance)) {
      throwError("should be a function", token);
    }
    return instance;
  }

  function primary() {
    var primary;
    if (expect('(')) {
      var expression = filterChain();
      consume(')');
      primary = expression;
    } else if (expect('[')) {
      primary = arrayDeclaration();
    } else if (expect('{')) {
      primary = object();
    } else {
      var token = expect();
      primary = token.fn;
      if (!primary) {
        throwError("not a primary expression", token);
      }
    }
    var next;
    while ((next = expect('(', '[', '.'))) {
      if (next.text === '(') {
        primary = functionCall(primary);
      } else if (next.text === '[') {
        primary = objectIndex(primary);
      } else if (next.text === '.') {
        primary = fieldAccess(primary);
      } else {
        throwError("IMPOSSIBLE");
      }
    }
    return primary;
  }

  function _fieldAccess(object) {
    var field = expect().text;
    var getter = getterFn(field);
    return extend(function(self){
      return getter(object(self));
    }, {
      assign:function(self, value){
        return setter(object(self), field, value);
      }
    });
  }

  function _objectIndex(obj) {
    var indexFn = expression();
    consume(']');
    return extend(
      function(self){
        var o = obj(self),
            i = indexFn(self),
            v, p;

        if (!o) return undefined;
        v = o[i];
        if (v && v.then) {
          p = v;
          if (!('$$v' in v)) {
            p.$$v = undefined;
            p.then(function(val) { p.$$v = val; });
          }
          v = v.$$v;
        }
        return v;
      }, {
        assign:function(self, value){
          return obj(self)[indexFn(self)] = value;
        }
      });
  }

  function _functionCall(fn) {
    var argsFn = [];
    if (peekToken().text != ')') {
      do {
        argsFn.push(expression());
      } while (expect(','));
    }
    consume(')');
    return function(self){
      var args = [];
      for ( var i = 0; i < argsFn.length; i++) {
        args.push(argsFn[i](self));
      }
      var fnPtr = fn(self) || noop;
      // IE stupidity!
      return fnPtr.apply
          ? fnPtr.apply(self, args)
          : fnPtr(args[0], args[1], args[2], args[3], args[4]);
    };
  }

  // This is used with json array declaration
  function arrayDeclaration () {
    var elementFns = [];
    if (peekToken().text != ']') {
      do {
        elementFns.push(expression());
      } while (expect(','));
    }
    consume(']');
    return function(self){
      var array = [];
      for ( var i = 0; i < elementFns.length; i++) {
        array.push(elementFns[i](self));
      }
      return array;
    };
  }

  function object () {
    var keyValues = [];
    if (peekToken().text != '}') {
      do {
        var token = expect(),
        key = token.string || token.text;
        consume(":");
        var value = expression();
        keyValues.push({key:key, value:value});
      } while (expect(','));
    }
    consume('}');
    return function(self){
      var object = {};
      for ( var i = 0; i < keyValues.length; i++) {
        var keyValue = keyValues[i];
        var value = keyValue.value(self);
        object[keyValue.key] = value;
      }
      return object;
    };
  }

  function watchDecl () {
    var anchorName = expect().text;
    consume(":");
    var expressionFn;
    if (peekToken().text == '{') {
      consume("{");
      expressionFn = statements();
      consume("}");
    } else {
      expressionFn = expression();
    }
    return function(self) {
      return {name:anchorName, fn:expressionFn};
    };
  }
}

//////////////////////////////////////////////////
// Parser helper functions
//////////////////////////////////////////////////

function setter(obj, path, setValue) {
  var element = path.split('.');
  for (var i = 0; element.length > 1; i++) {
    var key = element.shift();
    var propertyObj = obj[key];
    if (!propertyObj) {
      propertyObj = {};
      obj[key] = propertyObj;
    }
    obj = propertyObj;
  }
  obj[element.shift()] = setValue;
  return setValue;
}

/**
 * Return the value accesible from the object by path. Any undefined traversals are ignored
 * @param {Object} obj starting object
 * @param {string} path path to traverse
 * @param {boolean=true} bindFnToScope
 * @returns value as accesbile by path
 */
//TODO(misko): this function needs to be removed
function getter(obj, path, bindFnToScope) {
  if (!path) return obj;
  var keys = path.split('.');
  var key;
  var lastInstance = obj;
  var len = keys.length;

  for (var i = 0; i < len; i++) {
    key = keys[i];
    if (obj) {
      obj = (lastInstance = obj)[key];
    }
  }
  if (!bindFnToScope && isFunction(obj)) {
    return bind(lastInstance, obj);
  }
  return obj;
}

var getterFnCache = {},
    JS_KEYWORDS = {};

forEach(
    ("abstract,boolean,break,byte,case,catch,char,class,const,continue,debugger,default," +
    "delete,do,double,else,enum,export,extends,false,final,finally,float,for,function,goto," +
    "if,implements,import,ininstanceof,intinterface,long,native,new,null,package,private," +
    "protected,public,return,short,static,super,switch,synchronized,this,throw,throws," +
    "transient,true,try,typeof,var,volatile,void,undefined,while,with").split(/,/),
  function(key){ JS_KEYWORDS[key] = true;}
);

function getterFn(path) {
  var fn = getterFnCache[path];
  if (fn) return fn;

  var code = 'var l, fn, p;\n';
  forEach(path.split('.'), function(key) {
    key = (JS_KEYWORDS[key]) ? '["' + key + '"]' : '.' + key;
    code += 'if(!s) return s;\n' +
            'l=s;\n' +
            's=s' + key + ';\n' +
            'if(typeof s=="function" && !(s instanceof RegExp)) {\n' +
              ' fn=function(){ return l' + key + '.apply(l, arguments); };\n' +
              ' fn.$unboundFn=s;\n' +
              ' s=fn;\n' +
            '} else if (s && s.then) {\n' +
              ' if (!("$$v" in s)) {\n' +
                ' p=s;\n' +
                ' p.$$v = undefined;\n' +
                ' p.then(function(v) {p.$$v=v;});\n' +
                '}\n' +
              ' s=s.$$v\n' +
            '}\n';
  });
  code += 'return s;';
  fn = Function('s', code);
  fn.toString = function() { return code; };

  return getterFnCache[path] = fn;
}

///////////////////////////////////

function $ParseProvider() {
  var cache = {};
  this.$get = ['$filter', function($filter) {
    return function(exp) {
      switch(typeof exp) {
        case 'string':
          return cache.hasOwnProperty(exp)
            ? cache[exp]
            : cache[exp] =  parser(exp, false, $filter);
        case 'function':
          return exp;
        default:
          return noop;
      }
    };
  }];
}


// This is a special access for JSON parser which bypasses the injector
var parseJson = function(json) {
  return parser(json, true);
};

/**
 * @ngdoc service
 * @name angular.module.ng.$q
 * @requires $rootScope
 *
 * @description
 * A promise/deferred implementation inspired by [Kris Kowal's Q](https://github.com/kriskowal/q).
 *
 * [The CommonJS Promise proposal](http://wiki.commonjs.org/wiki/Promises) describes a promise as an
 * interface for interacting with an object that represents the result of an action that is
 * performed asynchronously, and may or may not be finished at any given point in time.
 *
 * From the perspective of dealing with error handling, deferred and promise apis are to
 * asynchronous programing what `try`, `catch` and `throw` keywords are to synchronous programing.
 *
 * <pre>
 *   // for the purpose of this example let's assume that variables `$q` and `scope` are
 *   // available in the current lexical scope (they could have been injected or passed in).
 *
 *   function asyncGreet(name) {
 *     var deferred = $q.defer();
 *
 *     setTimeout(function() {
 *       // since this fn executes async in a future turn of the event loop, we need to wrap
 *       // our code into an $apply call so that the model changes are properly observed.
 *       scope.$apply(function() {
 *         if (okToGreet(name)) {
 *           deferred.resolve('Hello, ' + name + '!');
 *         } else {
 *           deferred.reject('Greeting ' + name + ' is not allowed.');
 *         }
 *       });
 *     }, 1000);
 *
 *     return deferred.promise;
 *   }
 *
 *   var promise = asyncGreet('Robin Hood');
 *   promise.then(function(greeting) {
 *     alert('Success: ' + greeting);
 *   }, function(reason) {
 *     alert('Failed: ' + reason);
 *   );
 * </pre>
 *
 * At first it might not be obvious why this extra complexity is worth the trouble. The payoff
 * comes in the way of
 * [guarantees that promise and deferred apis make](https://github.com/kriskowal/uncommonjs/blob/master/promises/specification.md).
 *
 * Additionally the promise api allows for composition that is very hard to do with the
 * traditional callback ([CPS](http://en.wikipedia.org/wiki/Continuation-passing_style)) approach.
 * For more on this please see the [Q documentation](https://github.com/kriskowal/q) especially the
 * section on serial or parallel joining of promises.
 *
 *
 * # The Deferred API
 *
 * A new instance of deferred is constructed by calling `$q.defer()`.
 *
 * The purpose of the deferred object is to expose the associated Promise instance as well as apis
 * that can be used for signaling the successful or unsuccessful completion of the task.
 *
 * **Methods**
 *
 * - `resolve(value)` ??? resolves the derived promise with the `value`. If the value is a rejection
 *   constructed via `$q.reject`, the promise will be rejected instead.
 * - `reject(reason)` ??? rejects the derived promise with the `reason`. This is equivalent to
 *   resolving it with a rejection constructed via `$q.reject`.
 *
 * **Properties**
 *
 * - promise ??? `{Promise}` ??? promise object associated with this deferred.
 *
 *
 * # The Promise API
 *
 * A new promise instance is created when a deferred instance is created and can be retrieved by
 * calling `deferred.promise`.
 *
 * The purpose of the promise object is to allow for interested parties to get access to the result
 * of the deferred task when it completes.
 *
 * **Methods**
 *
 * - `then(successCallback, errorCallback)` ??? regardless of when the promise was or will be resolved
 *   or rejected calls one of the success or error callbacks asynchronously as soon as the result
 *   is available. The callbacks are called with a single argument the result or rejection reason.
 *
 *   This method *returns a new promise* which is resolved or rejected via the return value of the
 *   `successCallback` or `errorCallback`.
 *
 *
 * # Chaining promises
 *
 * Because calling `then` api of a promise returns a new derived promise, it is easily possible
 * to create a chain of promises:
 *
 * <pre>
 *   promiseB = promiseA.then(function(result) {
 *     return result + 1;
 *   });
 *
 *   // promiseB will be resolved immediately after promiseA is resolved and it's value will be
 *   // the result of promiseA incremented by 1
 * </pre>
 *
 * It is possible to create chains of any length and since a promise can be resolved with another
 * promise (which will defer its resolution further), it is possible to pause/defer resolution of
 * the promises at any point in the chain. This makes it possible to implement powerful apis like
 * $http's response interceptors.
 *
 *
 * # Differences between Kris Kowal's Q and $q
 *
 *  There are three main differences:
 *
 * - $q is integrated with the {@link angular.module.ng.$rootScope.Scope} Scope model observation
 *   mechanism in angular, which means faster propagation of resolution or rejection into your
 *   models and avoiding unnecessary browser repaints, which would result in flickering UI.
 * - $q promises are recognized by the templating engine in angular, which means that in templates
 *   you can treat promises attached to a scope as if they were the resulting values.
 * - Q has many more features that $q, but that comes at a cost of bytes. $q is tiny, but contains
 *   all the important functionality needed for common async tasks.
 */
function $QProvider() {

  this.$get = ['$rootScope', '$exceptionHandler', function($rootScope, $exceptionHandler) {
    return qFactory(function(callback) {
      $rootScope.$evalAsync(callback);
    }, $exceptionHandler);
  }];
}


/**
 * Constructs a promise manager.
 *
 * @param {function(function)} nextTick Function for executing functions in the next turn.
 * @param {function(...*)} exceptionHandler Function into which unexpected exceptions are passed for
 *     debugging purposes.
 * @returns {object} Promise manager.
 */
function qFactory(nextTick, exceptionHandler) {

  /**
   * @ngdoc
   * @name angular.module.ng.$q#defer
   * @methodOf angular.module.ng.$q
   * @description
   * Creates a `Deferred` object which represents a task which will finish in the future.
   *
   * @returns {Deferred} Returns a new instance of deferred.
   */
  var defer = function() {
    var pending = [],
        value, deferred;

    deferred = {

      resolve: function(val) {
        if (pending) {
          var callbacks = pending;
          pending = undefined;
          value = ref(val);

          if (callbacks.length) {
            nextTick(function() {
              var callback;
              for (var i = 0, ii = callbacks.length; i < ii; i++) {
                callback = callbacks[i];
                value.then(callback[0], callback[1]);
              }
            });
          }
        }
      },


      reject: function(reason) {
        deferred.resolve(reject(reason));
      },


      promise: {
        then: function(callback, errback) {
          var result = defer();

          var wrappedCallback = function(value) {
            try {
              result.resolve((callback || defaultCallback)(value));
            } catch(e) {
              exceptionHandler(e);
              result.reject(e);
            }
          };

          var wrappedErrback = function(reason) {
            try {
              result.resolve((errback || defaultErrback)(reason));
            } catch(e) {
              exceptionHandler(e);
              result.reject(e);
            }
          };

          if (pending) {
            pending.push([wrappedCallback, wrappedErrback]);
          } else {
            value.then(wrappedCallback, wrappedErrback);
          }

          return result.promise;
        }
      }
    };

    return deferred;
  };


  var ref = function(value) {
    if (value && value.then) return value;
    return {
      then: function(callback) {
        var result = defer();
        nextTick(function() {
          result.resolve(callback(value));
        });
        return result.promise;
      }
    };
  };


  /**
   * @ngdoc
   * @name angular.module.ng.$q#reject
   * @methodOf angular.module.ng.$q
   * @description
   * Creates a promise that is resolved as rejected with the specified `reason`. This api should be
   * used to forward rejection in a chain of promises. If you are dealing with the last promise in
   * a promise chain, you don't need to worry about it.
   *
   * When comparing deferreds/promises to the familiar behavior of try/catch/throw, think of
   * `reject` as the `throw` keyword in JavaScript. This also means that if you "catch" an error via
   * a promise error callback and you want to forward the error to the promise derived from the
   * current promise, you have to "rethrow" the error by returning a rejection constructed via
   * `reject`.
   *
   * <pre>
   *   promiseB = promiseA.then(function(result) {
   *     // success: do something and resolve promiseB
   *     //          with the old or a new result
   *     return result;
   *   }, function(reason) {
   *     // error: handle the error if possible and
   *     //        resolve promiseB with newPromiseOrValue,
   *     //        otherwise forward the rejection to promiseB
   *     if (canHandle(reason)) {
   *      // handle the error and recover
   *      return newPromiseOrValue;
   *     }
   *     return $q.reject(reason);
   *   });
   * </pre>
   *
   * @param {*} reason Constant, message, exception or an object representing the rejection reason.
   * @returns {Promise} Returns a promise that was already resolved as rejected with the `reason`.
   */
  var reject = function(reason) {
    return {
      then: function(callback, errback) {
        var result = defer();
        nextTick(function() {
          result.resolve(errback(reason));
        });
        return result.promise;
      }
    };
  };


  /**
   * @ngdoc
   * @name angular.module.ng.$q#when
   * @methodOf angular.module.ng.$q
   * @description
   * Wraps an object that might be a value or a (3rd party) then-able promise into a $q promise.
   * This is useful when you are dealing with on object that might or might not be a promise, or if
   * the promise comes from a source that can't be trusted.
   *
   * @param {*} value Value or a promise
   * @returns {Promise} Returns a single promise that will be resolved with an array of values,
   *   each value coresponding to the promise at the same index in the `promises` array. If any of
   *   the promises is resolved with a rejection, this resulting promise will be resolved with the
   *   same rejection.
   */
  var when = function(value, callback, errback) {
    var result = defer(),
        done;

    var wrappedCallback = function(value) {
      try {
        return (callback || defaultCallback)(value);
      } catch (e) {
        exceptionHandler(e);
        return reject(e);
      }
    };

    var wrappedErrback = function(reason) {
      try {
        return (errback || defaultErrback)(reason);
      } catch (e) {
        exceptionHandler(e);
        return reject(e);
      }
    };

    nextTick(function() {
      ref(value).then(function(value) {
        if (done) return;
        done = true;
        result.resolve(ref(value).then(wrappedCallback, wrappedErrback));
      }, function(reason) {
        if (done) return;
        done = true;
        result.resolve(wrappedErrback(reason));
      });
    });

    return result.promise;
  };


  function defaultCallback(value) {
    return value;
  }


  function defaultErrback(reason) {
    return reject(reason);
  }


  /**
   * @ngdoc
   * @name angular.module.ng.$q#all
   * @methodOf angular.module.ng.$q
   * @description
   * Combines multiple promises into a single promise that is resolved when all of the input
   * promises are resolved.
   *
   * @param {Array.<Promise>} promises An array of promises.
   * @returns {Promise} Returns a single promise that will be resolved with an array of values,
   *   each value coresponding to the promise at the same index in the `promises` array. If any of
   *   the promises is resolved with a rejection, this resulting promise will be resolved with the
   *   same rejection.
   */
  function all(promises) {
    var deferred = defer(),
        counter = promises.length,
        results = [];

    forEach(promises, function(promise, index) {
      promise.then(function(value) {
        if (index in results) return;
        results[index] = value;
        if (!(--counter)) deferred.resolve(results);
      }, function(reason) {
        if (index in results) return;
        deferred.reject(reason);
      });
    });

    return deferred.promise;
  }

  return {
    defer: defer,
    reject: reject,
    when: when,
    all: all
  };
}

/**
 * @ngdoc object
 * @name angular.module.ng.$route
 * @requires $location
 * @requires $routeParams
 *
 * @property {Object} current Reference to the current route definition.
 * @property {Array.<Object>} routes Array of all configured routes.
 *
 * @description
 * Watches `$location.url()` and tries to map the path to an existing route
 * definition. It is used for deep-linking URLs to controllers and views (HTML partials).
 *
 * The `$route` service is typically used in conjunction with {@link angular.widget.ng:view ng:view}
 * widget and the {@link angular.module.ng.$routeParams $routeParams} service.
 *
 * @example
   This example shows how changing the URL hash causes the <tt>$route</tt>
   to match a route against the URL, and the <tt>[[ng:include]]</tt> pulls in the partial.

    <doc:example>
      <doc:source jsfiddle="false">
        <script>
          function MainCntl($route, $routeParams, $location) {
            this.$route = $route;
            this.$location = $location;
            this.$routeParams = $routeParams;

            $route.when('/Book/:bookId', {template: 'examples/book.html', controller: BookCntl});
            $route.when('/Book/:bookId/ch/:chapterId', {template: 'examples/chapter.html', controller: ChapterCntl});
          }

          function BookCntl($routeParams) {
            this.name = "BookCntl";
            this.params = $routeParams;
          }

          function ChapterCntl($routeParams) {
            this.name = "ChapterCntl";
            this.params = $routeParams;
          }
        </script>

        <div ng:controller="MainCntl">
          Choose:
          <a href="#/Book/Moby">Moby</a> |
          <a href="#/Book/Moby/ch/1">Moby: Ch1</a> |
          <a href="#/Book/Gatsby">Gatsby</a> |
          <a href="#/Book/Gatsby/ch/4?key=value">Gatsby: Ch4</a><br/>
          <pre>$location.path() = {{$location.path()}}</pre>
          <pre>$route.current.template = {{$route.current.template}}</pre>
          <pre>$route.current.params = {{$route.current.params}}</pre>
          <pre>$route.current.scope.name = {{$route.current.scope.name}}</pre>
          <pre>$routeParams = {{$routeParams}}</pre>
          <hr />
          <ng:view></ng:view>
        </div>
      </doc:source>
      <doc:scenario>
      </doc:scenario>
    </doc:example>
 */
function $RouteProvider(){
  this.$get = ['$rootScope', '$location', '$routeParams',
      function( $rootScope,  $location,  $routeParams) {
    /**
     * @ngdoc event
     * @name angular.module.ng.$route#$beforeRouteChange
     * @eventOf angular.module.ng.$route
     * @eventType broadcast on root scope
     * @description
     * Broadcasted before a route change.
     *
     * @param {Route} next Future route information.
     * @param {Route} current Current route information.
     *
     * The `Route` object extends the route definition with the following properties.
     *
     *    * `scope` - The instance of the route controller.
     *    * `params` - The current {@link angular.module.ng.$routeParams params}.
     *
     */

    /**
     * @ngdoc event
     * @name angular.module.ng.$route#$afterRouteChange
     * @eventOf angular.module.ng.$route
     * @eventType broadcast on root scope
     * @description
     * Broadcasted after a route change.
     *
     * @param {Route} current Current route information.
     * @param {Route} previous Previous route information.
     *
     * The `Route` object extends the route definition with the following properties.
     *
     *    * `scope` - The instance of the route controller.
     *    * `params` - The current {@link angular.module.ng.$routeParams params}.
     *
     */

    /**
     * @ngdoc event
     * @name angular.module.ng.$route#$routeUpdate
     * @eventOf angular.module.ng.$route
     * @eventType emit on the current route scope
     * @description
     *
     * The `reloadOnSearch` property has been set to false, and we are reusing the same
     * instance of the Controller.
     */

    var routes = {},
        matcher = switchRouteMatcher,
        parentScope = $rootScope,
        dirty = 0,
        forceReload = false,
        $route = {
          routes: routes,

          /**
           * @ngdoc method
           * @name angular.module.ng.$route#parent
           * @methodOf angular.module.ng.$route
           *
           * @param {Scope} [scope=rootScope] Scope to be used as parent for newly created
           *    `$route.current.scope` scopes.
           *
           * @description
           * Sets a scope to be used as the parent scope for scopes created on route change. If not
           * set, defaults to the root scope.
           */
          parent: function(scope) {
            if (scope) parentScope = scope;
          },

          /**
           * @ngdoc method
           * @name angular.module.ng.$route#when
           * @methodOf angular.module.ng.$route
           *
           * @param {string} path Route path (matched against `$location.hash`)
           * @param {Object} route Mapping information to be assigned to `$route.current` on route
           *    match.
           *
           *    Object properties:
           *
           *    - `controller` ??? `{function()=}` ??? Controller fn that should be associated with newly
           *      created scope.
           *    - `template` ??? `{string=}` ??? path to an html template that should be used by
           *      {@link angular.widget.ng:view ng:view} or
           *      {@link angular.widget.ng:include ng:include} widgets.
           *    - `redirectTo` ??? {(string|function())=} ??? value to update
           *      {@link angular.module.ng.$location $location} path with and trigger route redirection.
           *
           *      If `redirectTo` is a function, it will be called with the following parameters:
           *
           *      - `{Object.<string>}` - route parameters extracted from the current
           *        `$location.path()` by applying the current route template.
           *      - `{string}` - current `$location.path()`
           *      - `{Object}` - current `$location.search()`
           *
           *      The custom `redirectTo` function is expected to return a string which will be used
           *      to update `$location.path()` and `$location.search()`.
           *
           *    - `[reloadOnSearch=true]` - {boolean=} - reload route when only $location.search()
           *    changes.
           *
           *      If the option is set to false and url in the browser changes, then
           *      $routeUpdate event is emited on the current route scope. You can use this event to
           *      react to {@link angular.module.ng.$routeParams} changes:
           *
           *            function MyCtrl($route, $routeParams) {
           *              this.$on('$routeUpdate', function() {
           *                // do stuff with $routeParams
           *              });
           *            }
           *
           * @returns {Object} route object
           *
           * @description
           * Adds a new route definition to the `$route` service.
           */
          when: function(path, route) {
            var routeDef = routes[path];
            if (!routeDef) routeDef = routes[path] = {reloadOnSearch: true};
            if (route) extend(routeDef, route); // TODO(im): what the heck? merge two route definitions?
            dirty++;
            return routeDef;
          },

          /**
           * @ngdoc method
           * @name angular.module.ng.$route#otherwise
           * @methodOf angular.module.ng.$route
           *
           * @description
           * Sets route definition that will be used on route change when no other route definition
           * is matched.
           *
           * @param {Object} params Mapping information to be assigned to `$route.current`.
           */
          otherwise: function(params) {
            $route.when(null, params);
          },

          /**
           * @ngdoc method
           * @name angular.module.ng.$route#reload
           * @methodOf angular.module.ng.$route
           *
           * @description
           * Causes `$route` service to reload (and recreate the `$route.current` scope) upon the next
           * eval even if {@link angular.module.ng.$location $location} hasn't changed.
           */
          reload: function() {
            dirty++;
            forceReload = true;
          }
        };

    $rootScope.$watch(function() { return dirty + $location.url(); }, updateRoute);

    return $route;

    /////////////////////////////////////////////////////

    function switchRouteMatcher(on, when) {
      // TODO(i): this code is convoluted and inefficient, we should construct the route matching
      //   regex only once and then reuse it
      var regex = '^' + when.replace(/([\.\\\(\)\^\$])/g, "\\$1") + '$',
          params = [],
          dst = {};
      forEach(when.split(/\W/), function(param) {
        if (param) {
          var paramRegExp = new RegExp(":" + param + "([\\W])");
          if (regex.match(paramRegExp)) {
            regex = regex.replace(paramRegExp, "([^\\/]*)$1");
            params.push(param);
          }
        }
      });
      var match = on.match(new RegExp(regex));
      if (match) {
        forEach(params, function(name, index) {
          dst[name] = match[index + 1];
        });
      }
      return match ? dst : null;
    }

    function updateRoute() {
      var next = parseRoute(),
          last = $route.current,
          Controller;

      if (next && last && next.$route === last.$route
          && equals(next.pathParams, last.pathParams) && !next.reloadOnSearch && !forceReload) {
        next.scope = last.scope;
        $route.current = next;
        copy(next.params, $routeParams);
        last.scope && last.scope.$emit('$routeUpdate');
      } else {
        forceReload = false;
        $rootScope.$broadcast('$beforeRouteChange', next, last);
        last && last.scope && last.scope.$destroy();
        $route.current = next;
        if (next) {
          if (next.redirectTo) {
            if (isString(next.redirectTo)) {
              $location.path(interpolate(next.redirectTo, next.params)).search(next.params)
                       .replace();
            } else {
              $location.url(next.redirectTo(next.pathParams, $location.path(), $location.search()))
                       .replace();
            }
          } else {
            copy(next.params, $routeParams);
            (Controller = next.controller) && inferInjectionArgs(Controller);
            next.scope = parentScope.$new(Controller);
          }
        }
        $rootScope.$broadcast('$afterRouteChange', next, last);
      }
    }


    /**
     * @returns the current active route, by matching it against the URL
     */
    function parseRoute() {
      // Match a route
      var params, match;
      forEach(routes, function(route, path) {
        if (!match && (params = matcher($location.path(), path))) {
          match = inherit(route, {
            params: extend({}, $location.search(), params),
            pathParams: params});
          match.$route = route;
        }
      });
      // No route matched; fallback to "otherwise" route
      return match || routes[null] && inherit(routes[null], {params: {}, pathParams:{}});
    }

    /**
     * @returns interpolation of the redirect path with the parametrs
     */
    function interpolate(string, params) {
      var result = [];
      forEach((string||'').split(':'), function(segment, i) {
        if (i == 0) {
          result.push(segment);
        } else {
          var segmentMatch = segment.match(/(\w+)(.*)/);
          var key = segmentMatch[1];
          result.push(params[key]);
          result.push(segmentMatch[2] || '');
          delete params[key];
        }
      });
      return result.join('');
    }


  }];
}

/**
 * @ngdoc object
 * @name angular.module.ng.$routeParams
 * @requires $route
 *
 * @description
 * Current set of route parameters. The route parameters are a combination of the
 * {@link angular.module.ng.$location $location} `search()`, and `path()`. The `path` parameters
 * are extracted when the {@link angular.module.ng.$route $route} path is matched.
 *
 * In case of parameter name collision, `path` params take precedence over `search` params.
 *
 * The service guarantees that the identity of the `$routeParams` object will remain unchanged
 * (but its properties will likely change) even when a route change occurs.
 *
 * @example
 * <pre>
 *  // Given:
 *  // URL: http://server.com/index.html#/Chapter/1/Section/2?search=moby
 *  // Route: /Chapter/:chapterId/Section/:sectionId
 *  //
 *  // Then
 *  $routeParams ==> {chapterId:1, sectionId:2, search:'moby'}
 * </pre>
 */
function $RouteParamsProvider() {
  this.$get = valueFn({});
}

/**
 * DESIGN NOTES
 *
 * The design decisions behind the scope ware heavily favored for speed and memory consumption.
 *
 * The typical use of scope is to watch the expressions, which most of the time return the same
 * value as last time so we optimize the operation.
 *
 * Closures construction is expensive from speed as well as memory:
 *   - no closures, instead ups prototypical inheritance for API
 *   - Internal state needs to be stored on scope directly, which means that private state is
 *     exposed as $$____ properties
 *
 * Loop operations are optimized by using while(count--) { ... }
 *   - this means that in order to keep the same order of execution as addition we have to add
 *     items to the array at the begging (shift) instead of at the end (push)
 *
 * Child scopes are created and removed often
 *   - Using array would be slow since inserts in meddle are expensive so we use linked list
 *
 * There are few watches then a lot of observers. This is why you don't want the observer to be
 * implemented in the same way as watch. Watch requires return of initialization function which
 * are expensive to construct.
 */

/**
 * @ngdoc object
 * @name angular.module.ng.$rootScope
 * @description
 *
 * Every application has a single root {@link angular.module.ng.$rootScope.Scope scope}.
 * All other scopes are child scopes of the root scope. Scopes provide mechanism for watching the model and provide
 * event processing life-cycle. See {@link guide/dev_guide.scopes developer guide on scopes}.
 */
function $RootScopeProvider(){
  this.$get = ['$injector', '$exceptionHandler', '$parse',
      function( $injector,   $exceptionHandler,   $parse) {

    /**
     * @ngdoc function
     * @name angular.module.ng.$rootScope.Scope
     *
     * @description
     * A root scope can be retrieved using the {@link angular.module.ng.$rootScope $rootScope} key from the
     * {@link angular.module.AUTO.$injector $injector}. Child scopes are created using the
     * {@link angular.module.ng.$rootScope.Scope#$new $new()} method. (Most scopes are created automatically when
     * compiled HTML template is executed.)
     *
     * Here is a simple scope snippet to show how you can interact with the scope.
     * <pre>
        angular.injector(['ng']).invoke(function($rootScope) {
           var scope = $rootScope.$new();
           scope.salutation = 'Hello';
           scope.name = 'World';

           expect(scope.greeting).toEqual(undefined);

           scope.$watch('name', function() {
             this.greeting = this.salutation + ' ' + this.name + '!';
           }); // initialize the watch

           expect(scope.greeting).toEqual(undefined);
           scope.name = 'Misko';
           // still old value, since watches have not been called yet
           expect(scope.greeting).toEqual(undefined);

           scope.$digest(); // fire all  the watches
           expect(scope.greeting).toEqual('Hello Misko!');
        });
     * </pre>
     *
     * # Inheritance
     * A scope can inherit from a parent scope, as in this example:
     * <pre>
         var parent = $rootScope;
         var child = parent.$new();

         parent.salutation = "Hello";
         child.name = "World";
         expect(child.salutation).toEqual('Hello');

         child.salutation = "Welcome";
         expect(child.salutation).toEqual('Welcome');
         expect(parent.salutation).toEqual('Hello');
     * </pre>
     *
     * # Dependency Injection
     * See {@link guide/dev_guide.di dependency injection}.
     *
     *
     * @param {Object.<string, function()>=} providers Map of service factory which need to be provided
     *     for the current scope. Defaults to {@link angular.module.ng}.
     * @param {Object.<string, *>=} instanceCache Provides pre-instantiated services which should
     *     append/override services provided by `providers`. This is handy when unit-testing and having
     *     the need to override a default service.
     * @returns {Object} Newly created scope.
     *
     */
    function Scope() {
      this.$id = nextUid();
      this.$$phase = this.$parent = this.$$watchers =
                     this.$$nextSibling = this.$$prevSibling =
                     this.$$childHead = this.$$childTail = null;
      this.$destructor = noop;
      this['this'] = this.$root =  this;
      this.$$asyncQueue = [];
      this.$$listeners = {};
    }

    /**
     * @ngdoc property
     * @name angular.module.ng.$rootScope.Scope#$id
     * @propertyOf angular.module.ng.$rootScope.Scope
     * @returns {number} Unique scope ID (monotonically increasing alphanumeric sequence) useful for
     *   debugging.
     */


    Scope.prototype = {
      /**
       * @ngdoc function
       * @name angular.module.ng.$rootScope.Scope#$new
       * @methodOf angular.module.ng.$rootScope.Scope
       * @function
       *
       * @description
       * Creates a new child {@link angular.module.ng.$rootScope.Scope scope}. The new scope can optionally behave as a
       * controller. The parent scope will propagate the {@link angular.module.ng.$rootScope.Scope#$digest $digest()} and
       * {@link angular.module.ng.$rootScope.Scope#$digest $digest()} events. The scope can be removed from the scope
       * hierarchy using {@link angular.module.ng.$rootScope.Scope#$destroy $destroy()}.
       *
       * {@link angular.module.ng.$rootScope.Scope#$destroy $destroy()} must be called on a scope when it is desired for
       * the scope and its child scopes to be permanently detached from the parent and thus stop
       * participating in model change detection and listener notification by invoking.
       *
       * @param {function()=} Class Constructor function which the scope should be applied to the scope.
       * @param {...*} curryArguments Any additional arguments which are curried into the constructor.
       *        See {@link guide/dev_guide.di dependency injection}.
       * @returns {Object} The newly created child scope.
       *
       */
      $new: function(Class, curryArguments) {
        var Child = function() {}; // should be anonymous; This is so that when the minifier munges
          // the name it does not become random set of chars. These will then show up as class
          // name in the debugger.
        var child;
        Child.prototype = this;
        child = new Child();
        child['this'] = child;
        child.$$listeners = {};
        child.$parent = this;
        child.$id = nextUid();
        child.$$asyncQueue = [];
        child.$$watchers = child.$$nextSibling = child.$$childHead = child.$$childTail = null;
        child.$$prevSibling = this.$$childTail;
        if (this.$$childHead) {
          this.$$childTail.$$nextSibling = child;
          this.$$childTail = child;
        } else {
          this.$$childHead = this.$$childTail = child;
        }
        // short circuit if we have no class
        if (Class) {
          // can't use forEach, we need speed!
          var ClassPrototype = Class.prototype;
          for(var key in ClassPrototype) {
            child[key] = bind(child, ClassPrototype[key]);
          }
          $injector.invoke(Class, child, curryArguments);
        }
        return child;
      },

      /**
       * @ngdoc function
       * @name angular.module.ng.$rootScope.Scope#$watch
       * @methodOf angular.module.ng.$rootScope.Scope
       * @function
       *
       * @description
       * Registers a `listener` callback to be executed whenever the `watchExpression` changes.
       *
       * - The `watchExpression` is called on every call to {@link angular.module.ng.$rootScope.Scope#$digest $digest()} and
       *   should return the value which will be watched. (Since {@link angular.module.ng.$rootScope.Scope#$digest $digest()}
       *   reruns when it detects changes the `watchExpression` can execute multiple times per
       *   {@link angular.module.ng.$rootScope.Scope#$digest $digest()} and should be idempotent.)
       * - The `listener` is called only when the value from the current `watchExpression` and the
       *   previous call to `watchExpression' are not equal (with the exception of the initial run
       *   see below). The inequality is determined according to
       *   {@link angular.equals} function. To save the value of the object for later comparison
       *   {@link angular.copy} function is used. It also means that watching complex options will
       *   have adverse memory and performance implications.
       * - The watch `listener` may change the model, which may trigger other `listener`s to fire. This
       *   is achieved by rerunning the watchers until no changes are detected. The rerun iteration
       *   limit is 100 to prevent infinity loop deadlock.
       *
       *
       * If you want to be notified whenever {@link angular.module.ng.$rootScope.Scope#$digest $digest} is called,
       * you can register an `watchExpression` function with no `listener`. (Since `watchExpression`,
       * can execute multiple times per {@link angular.module.ng.$rootScope.Scope#$digest $digest} cycle when a change is
       * detected, be prepared for multiple calls to your listener.)
       *
       * After a watcher is registered with the scope, the `listener` fn is called asynchronously
       * (via {@link angular.module.ng.$rootScope.Scope#$evalAsync $evalAsync}) to initialize the
       * watcher. In rare cases, this is undesirable because the listener is called when the result
       * of `watchExpression` didn't change. To detect this scenario within the `listener` fn, you
       * can compare the `newVal` and `oldVal`. If these two values are identical (`===`) then the
       * listener was called due to initialization.
       *
       *
       * # Example
         <pre>
           // let's assume that scope was dependency injected as the $rootScope
           var scope = $rootScope;
           scope.name = 'misko';
           scope.counter = 0;

           expect(scope.counter).toEqual(0);
           scope.$watch('name', function(scope, newValue, oldValue) { counter = counter + 1; });
           expect(scope.counter).toEqual(0);

           scope.$digest();
           // no variable change
           expect(scope.counter).toEqual(0);

           scope.name = 'adam';
           scope.$digest();
           expect(scope.counter).toEqual(1);
         </pre>
       *
       *
       *
       * @param {(function()|string)} watchExpression Expression that is evaluated on each
       *    {@link angular.module.ng.$rootScope.Scope#$digest $digest} cycle. A change in the return value triggers a
       *    call to the `listener`.
       *
       *    - `string`: Evaluated as {@link guide/dev_guide.expressions expression}
       *    - `function(scope)`: called with current `scope` as a parameter.
       * @param {(function()|string)=} listener Callback called whenever the return value of
       *   the `watchExpression` changes.
       *
       *    - `string`: Evaluated as {@link guide/dev_guide.expressions expression}
       *    - `function(scope, newValue, oldValue)`: called with current `scope` an previous and
       *       current values as parameters.
       * @returns {function()} Returns a deregistration function for this listener.
       */
      $watch: function(watchExp, listener) {
        var scope = this,
            get = compileToFn(watchExp, 'watch'),
            listenFn = compileToFn(listener || noop, 'listener'),
            array = scope.$$watchers,
            watcher = {
              fn: listenFn,
              last: initWatchVal,
              get: get,
              exp: watchExp
            };

        if (!array) {
          array = scope.$$watchers = [];
        }
        // we use unshift since we use a while loop in $digest for speed.
        // the while loop reads in reverse order.
        array.unshift(watcher);

        return function() {
          arrayRemove(array, watcher);
        };
      },

      /**
       * @ngdoc function
       * @name angular.module.ng.$rootScope.Scope#$digest
       * @methodOf angular.module.ng.$rootScope.Scope
       * @function
       *
       * @description
       * Process all of the {@link angular.module.ng.$rootScope.Scope#$watch watchers} of the current scope and its children.
       * Because a {@link angular.module.ng.$rootScope.Scope#$watch watcher}'s listener can change the model, the
       * `$digest()` keeps calling the {@link angular.module.ng.$rootScope.Scope#$watch watchers} until no more listeners are
       * firing. This means that it is possible to get into an infinite loop. This function will throw
       * `'Maximum iteration limit exceeded.'` if the number of iterations exceeds 100.
       *
       * Usually you don't call `$digest()` directly in
       * {@link angular.directive.ng:controller controllers} or in {@link angular.directive directives}.
       * Instead a call to {@link angular.module.ng.$rootScope.Scope#$apply $apply()} (typically from within a
       * {@link angular.directive directive}) will force a `$digest()`.
       *
       * If you want to be notified whenever `$digest()` is called,
       * you can register a `watchExpression` function  with {@link angular.module.ng.$rootScope.Scope#$watch $watch()}
       * with no `listener`.
       *
       * You may have a need to call `$digest()` from within unit-tests, to simulate the scope
       * life-cycle.
       *
       * # Example
         <pre>
           var scope = ...;
           scope.name = 'misko';
           scope.counter = 0;

           expect(scope.counter).toEqual(0);
           scope.$watch('name', function(scope, newValue, oldValue) {
             counter = counter + 1;
           });
           expect(scope.counter).toEqual(0);

           scope.$digest();
           // no variable change
           expect(scope.counter).toEqual(0);

           scope.name = 'adam';
           scope.$digest();
           expect(scope.counter).toEqual(1);
         </pre>
       *
       */
      $digest: function() {
        var watch, value, last,
            watchers,
            asyncQueue,
            length,
            dirty, ttl = 100,
            next, current, target = this,
            watchLog = [],
            logIdx, logMsg;

        flagPhase(target, '$digest');

        do {
          dirty = false;
          current = target;
          do {
            asyncQueue = current.$$asyncQueue;
            while(asyncQueue.length) {
              try {
                current.$eval(asyncQueue.shift());
              } catch (e) {
                $exceptionHandler(e);
              }
            }
            if ((watchers = current.$$watchers)) {
              // process our watches
              length = watchers.length;
              while (length--) {
                try {
                  watch = watchers[length];
                  // Most common watches are on primitives, in which case we can short
                  // circuit it with === operator, only when === fails do we use .equals
                  if ((value = watch.get(current)) !== (last = watch.last) && !equals(value, last)) {
                    dirty = true;
                    watch.last = copy(value);
                    watch.fn(current, value, ((last === initWatchVal) ? value : last));
                    if (ttl < 5) {
                      logIdx = 4 - ttl;
                      if (!watchLog[logIdx]) watchLog[logIdx] = [];
                      logMsg = (isFunction(watch.exp))
                          ? 'fn: ' + (watch.exp.name || watch.exp.toString())
                          : watch.exp;
                      logMsg += '; newVal: ' + toJson(value) + '; oldVal: ' + toJson(last);
                      watchLog[logIdx].push(logMsg);
                    }
                  }
                } catch (e) {
                  $exceptionHandler(e);
                }
              }
            }

            // Insanity Warning: scope depth-first traversal
            // yes, this code is a bit crazy, but it works and we have tests to prove it!
            // this piece should be kept in sync with the traversal in $broadcast
            if (!(next = (current.$$childHead || (current !== target && current.$$nextSibling)))) {
              while(current !== target && !(next = current.$$nextSibling)) {
                current = current.$parent;
              }
            }
          } while ((current = next));

          if(dirty && !(ttl--)) {
            throw Error('100 $digest() iterations reached. Aborting!\n' +
                'Watchers fired in the last 5 iterations: ' + toJson(watchLog));
          }
        } while (dirty || asyncQueue.length);

        this.$root.$$phase = null;
      },

      /**
       * @ngdoc function
       * @name angular.module.ng.$rootScope.Scope#$destroy
       * @methodOf angular.module.ng.$rootScope.Scope
       * @function
       *
       * @description
       * Remove the current scope (and all of its children) from the parent scope. Removal implies
       * that calls to {@link angular.module.ng.$rootScope.Scope#$digest $digest()} will no longer propagate to the current
       * scope and its children. Removal also implies that the current scope is eligible for garbage
       * collection.
       *
       * The destructing scope emits an `$destroy` {@link angular.module.ng.$rootScope.Scope#$emit event}.
       *
       * The `$destroy()` is usually used by directives such as
       * {@link angular.widget.@ng:repeat ng:repeat} for managing the unrolling of the loop.
       *
       */
      $destroy: function() {
        if (this.$root == this) return; // we can't remove the root node;
        this.$emit('$destroy');
        var parent = this.$parent;

        if (parent.$$childHead == this) parent.$$childHead = this.$$nextSibling;
        if (parent.$$childTail == this) parent.$$childTail = this.$$prevSibling;
        if (this.$$prevSibling) this.$$prevSibling.$$nextSibling = this.$$nextSibling;
        if (this.$$nextSibling) this.$$nextSibling.$$prevSibling = this.$$prevSibling;
      },

      /**
       * @ngdoc function
       * @name angular.module.ng.$rootScope.Scope#$eval
       * @methodOf angular.module.ng.$rootScope.Scope
       * @function
       *
       * @description
       * Executes the `expression` on the current scope returning the result. Any exceptions in the
       * expression are propagated (uncaught). This is useful when evaluating engular expressions.
       *
       * # Example
         <pre>
           var scope = angular.module.ng.$rootScope.Scope();
           scope.a = 1;
           scope.b = 2;

           expect(scope.$eval('a+b')).toEqual(3);
           expect(scope.$eval(function(scope){ return scope.a + scope.b; })).toEqual(3);
         </pre>
       *
       * @param {(string|function())=} expression An angular expression to be executed.
       *
       *    - `string`: execute using the rules as defined in  {@link guide/dev_guide.expressions expression}.
       *    - `function(scope)`: execute the function with the current `scope` parameter.
       *
       * @returns {*} The result of evaluating the expression.
       */
      $eval: function(expr) {
        return $parse(expr)(this);
      },

      /**
       * @ngdoc function
       * @name angular.module.ng.$rootScope.Scope#$evalAsync
       * @methodOf angular.module.ng.$rootScope.Scope
       * @function
       *
       * @description
       * Executes the expression on the current scope at a later point in time.
       *
       * The `$evalAsync` makes no guarantees as to when the `expression` will be executed, only that:
       *
       *   - it will execute in the current script execution context (before any DOM rendering).
       *   - at least one {@link angular.module.ng.$rootScope.Scope#$digest $digest cycle} will be performed after
       *     `expression` execution.
       *
       * Any exceptions from the execution of the expression are forwarded to the
       * {@link angular.module.ng.$exceptionHandler $exceptionHandler} service.
       *
       * @param {(string|function())=} expression An angular expression to be executed.
       *
       *    - `string`: execute using the rules as defined in  {@link guide/dev_guide.expressions expression}.
       *    - `function(scope)`: execute the function with the current `scope` parameter.
       *
       */
      $evalAsync: function(expr) {
        this.$$asyncQueue.push(expr);
      },

      /**
       * @ngdoc function
       * @name angular.module.ng.$rootScope.Scope#$apply
       * @methodOf angular.module.ng.$rootScope.Scope
       * @function
       *
       * @description
       * `$apply()` is used to execute an expression in angular from outside of the angular framework.
       * (For example from browser DOM events, setTimeout, XHR or third party libraries).
       * Because we are calling into the angular framework we need to perform proper scope life-cycle
       * of {@link angular.module.ng.$exceptionHandler exception handling},
       * {@link angular.module.ng.$rootScope.Scope#$digest executing watches}.
       *
       * ## Life cycle
       *
       * # Pseudo-Code of `$apply()`
          function $apply(expr) {
            try {
              return $eval(expr);
            } catch (e) {
              $exceptionHandler(e);
            } finally {
              $root.$digest();
            }
          }
       *
       *
       * Scope's `$apply()` method transitions through the following stages:
       *
       * 1. The {@link guide/dev_guide.expressions expression} is executed using the
       *    {@link angular.module.ng.$rootScope.Scope#$eval $eval()} method.
       * 2. Any exceptions from the execution of the expression are forwarded to the
       *    {@link angular.module.ng.$exceptionHandler $exceptionHandler} service.
       * 3. The {@link angular.module.ng.$rootScope.Scope#$watch watch} listeners are fired immediately after the expression
       *    was executed using the {@link angular.module.ng.$rootScope.Scope#$digest $digest()} method.
       *
       *
       * @param {(string|function())=} exp An angular expression to be executed.
       *
       *    - `string`: execute using the rules as defined in {@link guide/dev_guide.expressions expression}.
       *    - `function(scope)`: execute the function with current `scope` parameter.
       *
       * @returns {*} The result of evaluating the expression.
       */
      $apply: function(expr) {
        try {
          flagPhase(this, '$apply');
          return this.$eval(expr);
        } catch (e) {
          $exceptionHandler(e);
        } finally {
          this.$root.$$phase = null;
          this.$root.$digest();
        }
      },

      /**
       * @ngdoc function
       * @name angular.module.ng.$rootScope.Scope#$on
       * @methodOf angular.module.ng.$rootScope.Scope
       * @function
       *
       * @description
       * Listen on events of a given type. See {@link angular.module.ng.$rootScope.Scope#$emit $emit} for discussion of
       * event life cycle.
       *
       * @param {string} name Event name to listen on.
       * @param {function(event)} listener Function to call when the event is emitted.
       * @returns {function()} Returns a deregistration function for this listener.
       *
       * The event listener function format is: `function(event)`. The `event` object passed into the
       * listener has the following attributes
       *   - `targetScope` - {Scope}: the scope on which the event was `$emit`-ed or `$broadcast`-ed.
       *   - `currentScope` - {Scope}: the current scope which is handling the event.
       *   - `name` - {string}: Name of the event.
       *   - `cancel` - {function=}: calling `cancel` function will cancel further event propagation
       *     (available only for events that were `$emit`-ed).
       */
      $on: function(name, listener) {
        var namedListeners = this.$$listeners[name];
        if (!namedListeners) {
          this.$$listeners[name] = namedListeners = [];
        }
        namedListeners.push(listener);

        return function() {
          arrayRemove(namedListeners, listener);
        };
      },


      /**
       * @ngdoc function
       * @name angular.module.ng.$rootScope.Scope#$emit
       * @methodOf angular.module.ng.$rootScope.Scope
       * @function
       *
       * @description
       * Dispatches an event `name` upwards through the scope hierarchy notifying the
       * registered {@link angular.module.ng.$rootScope.Scope#$on} listeners.
       *
       * The event life cycle starts at the scope on which `$emit` was called. All
       * {@link angular.module.ng.$rootScope.Scope#$on listeners} listening for `name` event on this scope get notified.
       * Afterwards, the event traverses upwards toward the root scope and calls all registered
       * listeners along the way. The event will stop propagating if one of the listeners cancels it.
       *
       * Any exception emmited from the {@link angular.module.ng.$rootScope.Scope#$on listeners} will be passed
       * onto the {@link angular.module.ng.$exceptionHandler $exceptionHandler} service.
       *
       * @param {string} name Event name to emit.
       * @param {...*} args Optional set of arguments which will be passed onto the event listeners.
       */
      $emit: function(name, args) {
        var empty = [],
            namedListeners,
            canceled = false,
            scope = this,
            event = {
              name: name,
              targetScope: scope,
              cancel: function() {canceled = true;}
            },
            listenerArgs = concat([event], arguments, 1),
            i, length;

        do {
          namedListeners = scope.$$listeners[name] || empty;
          event.currentScope = scope;
          for (i=0, length=namedListeners.length; i<length; i++) {
            try {
              namedListeners[i].apply(null, listenerArgs);
              if (canceled) return;
            } catch (e) {
              $exceptionHandler(e);
            }
          }
          //traverse upwards
          scope = scope.$parent;
        } while (scope);
      },


      /**
       * @ngdoc function
       * @name angular.module.ng.$rootScope.Scope#$broadcast
       * @methodOf angular.module.ng.$rootScope.Scope
       * @function
       *
       * @description
       * Dispatches an event `name` downwards to all child scopes (and their children) notifying the
       * registered {@link angular.module.ng.$rootScope.Scope#$on} listeners.
       *
       * The event life cycle starts at the scope on which `$broadcast` was called. All
       * {@link angular.module.ng.$rootScope.Scope#$on listeners} listening for `name` event on this scope get notified.
       * Afterwards, the event propagates to all direct and indirect scopes of the current scope and
       * calls all registered listeners along the way. The event cannot be canceled.
       *
       * Any exception emmited from the {@link angular.module.ng.$rootScope.Scope#$on listeners} will be passed
       * onto the {@link angular.module.ng.$exceptionHandler $exceptionHandler} service.
       *
       * @param {string} name Event name to emit.
       * @param {...*} args Optional set of arguments which will be passed onto the event listeners.
       */
      $broadcast: function(name, args) {
        var target = this,
            current = target,
            next = target,
            event = { name: name,
                      targetScope: target },
            listenerArgs = concat([event], arguments, 1);

        //down while you can, then up and next sibling or up and next sibling until back at root
        do {
          current = next;
          event.currentScope = current;
          forEach(current.$$listeners[name], function(listener) {
            try {
              listener.apply(null, listenerArgs);
            } catch(e) {
              $exceptionHandler(e);
            }
          });

          // Insanity Warning: scope depth-first traversal
          // yes, this code is a bit crazy, but it works and we have tests to prove it!
          // this piece should be kept in sync with the traversal in $digest
          if (!(next = (current.$$childHead || (current !== target && current.$$nextSibling)))) {
            while(current !== target && !(next = current.$$nextSibling)) {
              current = current.$parent;
            }
          }
        } while ((current = next));
      }
    };


    function flagPhase(scope, phase) {
      var root = scope.$root;

      if (root.$$phase) {
        throw Error(root.$$phase + ' already in progress');
      }

      root.$$phase = phase;
    }

    return new Scope();

    function compileToFn(exp, name) {
      var fn = $parse(exp);
      assertArgFn(fn, name);
      return fn;
    }

    /**
     * function used as an initial value for watchers.
     * because it's uniqueue we can easily tell it apart from other values
     */
    function initWatchVal() {}
  }];
}

/**
 * @ngdoc object
 * @name angular.module.ng.$sniffer
 * @requires $window
 *
 * @property {boolean} history Does the browser support html5 history api ?
 * @property {boolean} hashchange Does the browser support hashchange event ?
 *
 * @description
 * This is very simple implementation of testing browser's features.
 */
function $SnifferProvider(){
  this.$get = ['$window', function($window){
    if ($window.Modernizr) return $window.Modernizr;

    return {
      history: !!($window.history && $window.history.pushState),
      hashchange: 'onhashchange' in $window &&
                  // IE8 compatible mode lies
                  (!$window.document.documentMode || $window.document.documentMode > 7)
    };
  }];
}

/**
 * @ngdoc object
 * @name angular.module.ng.$window
 *
 * @description
 * A reference to the browser's `window` object. While `window`
 * is globally available in JavaScript, it causes testability problems, because
 * it is a global variable. In angular we always refer to it through the
 * `$window` service, so it may be overriden, removed or mocked for testing.
 *
 * All expressions are evaluated with respect to current scope so they don't
 * suffer from window globality.
 *
 * @example
   <doc:example>
     <doc:source>
       <input ng:init="$window = $service('$window'); greeting='Hello World!'" type="text" ng:model="greeting" />
       <button ng:click="$window.alert(greeting)">ALERT</button>
     </doc:source>
     <doc:scenario>
     </doc:scenario>
   </doc:example>
 */
function $WindowProvider(){
  this.$get = valueFn(window);
}

/**
 * Parse headers into key value object
 *
 * @param {string} headers Raw headers as a string
 * @returns {Object} Parsed headers as key value object
 */
function parseHeaders(headers) {
  var parsed = {}, key, val, i;

  if (!headers) return parsed;

  forEach(headers.split('\n'), function(line) {
    i = line.indexOf(':');
    key = lowercase(trim(line.substr(0, i)));
    val = trim(line.substr(i + 1));

    if (key) {
      if (parsed[key]) {
        parsed[key] += ', ' + val;
      } else {
        parsed[key] = val;
      }
    }
  });

  return parsed;
}


/**
 * Returns a function that provides access to parsed headers.
 *
 * Headers are lazy parsed when first requested.
 * @see parseHeaders
 *
 * @param {(string|Object)} headers Headers to provide access to.
 * @returns {function(string=)} Returns a getter function which if called with:
 *
 *   - if called with single an argument returns a single header value or null
 *   - if called with no arguments returns an object containing all headers.
 */
function headersGetter(headers) {
  var headersObj = isObject(headers) ? headers : undefined;

  return function(name) {
    if (!headersObj) headersObj =  parseHeaders(headers);

    if (name) {
      return headersObj[lowercase(name)] || null;
    }

    return headersObj;
  };
}


/**
 * Chain all given functions
 *
 * This function is used for both request and response transforming
 *
 * @param {*} data Data to transform.
 * @param {function(string=)} headers Http headers getter fn.
 * @param {(function|Array.<function>)} fns Function or an array of functions.
 * @returns {*} Transformed data.
 */
function transformData(data, headers, fns) {
  if (isFunction(fns))
    return fns(data, headers);

  forEach(fns, function(fn) {
    data = fn(data, headers);
  });

  return data;
}


function isSuccess(status) {
  return 200 <= status && status < 300;
}


function $HttpProvider() {
  var JSON_START = /^\s*(\[|\{[^\{])/,
      JSON_END = /[\}\]]\s*$/,
      PROTECTION_PREFIX = /^\)\]\}',?\n/;

  var $config = this.defaults = {
    // transform incoming response data
    transformResponse: function(data) {
      if (isString(data)) {
        // strip json vulnerability protection prefix
        data = data.replace(PROTECTION_PREFIX, '');
        if (JSON_START.test(data) && JSON_END.test(data))
          data = fromJson(data, true);
      }
      return data;
    },

    // transform outgoing request data
    transformRequest: function(d) {
      return isObject(d) ? toJson(d) : d;
    },

    // default headers
    headers: {
      common: {
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest'
      },
      post: {'Content-Type': 'application/json'},
      put:  {'Content-Type': 'application/json'}
    }
  };

  var providerResponseInterceptors = this.responseInterceptors = [];

  this.$get = ['$httpBackend', '$browser', '$cacheFactory', '$rootScope', '$q', '$injector',
      function($httpBackend, $browser, $cacheFactory, $rootScope, $q, $injector) {

    var defaultCache = $cacheFactory('$http'),
        responseInterceptors = [];

    forEach(providerResponseInterceptors, function(interceptor) {
      responseInterceptors.push(
          isString(interceptor)
              ? $injector.get(interceptor)
              : $injector.invoke(interceptor)
      );
    });


    /**
     * @ngdoc function
     * @name angular.module.ng.$http
     * @requires $httpBacked
     * @requires $browser
     * @requires $cacheFactory
     * @requires $rootScope
     * @requires $q
     * @requires $injector
     *
     * @description
     * The `$http` service is a core Angular service that is responsible for communication with the
     * remote HTTP servers via browser's {@link https://developer.mozilla.org/en/xmlhttprequest
     * XMLHttpRequest} object or via {@link http://en.wikipedia.org/wiki/JSONP JSONP}.
     *
     * For unit testing applications that use `$http` service, see
     * {@link angular.module.ngMock.$httpBackend $httpBackend mock}.
     *
     * For a higher level of abstraction, please check out the {@link angular.module.ng.$resource
     * $resource} service.
     *
     *
     * # General usage
     * The `$http` service is a function which takes a single argument ??? a configuration object ???
     * that is used to generate an http request and returns  a {@link angular.module.ng.$q promise}
     * with two $http specific methods: `success` and `error`.
     *
     * <pre>
     *   $http({method: 'GET', url: '/someUrl'}).
     *     success(function(data, status, headers, config) {
     *       // this callback will be called asynchronously
     *       // when the response is available
     *     }).
     *     error(function(data, status, headers, config) {
     *       // called asynchronously if an error occurs
     *       // or server returns response with status
     *       // code outside of the <200, 400) range
     *     });
     * </pre>
     *
     * Since the returned value is a Promise object, you can also use the `then` method to register
     * callbacks, and these callbacks will receive a single argument ??? an object representing the
     * response. See the api signature and type info below for more details.
     *
     *
     * # Shortcut methods
     *
     * Since all invocation of the $http service require definition of the http method and url and
     * POST and PUT requests require response body/data to be provided as well, shortcut methods
     * were created to simplify using the api:
     *
     * <pre>
     *   $http.get('/someUrl').success(successCallback);
     *   $http.post('/someUrl', data).success(successCallback);
     * </pre>
     *
     * Complete list of shortcut methods:
     *
     * - {@link angular.module.ng.$http#get $http.get}
     * - {@link angular.module.ng.$http#head $http.head}
     * - {@link angular.module.ng.$http#post $http.post}
     * - {@link angular.module.ng.$http#put $http.put}
     * - {@link angular.module.ng.$http#delete $http.delete}
     * - {@link angular.module.ng.$http#jsonp $http.jsonp}
     *
     *
     * # HTTP Headers
     *
     * The $http service will automatically add certain http headers to all requests. These defaults
     * can be fully configured by accessing the `$httpProvider.defaults.headers` configuration
     * object, which currently contains this default configuration:
     *
     * - `$httpProvider.defaults.headers.common` (headers that are common for all requests):
     *   - `Accept: application/json, text/plain, * / *`
     *   - `X-Requested-With: XMLHttpRequest`
     * - `$httpProvider.defaults.headers.post: (header defaults for HTTP POST requests)
     *   - `Content-Type: application/json`
     * - `$httpProvider.defaults.headers.put` (header defaults for HTTP PUT requests)
     *   - `Content-Type: application/json`
     *
     * To add or overwrite these defaults, simply add or remove a property from this configuration
     * objects. To add headers for an HTTP method other than POST or PUT, simply add a new object
     * with name equal to the lower-cased http method name, e.g.
     * `$httpProvider.defaults.headers.get['My-Header']='value'`.
     *
     *
     * # Request / Response transformations
     *
     * Both requests and responses can be transformed using transform functions. By default, Angular
     * applies these transformations:
     *
     * Request transformations:
     *
     * - if the `data` property of the request config object contains an object, serialize it into
     *   JSON format.
     *
     * Response transformations:
     *
     *  - if XSRF prefix is detected, strip it (see Security Considerations section below)
     *  - if json response is detected, deserialize it using a JSON parser
     *
     * These transformations can be overridden locally by specifying transform functions as
     * `transformRequest` and/or `transformResponse` properties of the config object. To globally
     * override the default transforms, override the `$httpProvider.defaults.transformRequest` and
     * `$httpProvider.defaults.transformResponse` properties of the `$httpProvider`.
     *
     *
     * # Caching
     *
     * You can enable caching by setting the configuration property `cache` to `true`. When the
     * cache is enabled, `$http` stores the response from the server in local cache. Next time the
     * response is served from the cache without sending a request to the server.
     *
     * Note that even if the response is served from cache, delivery of the data is asynchronous in
     * the same way that real requests are.
     *
     * If there are multiple GET requests for the same url that should be cached using the same
     * cache, but the cache is not populated yet, only one request to the server will be made and
     * the remaining requests will be fulfilled using the response for the first request.
     *
     *
     * # Response interceptors
     *
     * For purposes of global error handling, authentication or any kind of synchronous or
     * asynchronous preprocessing of received responses, it is desirable to be able to intercept
     * responses for http requests before they are handed over to the application code that
     * initiated these requests. The response interceptors leverage the {@link angular.module.ng.$q
     * promise apis} to fulfil this need for both synchronous and asynchronous preprocessing.
     *
     * The interceptors are service factories that are registered with the $httpProvider by
     * adding them to the `$httpProvider.responseInterceptors` array. The factory is called and
     * injected with dependencies (if specified) and returns the interceptor  ??? a function that
     * takes a {@link angular.module.ng.$q promise} and returns the original or a new promise.
     *
     * Before you start creating interceptors, be sure to understand the
     * {@link angular.module.ng.$q $q and deferred/promise APIs}.
     *
     * <pre>
     *   // register the interceptor as a service
     *   $provide.factory('myHttpInterceptor', function($q, dependency1, dependency2) {
     *     return function(promise) {
     *       return promise.then(function(response) {
     *         // do something on success
     *       }, function(response) {
     *         // do something on error
     *         if (canRecover(response)) {
     *           return responseOrNewPromise
     *         }
     *         return $q.reject(response);
     *       });
     *     }
     *   });
     *
     *   $httpProvider.responseInterceptors.push('myHttpInterceptor');
     *
     *
     *   // register the interceptor via an anonymous factory
     *   $httpProvider.responseInterceptors.push(function($q, dependency1, dependency2) {
     *     return function(promise) {
     *       // same as above
     *     }
     *   });
     * </pre>
     *
     *
     * # Security Considerations
     *
     * When designing web applications your design needs to consider security threats from
     * {@link http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx
     * JSON Vulnerability} and {@link http://en.wikipedia.org/wiki/Cross-site_request_forgery XSRF}.
     * Both server and the client must cooperate in order to eliminate these threats. Angular comes
     * pre-configured with strategies that address these issues, but for this to work backend server
     * cooperation is required.
     *
     * ## JSON Vulnerability Protection
     *
     * A {@link http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx
     * JSON Vulnerability} allows third party web-site to turn your JSON resource URL into
     * {@link http://en.wikipedia.org/wiki/JSON#JSONP JSONP} request under some conditions. To
     * counter this your server can prefix all JSON requests with following string `")]}',\n"`.
     * Angular will automatically strip the prefix before processing it as JSON.
     *
     * For example if your server needs to return:
     * <pre>
     * ['one','two']
     * </pre>
     *
     * which is vulnerable to attack, your server can return:
     * <pre>
     * )]}',
     * ['one','two']
     * </pre>
     *
     * Angular will strip the prefix, before processing the JSON.
     *
     *
     * ## Cross Site Request Forgery (XSRF) Protection
     *
     * {@link http://en.wikipedia.org/wiki/Cross-site_request_forgery XSRF} is a technique by which
     * an unauthorized site can gain your user's private data. Angular provides following mechanism
     * to counter XSRF. When performing XHR requests, the $http service reads a token from a cookie
     * called `XSRF-TOKEN` and sets it as the HTTP header `X-XSRF-TOKEN`. Since only JavaScript that
     * runs on your domain could read the cookie, your server can be assured that the XHR came from
     * JavaScript running on your domain.
     *
     * To take advantage of this, your server needs to set a token in a JavaScript readable session
     * cookie called `XSRF-TOKEN` on first HTTP GET request. On subsequent non-GET requests the
     * server can verify that the cookie matches `X-XSRF-TOKEN` HTTP header, and therefore be sure
     * that only JavaScript running on your domain could have read the token. The token must be
     * unique for each user and must be verifiable by the server (to prevent the JavaScript making
     * up its own tokens). We recommend that the token is a digest of your site's authentication
     * cookie with {@link http://en.wikipedia.org/wiki/Rainbow_table salt for added security}.
     *
     *
     * @param {object} config Object describing the request to be made and how it should be
     *    processed. The object has following properties:
     *
     *    - **method** ??? `{string}` ??? HTTP method (e.g. 'GET', 'POST', etc)
     *    - **url** ??? `{string}` ??? Absolute or relative URL of the resource that is being requested.
     *    - **data** ??? `{string|Object}` ??? Data to be sent as the request message data.
     *    - **headers** ??? `{Object}` ??? Map of strings representing HTTP headers to send to the server.
     *    - **transformRequest** ??? `{function(data, headersGetter)|Array.<function(data, headersGetter)>}` ???
     *      transform function or an array of such functions. The transform function takes the http
     *      request body and headers and returns its transformed (typically serialized) version.
     *    - **transformResponse** ??? `{function(data, headersGetter)|Array.<function(data, headersGetter)>}` ???
     *      transform function or an array of such functions. The transform function takes the http
     *      response body and headers and returns its transformed (typically deserialized) version.
     *    - **cache** ??? `{boolean|Cache}` ??? If true, a default $http cache will be used to cache the
     *      GET request, otherwise if a cache instance built with
     *      {@link angular.module.ng.$cacheFactory $cacheFactory}, this cache will be used for
     *      caching.
     *    - **timeout** ??? `{number}` ??? timeout in milliseconds.
     *
     * @returns {HttpPromise} Returns a {@link angular.module.ng.$q promise} object with the
     *   standard `then` method and two http specific methods: `success` and `error`. The `then`
     *   method takes two arguments a success and an error callback which will be called with a
     *   response object. The `success` and `error` methods take a single argument - a function that
     *   will be called when the request succeeds or fails respectively. The arguments passed into
     *   these functions are destructured representation of the response object passed into the
     *   `then` method. The response object has these properties:
     *
     *   - **data** ??? `{string|Object}` ??? The response body transformed with the transform functions.
     *   - **status** ??? `{number}` ??? HTTP status code of the response.
     *   - **headers** ??? `{function([headerName])}` ??? Header getter function.
     *   - **config** ??? `{Object}` ??? The configuration object that was used to generate the request.
     *
     * @property {Array.<Object>} pendingRequests Array of config objects for currently pending
     *   requests. This is primarily meant to be used for debugging purposes.
     *
     *
     * @example
        <doc:example>
          <doc:source jsfiddle="false">
            <script>
              function FetchCtrl($http) {
                var self = this;
                this.method = 'GET';
                this.url = 'examples/http-hello.html';

                this.fetch = function() {
                  self.code = null;
                  self.response = null;

                  $http({method: self.method, url: self.url}).
                    success(function(data, status) {
                      self.status = status;
                      self.data = data;
                    }).
                    error(function(data, status) {
                      self.data = data || "Request failed";
                      self.status = status;
                  });
                };

                this.updateModel = function(method, url) {
                  self.method = method;
                  self.url = url;
                };
              }
            </script>
            <div ng:controller="FetchCtrl">
              <select ng:model="method">
                <option>GET</option>
                <option>JSONP</option>
              </select>
              <input type="text" ng:model="url" size="80"/>
              <button ng:click="fetch()">fetch</button><br>
              <button ng:click="updateModel('GET', 'examples/http-hello.html')">Sample GET</button>
              <button ng:click="updateModel('JSONP', 'http://angularjs.org/greet.php?callback=JSON_CALLBACK&name=Super%20Hero')">Sample JSONP</button>
              <button ng:click="updateModel('JSONP', 'http://angularjs.org/doesntexist&callback=JSON_CALLBACK')">Invalid JSONP</button>
              <pre>http status code: {{status}}</pre>
              <pre>http response data: {{data}}</pre>
            </div>
          </doc:source>
          <doc:scenario>
            it('should make an xhr GET request', function() {
              element(':button:contains("Sample GET")').click();
              element(':button:contains("fetch")').click();
              expect(binding('status')).toBe('http status code: 200');
              expect(binding('data')).toBe('http response data: Hello, $http!\n');
            });

            it('should make a JSONP request to angularjs.org', function() {
              element(':button:contains("Sample JSONP")').click();
              element(':button:contains("fetch")').click();
              expect(binding('status')).toBe('http status code: 200');
              expect(binding('data')).toMatch(/Super Hero!/);
            });

            it('should make JSONP request to invalid URL and invoke the error handler',
                function() {
              element(':button:contains("Invalid JSONP")').click();
              element(':button:contains("fetch")').click();
              expect(binding('status')).toBe('http status code: 0');
              expect(binding('data')).toBe('http response data: Request failed');
            });
          </doc:scenario>
        </doc:example>
     */
    function $http(config) {
      config.method = uppercase(config.method);

      var reqTransformFn = config.transformRequest || $config.transformRequest,
          respTransformFn = config.transformResponse || $config.transformResponse,
          defHeaders = $config.headers,
          reqHeaders = extend({'X-XSRF-TOKEN': $browser.cookies()['XSRF-TOKEN']},
              defHeaders.common, defHeaders[lowercase(config.method)], config.headers),
          reqData = transformData(config.data, headersGetter(reqHeaders), reqTransformFn),
          promise;


      // send request
      promise = sendReq(config, reqData, reqHeaders);


      // transform future response
      promise = promise.then(transformResponse, transformResponse);

      // apply interceptors
      forEach(responseInterceptors, function(interceptor) {
        promise = interceptor(promise);
      });

      promise.success = function(fn) {
        promise.then(function(response) {
          fn(response.data, response.status, response.headers, config);
        });
        return promise;
      };

      promise.error = function(fn) {
        promise.then(null, function(response) {
          fn(response.data, response.status, response.headers, config);
        });
        return promise;
      };

      return promise;

      function transformResponse(response) {
        // make a copy since the response must be cacheable
        var resp = extend({}, response, {
          data: transformData(response.data, response.headers, respTransformFn)
        });
        return (isSuccess(response.status))
          ? resp
          : $q.reject(resp);
      }
    }

    $http.pendingRequests = [];

    /**
     * @ngdoc method
     * @name angular.module.ng.$http#get
     * @methodOf angular.module.ng.$http
     *
     * @description
     * Shortcut method to perform `GET` request
     *
     * @param {string} url Relative or absolute URL specifying the destination of the request
     * @param {Object=} config Optional configuration object
     * @returns {HttpPromise} Future object
     */

    /**
     * @ngdoc method
     * @name angular.module.ng.$http#delete
     * @methodOf angular.module.ng.$http
     *
     * @description
     * Shortcut method to perform `DELETE` request
     *
     * @param {string} url Relative or absolute URL specifying the destination of the request
     * @param {Object=} config Optional configuration object
     * @returns {HttpPromise} Future object
     */

    /**
     * @ngdoc method
     * @name angular.module.ng.$http#head
     * @methodOf angular.module.ng.$http
     *
     * @description
     * Shortcut method to perform `HEAD` request
     *
     * @param {string} url Relative or absolute URL specifying the destination of the request
     * @param {Object=} config Optional configuration object
     * @returns {XhrFuture} Future object
     */

    /**
     * @ngdoc method
     * @name angular.module.ng.$http#jsonp
     * @methodOf angular.module.ng.$http
     *
     * @description
     * Shortcut method to perform `JSONP` request
     *
     * @param {string} url Relative or absolute URL specifying the destination of the request.
     *                     Should contain `JSON_CALLBACK` string.
     * @param {Object=} config Optional configuration object
     * @returns {XhrFuture} Future object
     */
    createShortMethods('get', 'delete', 'head', 'jsonp');

    /**
     * @ngdoc method
     * @name angular.module.ng.$http#post
     * @methodOf angular.module.ng.$http
     *
     * @description
     * Shortcut method to perform `POST` request
     *
     * @param {string} url Relative or absolute URL specifying the destination of the request
     * @param {*} data Request content
     * @param {Object=} config Optional configuration object
     * @returns {HttpPromise} Future object
     */

    /**
     * @ngdoc method
     * @name angular.module.ng.$http#put
     * @methodOf angular.module.ng.$http
     *
     * @description
     * Shortcut method to perform `PUT` request
     *
     * @param {string} url Relative or absolute URL specifying the destination of the request
     * @param {*} data Request content
     * @param {Object=} config Optional configuration object
     * @returns {XhrFuture} Future object
     */
    createShortMethodsWithData('post', 'put');


    return $http;


    function createShortMethods(names) {
      forEach(arguments, function(name) {
        $http[name] = function(url, config) {
          return $http(extend(config || {}, {
            method: name,
            url: url
          }));
        };
      });
    }


    function createShortMethodsWithData(name) {
      forEach(arguments, function(name) {
        $http[name] = function(url, data, config) {
          return $http(extend(config || {}, {
            method: name,
            url: url,
            data: data
          }));
        };
      });
    }


    /**
     * Makes the request
     *
     * !!! ACCESSES CLOSURE VARS:
     * $httpBackend, $config, $log, $rootScope, defaultCache, $http.pendingRequests
     */
    function sendReq(config, reqData, reqHeaders) {
      var deferred = $q.defer(),
          promise = deferred.promise,
          cache,
          cachedResp;

      $http.pendingRequests.push(config);
      promise.then(removePendingReq, removePendingReq);


      if (config.cache && config.method == 'GET') {
        cache = isObject(config.cache) ? config.cache : defaultCache;
      }

      if (cache) {
        cachedResp = cache.get(config.url);
        if (cachedResp) {
          if (cachedResp.then) {
            // cached request has already been sent, but there is no response yet
            cachedResp.then(removePendingReq, removePendingReq);
            return cachedResp;
          } else {
            // serving from cache
            if (isArray(cachedResp)) {
              resolvePromise(cachedResp[1], cachedResp[0], copy(cachedResp[2]));
            } else {
              resolvePromise(cachedResp, 200, {});
            }
          }
        } else {
          // put the promise for the non-transformed response into cache as a placeholder
          cache.put(config.url, promise);
        }
      }

      // if we won't have the response in cache, send the request to the backend
      if (!cachedResp) {
        $httpBackend(config.method, config.url, reqData, done, reqHeaders, config.timeout);
      }

      return promise;


      /**
       * Callback registered to $httpBackend():
       *  - caches the response if desired
       *  - resolves the raw $http promise
       *  - calls $apply
       */
      function done(status, response, headersString) {
        if (cache) {
          if (isSuccess(status)) {
            cache.put(config.url, [status, response, parseHeaders(headersString)]);
          } else {
            // remove promise from the cache
            cache.remove(config.url);
          }
        }

        resolvePromise(response, status, headersString);
        $rootScope.$apply();
      }


      /**
       * Resolves the raw $http promise.
       */
      function resolvePromise(response, status, headers) {
        // normalize internal statuses to 0
        status = Math.max(status, 0);

        (isSuccess(status) ? deferred.resolve : deferred.reject)({
          data: response,
          status: status,
          headers: headersGetter(headers),
          config: config
        });
      }


      function removePendingReq() {
        var idx = indexOf($http.pendingRequests, config);
        if (idx !== -1) $http.pendingRequests.splice(idx, 1);
      }
    }
  }];
}
var XHR = window.XMLHttpRequest || function() {
  try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e1) {}
  try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e2) {}
  try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e3) {}
  throw new Error("This browser does not support XMLHttpRequest.");
};


/**
 * @ngdoc object
 * @name angular.module.ng.$httpBackend
 * @requires $browser
 * @requires $window
 * @requires $document
 *
 * @description
 * HTTP backend used by the {@link angular.module.ng.$http service} that delegates to
 * XMLHttpRequest object or JSONP and deals with browser incompatibilities.
 *
 * You should never need to use this service directly, instead use the higher-level abstractions:
 * {@link angular.module.ng.$http $http} or {@link angular.module.ng.$resource $resource}.
 *
 * During testing this implementation is swapped with {@link angular.module.ngMock.$httpBackend mock
 * $httpBackend} which can be trained with responses.
 */
function $HttpBackendProvider() {
  this.$get = ['$browser', '$window', '$document', function($browser, $window, $document) {
    return createHttpBackend($browser, XHR, $browser.defer, $window.angular.callbacks,
        $document[0].body, $window.location.protocol.replace(':', ''));
  }];
}

function createHttpBackend($browser, XHR, $browserDefer, callbacks, body, locationProtocol) {
  // TODO(vojta): fix the signature
  return function(method, url, post, callback, headers, timeout) {
    $browser.$$incOutstandingRequestCount();

    if (lowercase(method) == 'jsonp') {
      var callbackId = '_' + (callbacks.counter++).toString(36);
      callbacks[callbackId] = function(data) {
        callbacks[callbackId].data = data;
      };

      var script = $browser.addJs(url.replace('JSON_CALLBACK', 'angular.callbacks.' + callbackId),
          function() {
        if (callbacks[callbackId].data) {
          completeRequest(callback, 200, callbacks[callbackId].data);
        } else {
          completeRequest(callback, -2);
        }
        delete callbacks[callbackId];
        body.removeChild(script);
      });
    } else {
      var xhr = new XHR();
      xhr.open(method, url, true);
      forEach(headers, function(value, key) {
        if (value) xhr.setRequestHeader(key, value);
      });

      var status;

      // In IE6 and 7, this might be called synchronously when xhr.send below is called and the
      // response is in the cache. the promise api will ensure that to the app code the api is
      // always async
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          completeRequest(
              callback, status || xhr.status, xhr.responseText, xhr.getAllResponseHeaders());
        }
      };

      xhr.send(post || '');

      if (timeout > 0) {
        $browserDefer(function() {
          status = -1;
          xhr.abort();
        }, timeout);
      }
    }


    function completeRequest(callback, status, response, headersString) {
      // URL_MATCH is defined in src/service/location.js
      var protocol = (url.match(URL_MATCH) || ['', locationProtocol])[1];

      // fix status code for file protocol (it's always 0)
      status = (protocol == 'file') ? (response ? 200 : 404) : status;

      // normalize IE bug (http://bugs.jquery.com/ticket/1450)
      status = status == 1223 ? 204 : status;

      callback(status, response, headersString);
      $browser.$$completeOutstandingRequest(noop);
    }
  };
}

/**
 * @ngdoc object
 * @name angular.module.ng.$locale
 *
 * @description
 * $locale service provides localization rules for various Angular components. As of right now the
 * only public api is:
 *
 * * `id` ??? `{string}` ??? locale id formatted as `languageId-countryId` (e.g. `en-us`)
 */
function $LocaleProvider(){
  this.$get = function() {
    return {
      id: 'en-us',

      NUMBER_FORMATS: {
        DECIMAL_SEP: '.',
        GROUP_SEP: ',',
        PATTERNS: [
          { // Decimal Pattern
            minInt: 1,
            minFrac: 0,
            maxFrac: 3,
            posPre: '',
            posSuf: '',
            negPre: '-',
            negSuf: '',
            gSize: 3,
            lgSize: 3
          },{ //Currency Pattern
            minInt: 1,
            minFrac: 2,
            maxFrac: 2,
            posPre: '\u00A4',
            posSuf: '',
            negPre: '(\u00A4',
            negSuf: ')',
            gSize: 3,
            lgSize: 3
          }
        ],
        CURRENCY_SYM: '$'
      },

      DATETIME_FORMATS: {
        MONTH: 'January,February,March,April,May,June,July,August,September,October,November,December'
                .split(','),
        SHORTMONTH:  'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','),
        DAY: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(','),
        SHORTDAY: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(','),
        AMPMS: ['AM','PM'],
        medium: 'MMM d, y h:mm:ss a',
        short: 'M/d/yy h:mm a',
        fullDate: 'EEEE, MMMM d, y',
        longDate: 'MMMM d, y',
        mediumDate: 'MMM d, y',
        shortDate: 'M/d/yy',
        mediumTime: 'h:mm:ss a',
        shortTime: 'h:mm a'
      },

      pluralCat: function(num) {
        if (num === 1) {
          return 'one';
        }
        return 'other';
      }
    };
  };
}

/**
 * @ngdoc function
 * @name angular.directive
 * @description
 *
 * Angular directives create custom attributes for DOM elements. A directive can modify the
 * behavior of the element in which it is specified. Do not use directives to add elements to the
 * DOM; instead, use {@link angular.widget widgets} to add DOM elements.
 *
 * For more information about how Angular directives work, and to learn how to create your own
 * directives, see {@link guide/dev_guide.compiler.directives Understanding Angular Directives} in
 * the Angular Developer Guide.
 *
 * @param {string} name Directive identifier (case insensitive).
 * @param {function(string, Element)} compileFn Also called "template function" is a function called
 *    during compilation of the template when the compiler comes across the directive being
 *    registered. The string value of the element attribute representing the directive and
 *    jQuery/jqLite wrapped DOM element are passed as arguments to this function.
 *
 *    The `compileFn` function may return a linking function also called an instance function.
 *    This function is called during the linking phase when a Scope is being associated with the
 *    template or template clone (see repeater notes below). The signature of the linking function
 *    is: `function(Element)` where Element is jQuery/jqLite wrapped DOM Element that is being
 *    linked.
 *
 * The biggest differenciator between the compile and linking functions is how they are being called
 * when a directive is present within an {@link angular.widget.@ng:repeat ng:repeat}. In this case,
 * the compile function gets called once per occurence of the directive in the template. On the
 * other hand the linking function gets called once for each repeated clone of the template (times
 * number of occurences of the directive in the repeated template).
 */

/**
 * @ngdoc directive
 * @name angular.directive.ng:init
 *
 * @description
 * The `ng:init` attribute specifies initialization tasks to be executed
 *  before the template enters execution mode during bootstrap.
 *
 * @element ANY
 * @param {expression} expression {@link guide/dev_guide.expressions Expression} to eval.
 *
 * @example
   <doc:example>
     <doc:source>
    <div ng:init="greeting='Hello'; person='World'">
      {{greeting}} {{person}}!
    </div>
     </doc:source>
     <doc:scenario>
       it('should check greeting', function() {
         expect(binding('greeting')).toBe('Hello');
         expect(binding('person')).toBe('World');
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:init", function(expression){
  return function(element){
    this.$eval(expression);
  };
});

/**
 * @ngdoc directive
 * @name angular.directive.ng:controller
 *
 * @description
 * The `ng:controller` directive assigns behavior to a scope. This is a key aspect of how angular
 * supports the principles behind the Model-View-Controller design pattern.
 *
 * MVC components in angular:
 *
 * * Model ??? The Model is data in scope properties; scopes are attached to the DOM.
 * * View ??? The template (HTML with data bindings) is rendered into the View.
 * * Controller ??? The `ng:controller` directive specifies a Controller class; the class has
 *   methods that typically express the business logic behind the application.
 *
 * Note that an alternative way to define controllers is via the `{@link angular.module.ng.$route}`
 * service.
 *
 * @element ANY
 * @param {expression} expression Name of a globally accessible constructor function or an
 *     {@link guide/dev_guide.expressions expression} that on the current scope evaluates to a
 *     constructor function.
 *
 * @example
 * Here is a simple form for editing user contact information. Adding, removing, clearing, and
 * greeting are methods declared on the controller (see source tab). These methods can
 * easily be called from the angular markup. Notice that the scope becomes the `this` for the
 * controller's instance. This allows for easy access to the view data from the controller. Also
 * notice that any changes to the data are automatically reflected in the View without the need
 * for a manual update.
   <doc:example>
     <doc:source>
      <script type="text/javascript">
        function SettingsController() {
          this.name = "John Smith";
          this.contacts = [
            {type:'phone', value:'408 555 1212'},
            {type:'email', value:'john.smith@example.org'} ];
        }
        SettingsController.prototype = {
         greet: function() {
           alert(this.name);
         },
         addContact: function() {
           this.contacts.push({type:'email', value:'yourname@example.org'});
         },
         removeContact: function(contactToRemove) {
           var index = this.contacts.indexOf(contactToRemove);
           this.contacts.splice(index, 1);
         },
         clearContact: function(contact) {
           contact.type = 'phone';
           contact.value = '';
         }
        };
      </script>
      <div ng:controller="SettingsController">
        Name: <input type="text" ng:model="name"/>
        [ <a href="" ng:click="greet()">greet</a> ]<br/>
        Contact:
        <ul>
          <li ng:repeat="contact in contacts">
            <select ng:model="contact.type">
               <option>phone</option>
               <option>email</option>
            </select>
            <input type="text" ng:model="contact.value"/>
            [ <a href="" ng:click="clearContact(contact)">clear</a>
            | <a href="" ng:click="removeContact(contact)">X</a> ]
          </li>
          <li>[ <a href="" ng:click="addContact()">add</a> ]</li>
       </ul>
      </div>
     </doc:source>
     <doc:scenario>
       it('should check controller', function() {
         expect(element('.doc-example-live div>:input').val()).toBe('John Smith');
         expect(element('.doc-example-live li:nth-child(1) input').val())
           .toBe('408 555 1212');
         expect(element('.doc-example-live li:nth-child(2) input').val())
           .toBe('john.smith@example.org');

         element('.doc-example-live li:first a:contains("clear")').click();
         expect(element('.doc-example-live li:first input').val()).toBe('');

         element('.doc-example-live li:last a:contains("add")').click();
         expect(element('.doc-example-live li:nth-child(3) input').val())
           .toBe('yourname@example.org');
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:controller", function(expression){
  this.scope(function(scope){
    var Controller =
      getter(scope, expression, true) ||
      getter(window, expression, true);
    assertArgFn(Controller, expression);
    inferInjectionArgs(Controller);
    return Controller;
  });
  return noop;
});

/**
 * @ngdoc directive
 * @name angular.directive.ng:bind
 *
 * @description
 * The `ng:bind` attribute tells Angular to replace the text content of the specified HTML element
 * with the value of a given expression, and to update the text content when the value of that
 * expression changes.
 *
 * Typically, you don't use `ng:bind` directly, but instead you use the double curly markup like
 * `{{ expression }}` and let the Angular compiler transform it to
 * `<span ng:bind="expression"></span>` when the template is compiled.
 *
 * @element ANY
 * @param {expression} expression {@link guide/dev_guide.expressions Expression} to evaluate.
 *
 * @example
 * Enter a name in the Live Preview text box; the greeting below the text box changes instantly.
   <doc:example>
     <doc:source>
       <script>
         function Ctrl() {
           this.name = 'Whirled';
         }
       </script>
       <div ng:controller="Ctrl">
         Enter name: <input type="text" ng:model="name"> <br/>
         Hello <span ng:bind="name"></span>!
       </div>
     </doc:source>
     <doc:scenario>
       it('should check ng:bind', function() {
         expect(using('.doc-example-live').binding('name')).toBe('Whirled');
         using('.doc-example-live').input('name').enter('world');
         expect(using('.doc-example-live').binding('name')).toBe('world');
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:bind", function(expression, element){
  element.addClass('ng-binding');
  return ['$exceptionHandler', '$parse', '$element', function($exceptionHandler, $parse, element) {
    var exprFn = $parse(expression),
        lastValue = Number.NaN;

    this.$watch(function(scope) {
      // TODO(misko): remove error handling https://github.com/angular/angular.js/issues/347
      var value, html, isHtml, isDomElement,
          hadOwnElement = scope.hasOwnProperty('$element'),
          oldElement = scope.$element;
      // TODO(misko): get rid of $element https://github.com/angular/angular.js/issues/348
      scope.$element = element;
      try {
        value = exprFn(scope);
        // If we are HTML than save the raw HTML data so that we don't recompute sanitization since
        // it is expensive.
        // TODO(misko): turn this into a more generic way to compute this
        if ((isHtml = (value instanceof HTML)))
          value = (html = value).html;
        if (lastValue === value) return;
        isDomElement = isElement(value);
        if (!isHtml && !isDomElement && isObject(value)) {
          value = toJson(value, true);
        }
        if (value != lastValue) {
          lastValue = value;
          if (isHtml) {
            element.html(html.get());
          } else if (isDomElement) {
            element.html('');
            element.append(value);
          } else {
            element.text(value == undefined ? '' : value);
          }
        }
      } catch (e) {
        $exceptionHandler(e);
      } finally {
        if (hadOwnElement) {
          scope.$element = oldElement;
        } else {
          delete scope.$element;
        }
      }
    });
  }];
});


/**
 * @ngdoc directive
 * @name angular.directive.ng:bind-template
 *
 * @description
 * The `ng:bind-template` attribute specifies that the element
 * text should be replaced with the template in ng:bind-template.
 * Unlike ng:bind the ng:bind-template can contain multiple `{{` `}}`
 * expressions. (This is required since some HTML elements
 * can not have SPAN elements such as TITLE, or OPTION to name a few.)
 *
 * @element ANY
 * @param {string} template of form
 *   <tt>{{</tt> <tt>expression</tt> <tt>}}</tt> to eval.
 *
 * @example
 * Try it here: enter text in text box and watch the greeting change.
   <doc:example>
     <doc:source>
       <script>
         function Ctrl() {
           this.salutation = 'Hello';
           this.name = 'World';
         }
       </script>
       <div ng:controller="Ctrl">
        Salutation: <input type="text" ng:model="salutation"><br/>
        Name: <input type="text" ng:model="name"><br/>
        <pre ng:bind-template="{{salutation}} {{name}}!"></pre>
       </div>
     </doc:source>
     <doc:scenario>
       it('should check ng:bind', function() {
         expect(using('.doc-example-live').binding('{{salutation}} {{name}}')).
           toBe('Hello World!');
         using('.doc-example-live').input('salutation').enter('Greetings');
         using('.doc-example-live').input('name').enter('user');
         expect(using('.doc-example-live').binding('{{salutation}} {{name}}')).
           toBe('Greetings user!');
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:bind-template", function(expression, element){
  element.addClass('ng-binding');
  var templateFn = compileBindTemplate(expression);
  return function(element) {
    var lastValue;
    this.$watch(function(scope) {
      var value = templateFn(scope, element, true);
      if (value != lastValue) {
        element.text(value);
        lastValue = value;
      }
    });
  };
});

/**
 * @ngdoc directive
 * @name angular.directive.ng:bind-attr
 *
 * @description
 * The `ng:bind-attr` attribute specifies that a
 * {@link guide/dev_guide.templates.databinding databinding}  should be created between a particular
 * element attribute and a given expression. Unlike `ng:bind`, the `ng:bind-attr` contains one or
 * more JSON key value pairs; each pair specifies an attribute and the
 * {@link guide/dev_guide.expressions expression} to which it will be mapped.
 *
 * Instead of writing `ng:bind-attr` statements in your HTML, you can use double-curly markup to
 * specify an <tt ng:non-bindable>{{expression}}</tt> for the value of an attribute.
 * At compile time, the attribute is translated into an
 * `<span ng:bind-attr="{attr:expression}"></span>`.
 *
 * The following HTML snippet shows how to specify `ng:bind-attr`:
 * <pre>
 *   <a ng:bind-attr='{"href":"http://www.google.com/search?q={{query}}"}'>Google</a>
 * </pre>
 *
 * This is cumbersome, so as we mentioned using double-curly markup is a prefered way of creating
 * this binding:
 * <pre>
 *   <a href="http://www.google.com/search?q={{query}}">Google</a>
 * </pre>
 *
 * During compilation, the template with attribute markup gets translated to the ng:bind-attr form
 * mentioned above.
 *
 * _Note_: You might want to consider using {@link angular.directive.ng:href ng:href} instead of
 * `href` if the binding is present in the main application template (`index.html`) and you want to
 * make sure that a user is not capable of clicking on raw/uncompiled link.
 *
 *
 * @element ANY
 * @param {string} attribute_json one or more JSON key-value pairs representing
 *    the attributes to replace with expressions. Each key matches an attribute
 *    which needs to be replaced. Each value is a text template of
 *    the attribute with the embedded
 *    <tt ng:non-bindable>{{expression}}</tt>s. Any number of
 *    key-value pairs can be specified.
 *
 * @example
 * Enter a search string in the Live Preview text box and then click "Google". The search executes instantly.
   <doc:example>
     <doc:source>
       <script>
         function Ctrl() {
           this.query = 'AngularJS';
         }
       </script>
       <div ng:controller="Ctrl">
        Google for:
        <input type="text" ng:model="query"/>
        <a ng:bind-attr='{"href":"http://www.google.com/search?q={{query}}"}'>
          Google
        </a> (ng:bind-attr) |
        <a href="http://www.google.com/search?q={{query}}">Google</a>
        (curly binding in attribute val)
       </div>
     </doc:source>
     <doc:scenario>
       it('should check ng:bind-attr', function() {
         expect(using('.doc-example-live').element('a').attr('href')).
           toBe('http://www.google.com/search?q=AngularJS');
         using('.doc-example-live').input('query').enter('google');
         expect(using('.doc-example-live').element('a').attr('href')).
           toBe('http://www.google.com/search?q=google');
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:bind-attr", function(expression){
  return function(element){
    var lastValue = {};
    this.$watch(function(scope){
      var values = scope.$eval(expression);
      for(var key in values) {
        var value = compileBindTemplate(values[key])(scope, element);
        if (lastValue[key] !== value) {
          lastValue[key] = value;
          element.attr(key, BOOLEAN_ATTR[lowercase(key)] ? toBoolean(value) : value);
        }
      }
    });
  };
});


/**
 * @ngdoc directive
 * @name angular.directive.ng:click
 *
 * @description
 * The ng:click allows you to specify custom behavior when
 * element is clicked.
 *
 * @element ANY
 * @param {expression} expression {@link guide/dev_guide.expressions Expression} to evaluate upon
 * click.
 *
 * @example
   <doc:example>
     <doc:source>
      <button ng:click="count = count + 1" ng:init="count=0">
        Increment
      </button>
      count: {{count}}
     </doc:source>
     <doc:scenario>
       it('should check ng:click', function() {
         expect(binding('count')).toBe('0');
         element('.doc-example-live :button').click();
         expect(binding('count')).toBe('1');
       });
     </doc:scenario>
   </doc:example>
 */
/*
 * A directive that allows creation of custom onclick handlers that are defined as angular
 * expressions and are compiled and executed within the current scope.
 *
 * Events that are handled via these handler are always configured not to propagate further.
 *
 * TODO: maybe we should consider allowing users to control event propagation in the future.
 */
angularDirective("ng:click", function(expression, element){
  return function(element){
    var self = this;
    element.bind('click', function(event){
      self.$apply(expression);
      event.stopPropagation();
    });
  };
});


/**
 * @ngdoc directive
 * @name angular.directive.ng:submit
 *
 * @description
 * Enables binding angular expressions to onsubmit events.
 *
 * Additionally it prevents the default action (which for form means sending the request to the
 * server and reloading the current page).
 *
 * @element form
 * @param {expression} expression {@link guide/dev_guide.expressions Expression} to eval.
 *
 * @example
   <doc:example>
     <doc:source>
      <script>
        function Ctrl() {
          this.list = [];
          this.text = 'hello';
          this.submit = function() {
            if (this.text) {
              this.list.push(this.text);
              this.text = '';
            }
          };
        }
      </script>
      <form ng:submit="submit()" ng:controller="Ctrl">
        Enter text and hit enter:
        <input type="text" ng:model="text" name="text" />
        <input type="submit" id="submit" value="Submit" />
        <pre>list={{list}}</pre>
      </form>
     </doc:source>
     <doc:scenario>
       it('should check ng:submit', function() {
         expect(binding('list')).toBe('list=[]');
         element('.doc-example-live #submit').click();
         expect(binding('list')).toBe('list=["hello"]');
         expect(input('text').val()).toBe('');
       });
       it('should ignore empty strings', function() {
         expect(binding('list')).toBe('list=[]');
         element('.doc-example-live #submit').click();
         element('.doc-example-live #submit').click();
         expect(binding('list')).toBe('list=["hello"]');
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:submit", function(expression, element) {
  return function(element) {
    var self = this;
    element.bind('submit', function() {
      self.$apply(expression);
    });
  };
});


function ngClass(selector) {
  return function(expression, element) {
    return function(element) {
      this.$watch(expression, function(scope, newVal, oldVal) {
        if (selector(scope.$index)) {
          if (oldVal && (newVal !== oldVal)) {
            element.removeClass(isArray(oldVal) ? oldVal.join(' ') : oldVal);
          }
          if (newVal) element.addClass(isArray(newVal) ? newVal.join(' ') : newVal);
        }
      });
    };
  };
}

/**
 * @ngdoc directive
 * @name angular.directive.ng:class
 *
 * @description
 * The `ng:class` allows you to set CSS class on HTML element dynamically by databinding an
 * expression that represents all classes to be added.
 *
 * The directive won't add duplicate classes if a particular class was already set.
 *
 * When the expression changes, the previously added classes are removed and only then the classes
 * new classes are added.
 *
 * @element ANY
 * @param {expression} expression {@link guide/dev_guide.expressions Expression} to eval. The result
 *   of the evaluation can be a string representing space delimited class names or an array.
 *
 * @example
   <doc:example>
     <doc:source>
      <input type="button" value="set" ng:click="myVar='ng-input-indicator-wait'">
      <input type="button" value="clear" ng:click="myVar=''">
      <br>
      <span ng:class="myVar">Sample Text &nbsp;&nbsp;&nbsp;&nbsp;</span>
     </doc:source>
     <doc:scenario>
       it('should check ng:class', function() {
         expect(element('.doc-example-live span').prop('className')).not().
           toMatch(/ng-input-indicator-wait/);

         using('.doc-example-live').element(':button:first').click();

         expect(element('.doc-example-live span').prop('className')).
           toMatch(/ng-input-indicator-wait/);

         using('.doc-example-live').element(':button:last').click();

         expect(element('.doc-example-live span').prop('className')).not().
           toMatch(/ng-input-indicator-wait/);
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:class", ngClass(function() {return true;}));

/**
 * @ngdoc directive
 * @name angular.directive.ng:class-odd
 *
 * @description
 * The `ng:class-odd` and `ng:class-even` works exactly as
 * {@link angular.directive.ng:class ng:class}, except it works in conjunction with `ng:repeat` and
 * takes affect only on odd (even) rows.
 *
 * This directive can be applied only within a scope of an
 * {@link angular.widget.@ng:repeat ng:repeat}.
 *
 * @element ANY
 * @param {expression} expression {@link guide/dev_guide.expressions Expression} to eval. The result
 *   of the evaluation can be a string representing space delimited class names or an array.
 *
 * @example
   <doc:example>
     <doc:source>
        <ol ng:init="names=['John', 'Mary', 'Cate', 'Suz']">
          <li ng:repeat="name in names">
           <span ng:class-odd="'ng-format-negative'"
                 ng:class-even="'ng-input-indicator-wait'">
             {{name}} &nbsp; &nbsp; &nbsp;
           </span>
          </li>
        </ol>
     </doc:source>
     <doc:scenario>
       it('should check ng:class-odd and ng:class-even', function() {
         expect(element('.doc-example-live li:first span').prop('className')).
           toMatch(/ng-format-negative/);
         expect(element('.doc-example-live li:last span').prop('className')).
           toMatch(/ng-input-indicator-wait/);
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:class-odd", ngClass(function(i){return i % 2 === 0;}));

/**
 * @ngdoc directive
 * @name angular.directive.ng:class-even
 *
 * @description
 * The `ng:class-odd` and `ng:class-even` works exactly as
 * {@link angular.directive.ng:class ng:class}, except it works in conjunction with `ng:repeat` and
 * takes affect only on odd (even) rows.
 *
 * This directive can be applied only within a scope of an
 * {@link angular.widget.@ng:repeat ng:repeat}.
 *
 * @element ANY
 * @param {expression} expression {@link guide/dev_guide.expressions Expression} to eval. The result
 *   of the evaluation can be a string representing space delimited class names or an array.
 *
 * @example
   <doc:example>
     <doc:source>
        <ol ng:init="names=['John', 'Mary', 'Cate', 'Suz']">
          <li ng:repeat="name in names">
           <span ng:class-odd="'odd'" ng:class-even="'even'">
             {{name}} &nbsp; &nbsp; &nbsp;
           </span>
          </li>
        </ol>
     </doc:source>
     <doc:scenario>
       it('should check ng:class-odd and ng:class-even', function() {
         expect(element('.doc-example-live li:first span').prop('className')).
           toMatch(/odd/);
         expect(element('.doc-example-live li:last span').prop('className')).
           toMatch(/even/);
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:class-even", ngClass(function(i){return i % 2 === 1;}));

/**
 * @ngdoc directive
 * @name angular.directive.ng:show
 *
 * @description
 * The `ng:show` and `ng:hide` directives show or hide a portion of the DOM tree (HTML)
 * conditionally.
 *
 * @element ANY
 * @param {expression} expression If the {@link guide/dev_guide.expressions expression} is truthy
 *     then the element is shown or hidden respectively.
 *
 * @example
   <doc:example>
     <doc:source>
        Click me: <input type="checkbox" ng:model="checked"><br/>
        Show: <span ng:show="checked">I show up when your checkbox is checked.</span> <br/>
        Hide: <span ng:hide="checked">I hide when your checkbox is checked.</span>
     </doc:source>
     <doc:scenario>
       it('should check ng:show / ng:hide', function() {
         expect(element('.doc-example-live span:first:hidden').count()).toEqual(1);
         expect(element('.doc-example-live span:last:visible').count()).toEqual(1);

         input('checked').check();

         expect(element('.doc-example-live span:first:visible').count()).toEqual(1);
         expect(element('.doc-example-live span:last:hidden').count()).toEqual(1);
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:show", function(expression, element){
  return function(element){
    this.$watch(expression, function(scope, value){
      element.css('display', toBoolean(value) ? '' : 'none');
    });
  };
});

/**
 * @ngdoc directive
 * @name angular.directive.ng:hide
 *
 * @description
 * The `ng:hide` and `ng:show` directives hide or show a portion
 * of the HTML conditionally.
 *
 * @element ANY
 * @param {expression} expression If the {@link guide/dev_guide.expressions expression} truthy then
 *     the element is shown or hidden respectively.
 *
 * @example
   <doc:example>
     <doc:source>
        Click me: <input type="checkbox" ng:model="checked"><br/>
        Show: <span ng:show="checked">I show up when you checkbox is checked?</span> <br/>
        Hide: <span ng:hide="checked">I hide when you checkbox is checked?</span>
     </doc:source>
     <doc:scenario>
       it('should check ng:show / ng:hide', function() {
         expect(element('.doc-example-live span:first:hidden').count()).toEqual(1);
         expect(element('.doc-example-live span:last:visible').count()).toEqual(1);

         input('checked').check();

         expect(element('.doc-example-live span:first:visible').count()).toEqual(1);
         expect(element('.doc-example-live span:last:hidden').count()).toEqual(1);
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:hide", function(expression, element){
  return function(element){
    this.$watch(expression, function(scope, value){
      element.css('display', toBoolean(value) ? 'none' : '');
    });
  };
});

/**
 * @ngdoc directive
 * @name angular.directive.ng:style
 *
 * @description
 * The ng:style allows you to set CSS style on an HTML element conditionally.
 *
 * @element ANY
 * @param {expression} expression {@link guide/dev_guide.expressions Expression} which evals to an
 *      object whose keys are CSS style names and values are corresponding values for those CSS
 *      keys.
 *
 * @example
   <doc:example>
     <doc:source>
        <input type="button" value="set" ng:click="myStyle={color:'red'}">
        <input type="button" value="clear" ng:click="myStyle={}">
        <br/>
        <span ng:style="myStyle">Sample Text</span>
        <pre>myStyle={{myStyle}}</pre>
     </doc:source>
     <doc:scenario>
       it('should check ng:style', function() {
         expect(element('.doc-example-live span').css('color')).toBe('rgb(0, 0, 0)');
         element('.doc-example-live :button[value=set]').click();
         expect(element('.doc-example-live span').css('color')).toBe('rgb(255, 0, 0)');
         element('.doc-example-live :button[value=clear]').click();
         expect(element('.doc-example-live span').css('color')).toBe('rgb(0, 0, 0)');
       });
     </doc:scenario>
   </doc:example>
 */
angularDirective("ng:style", function(expression, element) {
  return function(element) {
    this.$watch(expression, function(scope, newStyles, oldStyles) {
      if (oldStyles && (newStyles !== oldStyles)) {
        forEach(oldStyles, function(val, style) { element.css(style, '');});
      }
      if (newStyles) element.css(newStyles);
    });
  };
});


/**
 * @ngdoc directive
 * @name angular.directive.ng:cloak
 *
 * @description
 * The `ng:cloak` directive is used to prevent the Angular html template from being briefly
 * displayed by the browser in its raw (uncompiled) form while your application is loading. Use this
 * directive to avoid the undesirable flicker effect caused by the html template display.
 *
 * The directive can be applied to the `<body>` element, but typically a fine-grained application is
 * prefered in order to benefit from progressive rendering of the browser view.
 *
 * `ng:cloak` works in cooperation with a css rule that is embedded within `angular.js` and
 *  `angular.min.js` files. Following is the css rule:
 *
 * <pre>
 * [ng\:cloak], .ng-cloak {
 *   display: none;
 * }
 * </pre>
 *
 * When this css rule is loaded by the browser, all html elements (including their children) that
 * are tagged with the `ng:cloak` directive are hidden. When Angular comes across this directive
 * during the compilation of the template it deletes the `ng:cloak` element attribute, which
 * makes the compiled element visible.
 *
 * For the best result, `angular.js` script must be loaded in the head section of the html file;
 * alternatively, the css rule (above) must be included in the external stylesheet of the
 * application.
 *
 * Legacy browsers, like IE7, do not provide attribute selector support (added in CSS 2.1) so they
 * cannot match the `[ng\:cloak]` selector. To work around this limitation, you must add the css
 * class `ng-cloak` in addition to `ng:cloak` directive as shown in the example below.
 *
 * @element ANY
 *
 * @example
   <doc:example>
     <doc:source>
        <div id="template1" ng:cloak>{{ 'hello' }}</div>
        <div id="template2" ng:cloak class="ng-cloak">{{ 'hello IE7' }}</div>
     </doc:source>
     <doc:scenario>
       it('should remove the template directive and css class', function() {
         expect(element('.doc-example-live #template1').attr('ng:cloak')).
           not().toBeDefined();
         expect(element('.doc-example-live #template2').attr('ng:cloak')).
           not().toBeDefined();
       });
     </doc:scenario>
   </doc:example>
 *
 */
angularDirective("ng:cloak", function(expression, element) {
  element.removeAttr('ng:cloak');
  element.removeClass('ng-cloak');
});

/**
 * @ngdoc overview
 * @name angular.markup
 * @description
 *
 * Angular markup transforms the content of DOM elements or portions of the content into other
 * text or DOM elements for further compilation.
 *
 * Markup extensions do not themselves produce linking functions. Think of markup as a way to
 * produce shorthand for a {@link angular.widget widget} or a {@link angular.directive directive}.
 *
 * The most prominent example of a markup in Angular is the built-in, double curly markup
 * `{{expression}}`, which is shorthand for `<span ng:bind="expression"></span>`.
 *
 * Create custom markup like this:
 *
 * <pre>
 *   angular.markup('newMarkup', function(text, textNode, parentElement){
 *     //tranformation code
 *   });
 * </pre>
 *
 * For more information, see {@link guide/dev_guide.compiler.markup Understanding Angular Markup}
 * in the Angular Developer Guide.
 */

/**
 * @ngdoc overview
 * @name angular.attrMarkup
 * @description
 *
 * Attribute markup allows you to modify the state of an attribute's text.
 *
 * Attribute markup extends the Angular complier in a way similar to {@link angular.markup},
 * which allows you to modify the content of a node.
 *
 * The most prominent example of an attribute markup in Angular is the built-in double curly markup
 * which is a shorthand for {@link angular.directive.ng:bind-attr ng:bind-attr}.
 *
 * ## Example
 *
 * <pre>
 *   angular.attrMarkup('newAttrMarkup', function(attrValue, attrName, element){
 *     //tranformation code
 *   });
 * </pre>
 *
 * For more information about Angular attribute markup, see {@link guide/dev_guide.compiler.markup
 * Understanding Angular Markup} in the Angular Developer Guide.
 */


angularTextMarkup('{{}}', function(text, textNode, parentElement) {
  var bindings = parseBindings(text),
      self = this;
  if (hasBindings(bindings)) {
    if (isLeafNode(parentElement[0])) {
      parentElement.attr('ng:bind-template', text);
    } else {
      var cursor = textNode, newElement;
      forEach(parseBindings(text), function(text){
        var exp = binding(text);
        if (exp) {
          newElement = jqLite('<span>');
          newElement.attr('ng:bind', exp);
        } else {
          newElement = jqLite(document.createTextNode(text));
        }
        if (msie && text.charAt(0) == ' ') {
          newElement = jqLite('<span>&nbsp;</span>');
          var nbsp = newElement.html();
          newElement.text(text.substr(1));
          newElement.html(nbsp + newElement.html());
        }
        cursor.after(newElement);
        cursor = newElement;
      });
      textNode.remove();
    }
  }
});

/**
 * This tries to normalize the behavior of value attribute across browsers. If value attribute is
 * not specified, then specify it to be that of the text.
 */
angularTextMarkup('option', function(text, textNode, parentElement){
  if (lowercase(nodeName_(parentElement)) == 'option') {
    if (msie <= 7) {
      // In IE7 The issue is that there is no way to see if the value was specified hence
      // we have to resort to parsing HTML;
      htmlParser(parentElement[0].outerHTML, {
        start: function(tag, attrs) {
          if (isUndefined(attrs.value)) {
            parentElement.attr('value', text);
          }
        }
      });
    } else if (parentElement[0].getAttribute('value') == null) {
      // jQuery does normalization on 'value' so we have to bypass it.
      parentElement.attr('value', text);
    }
  }
});

/**
 * @ngdoc directive
 * @name angular.directive.ng:href
 *
 * @description
 * Using <angular/> markup like {{hash}} in an href attribute makes
 * the page open to a wrong URL, if the user clicks that link before
 * angular has a chance to replace the {{hash}} with actual URL, the
 * link will be broken and will most likely return a 404 error.
 * The `ng:href` solves this problem by placing the `href` in the
 * `ng:` namespace.
 *
 * The buggy way to write it:
 * <pre>
 * <a href="http://www.gravatar.com/avatar/{{hash}}"/>
 * </pre>
 *
 * The correct way to write it:
 * <pre>
 * <a ng:href="http://www.gravatar.com/avatar/{{hash}}"/>
 * </pre>
 *
 * @element ANY
 * @param {template} template any string which can contain `{{}}` markup.
 *
 * @example
 * This example uses `link` variable inside `href` attribute:
    <doc:example>
      <doc:source>
        <input ng:model="value" /><br />
        <a id="link-1" href ng:click="value = 1">link 1</a> (link, don't reload)<br />
        <a id="link-2" href="" ng:click="value = 2">link 2</a> (link, don't reload)<br />
        <a id="link-3" ng:href="/{{'123'}}" ng:ext-link>link 3</a> (link, reload!)<br />
        <a id="link-4" href="" name="xx" ng:click="value = 4">anchor</a> (link, don't reload)<br />
        <a id="link-5" name="xxx" ng:click="value = 5">anchor</a> (no link)<br />
        <a id="link-6" ng:href="/{{value}}" ng:ext-link>link</a> (link, change hash)
      </doc:source>
      <doc:scenario>
        it('should execute ng:click but not reload when href without value', function() {
          element('#link-1').click();
          expect(input('value').val()).toEqual('1');
          expect(element('#link-1').attr('href')).toBe("");
        });

        it('should execute ng:click but not reload when href empty string', function() {
          element('#link-2').click();
          expect(input('value').val()).toEqual('2');
          expect(element('#link-2').attr('href')).toBe("");
        });

        it('should execute ng:click and change url when ng:href specified', function() {
          expect(element('#link-3').attr('href')).toBe("/123");

          element('#link-3').click();
          expect(browser().window().path()).toEqual('/123');
        });

        it('should execute ng:click but not reload when href empty string and name specified', function() {
          element('#link-4').click();
          expect(input('value').val()).toEqual('4');
          expect(element('#link-4').attr('href')).toBe("");
        });

        it('should execute ng:click but not reload when no href but name specified', function() {
          element('#link-5').click();
          expect(input('value').val()).toEqual('5');
          expect(element('#link-5').attr('href')).toBe(undefined);
        });

        it('should only change url when only ng:href', function() {
          input('value').enter('6');
          expect(element('#link-6').attr('href')).toBe("/6");

          element('#link-6').click();
          expect(browser().window().path()).toEqual('/6');
        });
      </doc:scenario>
    </doc:example>
 */

/**
 * @ngdoc directive
 * @name angular.directive.ng:src
 *
 * @description
 * Using <angular/> markup like `{{hash}}` in a `src` attribute doesn't
 * work right: The browser will fetch from the URL with the literal
 * text `{{hash}}` until <angular/> replaces the expression inside
 * `{{hash}}`. The `ng:src` attribute solves this problem by placing
 *  the `src` attribute in the `ng:` namespace.
 *
 * The buggy way to write it:
 * <pre>
 * <img src="http://www.gravatar.com/avatar/{{hash}}"/>
 * </pre>
 *
 * The correct way to write it:
 * <pre>
 * <img ng:src="http://www.gravatar.com/avatar/{{hash}}"/>
 * </pre>
 *
 * @element ANY
 * @param {template} template any string which can contain `{{}}` markup.
 */

/**
 * @ngdoc directive
 * @name angular.directive.ng:disabled
 *
 * @description
 *
 * The following markup will make the button enabled on Chrome/Firefox but not on IE8 and older IEs:
 * <pre>
 * <div ng:init="scope = { isDisabled: false }">
 *  <button disabled="{{scope.isDisabled}}">Disabled</button>
 * </div>
 * </pre>
 *
 * The HTML specs do not require browsers to preserve the special attributes such as disabled.
 * (The presence of them means true and absence means false)
 * This prevents the angular compiler from correctly retrieving the binding expression.
 * To solve this problem, we introduce ng:disabled.
 *
 * @example
    <doc:example>
      <doc:source>
        Click me to toggle: <input type="checkbox" ng:model="checked"><br/>
        <button ng:model="button" ng:disabled="{{checked}}">Button</button>
      </doc:source>
      <doc:scenario>
        it('should toggle button', function() {
          expect(element('.doc-example-live :button').prop('disabled')).toBeFalsy();
          input('checked').check();
          expect(element('.doc-example-live :button').prop('disabled')).toBeTruthy();
        });
      </doc:scenario>
    </doc:example>
 *
 * @element ANY
 * @param {template} template any string which can contain '{{}}' markup.
 */


/**
 * @ngdoc directive
 * @name angular.directive.ng:checked
 *
 * @description
 * The HTML specs do not require browsers to preserve the special attributes such as checked.
 * (The presence of them means true and absence means false)
 * This prevents the angular compiler from correctly retrieving the binding expression.
 * To solve this problem, we introduce ng:checked.
 * @example
    <doc:example>
      <doc:source>
        Check me to check both: <input type="checkbox" ng:model="master"><br/>
        <input id="checkSlave" type="checkbox" ng:checked="{{master}}">
      </doc:source>
      <doc:scenario>
        it('should check both checkBoxes', function() {
          expect(element('.doc-example-live #checkSlave').prop('checked')).toBeFalsy();
          input('master').check();
          expect(element('.doc-example-live #checkSlave').prop('checked')).toBeTruthy();
        });
      </doc:scenario>
    </doc:example>
 *
 * @element ANY
 * @param {template} template any string which can contain '{{}}' markup.
 */


/**
 * @ngdoc directive
 * @name angular.directive.ng:multiple
 *
 * @description
 * The HTML specs do not require browsers to preserve the special attributes such as multiple.
 * (The presence of them means true and absence means false)
 * This prevents the angular compiler from correctly retrieving the binding expression.
 * To solve this problem, we introduce ng:multiple.
 *
 * @example
     <doc:example>
       <doc:source>
         Check me check multiple: <input type="checkbox" ng:model="checked"><br/>
         <select id="select" ng:multiple="{{checked}}">
           <option>Misko</option>
           <option>Igor</option>
           <option>Vojta</option>
           <option>Di</option>
         </select>
       </doc:source>
       <doc:scenario>
         it('should toggle multiple', function() {
           expect(element('.doc-example-live #select').prop('multiple')).toBeFalsy();
           input('checked').check();
           expect(element('.doc-example-live #select').prop('multiple')).toBeTruthy();
         });
       </doc:scenario>
     </doc:example>
 *
 * @element ANY
 * @param {template} template any string which can contain '{{}}' markup.
 */


/**
 * @ngdoc directive
 * @name angular.directive.ng:readonly
 *
 * @description
 * The HTML specs do not require browsers to preserve the special attributes such as readonly.
 * (The presence of them means true and absence means false)
 * This prevents the angular compiler from correctly retrieving the binding expression.
 * To solve this problem, we introduce ng:readonly.
 * @example
    <doc:example>
      <doc:source>
        Check me to make text readonly: <input type="checkbox" ng:model="checked"><br/>
        <input type="text" ng:readonly="{{checked}}" value="I'm Angular"/>
      </doc:source>
      <doc:scenario>
        it('should toggle readonly attr', function() {
          expect(element('.doc-example-live :text').prop('readonly')).toBeFalsy();
          input('checked').check();
          expect(element('.doc-example-live :text').prop('readonly')).toBeTruthy();
        });
      </doc:scenario>
    </doc:example>
 *
 * @element ANY
 * @param {template} template any string which can contain '{{}}' markup.
 */


/**
* @ngdoc directive
* @name angular.directive.ng:selected
*
* @description
* The HTML specs do not require browsers to preserve the special attributes such as selected.
* (The presence of them means true and absence means false)
* This prevents the angular compiler from correctly retrieving the binding expression.
* To solve this problem, we introduce ng:selected.
* @example
   <doc:example>
     <doc:source>
       Check me to select: <input type="checkbox" ng:model="checked"><br/>
       <select>
         <option>Hello!</option>
         <option id="greet" ng:selected="{{checked}}">Greetings!</option>
       </select>
     </doc:source>
     <doc:scenario>
       it('should select Greetings!', function() {
         expect(element('.doc-example-live #greet').prop('selected')).toBeFalsy();
         input('checked').check();
         expect(element('.doc-example-live #greet').prop('selected')).toBeTruthy();
       });
     </doc:scenario>
   </doc:example>
* @element ANY
* @param {template} template any string which can contain '{{}}' markup.
*/


var NG_BIND_ATTR = 'ng:bind-attr';
var SIDE_EFFECT_ATTRS = {};

forEach('src,href,multiple,selected,checked,disabled,readonly,required'.split(','), function(name) {
  SIDE_EFFECT_ATTRS['ng:' + name] = name;
});

angularAttrMarkup('{{}}', function(value, name, element){
  // don't process existing attribute markup
  if (angularDirective(name) || angularDirective("@" + name)) return;
  if (msie && name == 'src')
    value = decodeURI(value);
  var bindings = parseBindings(value),
      bindAttr;
  if (hasBindings(bindings) || SIDE_EFFECT_ATTRS[name]) {
    element.removeAttr(name);
    bindAttr = fromJson(element.attr(NG_BIND_ATTR) || "{}");
    bindAttr[SIDE_EFFECT_ATTRS[name] || name] = value;
    element.attr(NG_BIND_ATTR, toJson(bindAttr));
  }
});

/**
 * @ngdoc overview
 * @name angular.widget
 * @description
 *
 * An angular widget can be either a custom attribute that modifies an existing DOM element or an
 * entirely new DOM element.
 *
 * During html compilation, widgets are processed after {@link angular.markup markup}, but before
 * {@link angular.directive directives}.
 *
 * Following is the list of built-in angular widgets:
 *
 * * {@link angular.widget.@ng:non-bindable ng:non-bindable} - Blocks angular from processing an
 *   HTML element.
 * * {@link angular.widget.@ng:repeat ng:repeat} - Creates and manages a collection of cloned HTML
 *   elements.
 * * {@link angular.inputType HTML input elements} - Standard HTML input elements data-bound by
 *   angular.
 * * {@link angular.widget.ng:view ng:view} - Works with $route to "include" partial templates
 * * {@link angular.widget.ng:switch ng:switch} - Conditionally changes DOM structure
 * * {@link angular.widget.ng:include ng:include} - Includes an external HTML fragment
 *
 * For more information about angular widgets, see {@link guide/dev_guide.compiler.widgets
 * Understanding Angular Widgets} in the angular Developer Guide.
 */

/**
 * @ngdoc widget
 * @name angular.widget.ng:include
 *
 * @description
 * Fetches, compiles and includes an external HTML fragment.
 *
 * Keep in mind that Same Origin Policy applies to included resources
 * (e.g. ng:include won't work for file:// access).
 *
 * @param {string} src angular expression evaluating to URL. If the source is a string constant,
 *                 make sure you wrap it in quotes, e.g. `src="'myPartialTemplate.html'"`.
 * @param {Scope=} [scope=new_child_scope] optional expression which evaluates to an
 *                 instance of angular.module.ng.$rootScope.Scope to set the HTML fragment to.
 * @param {string=} onload Expression to evaluate when a new partial is loaded.
 *
 * @param {string=} autoscroll Whether `ng:include` should call {@link angular.module.ng.$anchorScroll
 *                  $anchorScroll} to scroll the viewport after the content is loaded.
 *
 *                  - If the attribute is not set, disable scrolling.
 *                  - If the attribute is set without value, enable scrolling.
 *                  - Otherwise enable scrolling only if the expression evaluates to truthy value.
 *
 * @example
    <doc:example>
      <doc:source jsfiddle="false">
       <script>
         function Ctrl() {
           this.templates =
             [ { name: 'template1.html', url: 'examples/ng-include/template1.html'}
             , { name: 'template2.html', url: 'examples/ng-include/template2.html'} ];
           this.template = this.templates[0];
         }
       </script>
       <div ng:controller="Ctrl">
         <select ng:model="template" ng:options="t.name for t in templates">
          <option value="">(blank)</option>
         </select>
         url of the template: <tt><a href="{{template.url}}">{{template.url}}</a></tt>
         <hr/>
         <ng:include src="template.url"></ng:include>
       </div>
      </doc:source>
      <doc:scenario>
        it('should load template1.html', function() {
         expect(element('.doc-example-live .ng-include').text()).
           toBe('Content of template1.html\n');
        });
        it('should load template2.html', function() {
         select('template').option('1');
         expect(element('.doc-example-live .ng-include').text()).
           toBe('Content of template2.html\n');
        });
        it('should change to blank', function() {
         select('template').option('');
         expect(element('.doc-example-live .ng-include').text()).toEqual('');
        });
      </doc:scenario>
    </doc:example>
 */
angularWidget('ng:include', function(element){
  var compiler = this,
      srcExp = element.attr("src"),
      scopeExp = element.attr("scope") || '',
      onloadExp = element[0].getAttribute('onload') || '', //workaround for jquery bug #7537
      autoScrollExp = element.attr('autoscroll');

  if (element[0]['ng:compiled']) {
    this.descend(true);
    this.directives(true);
  } else {
    element[0]['ng:compiled'] = true;
    return ['$http', '$templateCache', '$anchorScroll', '$element',
    function($http,   $templateCache,   $anchorScroll,   element) {
      var scope = this,
          changeCounter = 0,
          childScope;

      function incrementChange() { changeCounter++;}
      this.$watch(srcExp, incrementChange);
      this.$watch(function() {
        var includeScope = scope.$eval(scopeExp);
        if (includeScope) return includeScope.$id;
      }, incrementChange);
      this.$watch(function() {return changeCounter;}, function(scope, newChangeCounter) {
        var src = scope.$eval(srcExp),
            useScope = scope.$eval(scopeExp);

        function clearContent() {
          // if this callback is still desired
          if (newChangeCounter === changeCounter) {
            if (childScope) childScope.$destroy();
            childScope = null;
            element.html('');
          }
        }

        if (src) {
          $http.get(src, {cache: $templateCache}).success(function(response) {
            // if this callback is still desired
            if (newChangeCounter === changeCounter) {
              element.html(response);
              if (childScope) childScope.$destroy();
              childScope = useScope ? useScope : scope.$new();
              compiler.compile(element)(childScope);
              if (isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                $anchorScroll();
              }
              scope.$eval(onloadExp);
            }
          }).error(clearContent);
        } else {
          clearContent();
        }
      });
    }];
  }
});

/**
 * @ngdoc widget
 * @name angular.widget.ng:switch
 *
 * @description
 * Conditionally change the DOM structure.
 *
 * @usageContent
 * <any ng:switch-when="matchValue1">...</any>
 *   <any ng:switch-when="matchValue2">...</any>
 *   ...
 *   <any ng:switch-default>...</any>
 *
 * @param {*} on expression to match against <tt>ng:switch-when</tt>.
 * @paramDescription
 * On child elments add:
 *
 * * `ng:switch-when`: the case statement to match against. If match then this
 *   case will be displayed.
 * * `ng:switch-default`: the default case when no other casses match.
 *
 * @example
    <doc:example>
      <doc:source>
        <script>
          function Ctrl() {
            this.items = ['settings', 'home', 'other'];
            this.selection = this.items[0];
          }
        </script>
        <div ng:controller="Ctrl">
          <select ng:model="selection" ng:options="item for item in items">
          </select>
          <tt>selection={{selection}}</tt>
          <hr/>
          <ng:switch on="selection" >
            <div ng:switch-when="settings">Settings Div</div>
            <span ng:switch-when="home">Home Span</span>
            <span ng:switch-default>default</span>
          </ng:switch>
        </div>
      </doc:source>
      <doc:scenario>
        it('should start in settings', function() {
         expect(element('.doc-example-live ng\\:switch').text()).toEqual('Settings Div');
        });
        it('should change to home', function() {
         select('selection').option('home');
         expect(element('.doc-example-live ng\\:switch').text()).toEqual('Home Span');
        });
        it('should select deafault', function() {
         select('selection').option('other');
         expect(element('.doc-example-live ng\\:switch').text()).toEqual('default');
        });
      </doc:scenario>
    </doc:example>
 */
angularWidget('ng:switch', function(element) {
  var compiler = this,
      watchExpr = element.attr("on"),
      changeExpr = element.attr('change'),
      casesTemplate = {},
      defaultCaseTemplate,
      children = element.children(),
      length = children.length,
      child,
      when;

  if (!watchExpr) throw new Error("Missing 'on' attribute.");
  while(length--) {
    child = jqLite(children[length]);
    // this needs to be here for IE
    child.remove();
    when = child.attr('ng:switch-when');
    if (isString(when)) {
      casesTemplate[when] = compiler.compile(child);
    } else if (isString(child.attr('ng:switch-default'))) {
      defaultCaseTemplate = compiler.compile(child);
    }
  }
  children = null; // release memory;
  element.html('');

  return function(element){
    var changeCounter = 0;
    var childScope;
    var selectedTemplate;

    this.$watch(watchExpr, function(scope, value) {
      element.html('');
      if ((selectedTemplate = casesTemplate[value] || defaultCaseTemplate)) {
        changeCounter++;
        if (childScope) childScope.$destroy();
        childScope = scope.$new();
        childScope.$eval(changeExpr);
      }
    });

    this.$watch(function() {return changeCounter;}, function() {
      element.html('');
      if (selectedTemplate) {
        selectedTemplate(childScope, function(caseElement) {
          element.append(caseElement);
        });
      }
    });
  };
});


/*
 * Modifies the default behavior of html A tag, so that the default action is prevented when href
 * attribute is empty.
 *
 * The reasoning for this change is to allow easy creation of action links with ng:click without
 * changing the location or causing page reloads, e.g.:
 * <a href="" ng:click="model.$save()">Save</a>
 */
angularWidget('a', function() {
  this.descend(true);
  this.directives(true);

  return function(element) {
    var hasNgHref = ((element.attr('ng:bind-attr') || '').indexOf('"href":') !== -1);

    // turn <a href ng:click="..">link</a> into a link in IE
    // but only if it doesn't have name attribute, in which case it's an anchor
    if (!hasNgHref && !element.attr('name') && !element.attr('href')) {
      element.attr('href', '');
    }

    if (element.attr('href') === '' && !hasNgHref) {
      element.bind('click', function(event){
        event.preventDefault();
      });
    }
  };
});


/**
 * @ngdoc widget
 * @name angular.widget.@ng:repeat
 *
 * @description
 * The `ng:repeat` widget instantiates a template once per item from a collection. Each template
 * instance gets its own scope, where the given loop variable is set to the current collection item,
 * and `$index` is set to the item index or key.
 *
 * Special properties are exposed on the local scope of each template instance, including:
 *
 *   * `$index` ??? `{number}` ??? iterator offset of the repeated element (0..length-1)
 *   * `$position` ??? `{string}` ??? position of the repeated element in the iterator. One of:
 *        * `'first'`,
 *        * `'middle'`
 *        * `'last'`
 *
 * Note: Although `ng:repeat` looks like a directive, it is actually an attribute widget.
 *
 * @element ANY
 * @param {string} repeat_expression The expression indicating how to enumerate a collection. Two
 *   formats are currently supported:
 *
 *   * `variable in expression` ??? where variable is the user defined loop variable and `expression`
 *     is a scope expression giving the collection to enumerate.
 *
 *     For example: `track in cd.tracks`.
 *
 *   * `(key, value) in expression` ??? where `key` and `value` can be any user defined identifiers,
 *     and `expression` is the scope expression giving the collection to enumerate.
 *
 *     For example: `(name, age) in {'adam':10, 'amalie':12}`.
 *
 * @example
 * This example initializes the scope to a list of names and
 * then uses `ng:repeat` to display every person:
    <doc:example>
      <doc:source>
        <div ng:init="friends = [{name:'John', age:25}, {name:'Mary', age:28}]">
          I have {{friends.length}} friends. They are:
          <ul>
            <li ng:repeat="friend in friends">
              [{{$index + 1}}] {{friend.name}} who is {{friend.age}} years old.
            </li>
          </ul>
        </div>
      </doc:source>
      <doc:scenario>
         it('should check ng:repeat', function() {
           var r = using('.doc-example-live').repeater('ul li');
           expect(r.count()).toBe(2);
           expect(r.row(0)).toEqual(["1","John","25"]);
           expect(r.row(1)).toEqual(["2","Mary","28"]);
         });
      </doc:scenario>
    </doc:example>
 */
angularWidget('@ng:repeat', function(expression, element){
  element.removeAttr('ng:repeat');
  element.replaceWith(jqLite('<!-- ng:repeat: ' + expression + ' -->'));
  var linker = this.compile(element);
  return function(iterStartElement){
    var match = expression.match(/^\s*(.+)\s+in\s+(.*)\s*$/),
        lhs, rhs, valueIdent, keyIdent;
    if (! match) {
      throw Error("Expected ng:repeat in form of '_item_ in _collection_' but got '" +
      expression + "'.");
    }
    lhs = match[1];
    rhs = match[2];
    match = lhs.match(/^([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\)$/);
    if (!match) {
      throw Error("'item' in 'item in collection' should be identifier or (key, value) but got '" +
      keyValue + "'.");
    }
    valueIdent = match[3] || match[1];
    keyIdent = match[2];

    var parentScope = this;
    // Store a list of elements from previous run. This is a hash where key is the item from the
    // iterator, and the value is an array of objects with following properties.
    //   - scope: bound scope
    //   - element: previous element.
    //   - index: position
    // We need an array of these objects since the same object can be returned from the iterator.
    // We expect this to be a rare case.
    var lastOrder = new HashQueueMap();
    this.$watch(function(scope){
      var index, length,
          collection = scope.$eval(rhs),
          collectionLength = size(collection, true),
          childScope,
          // Same as lastOrder but it has the current state. It will become the
          // lastOrder on the next iteration.
          nextOrder = new HashQueueMap(),
          key, value, // key/value of iteration
          array, last,       // last object information {scope, element, index}
          cursor = iterStartElement;     // current position of the node

      if (!isArray(collection)) {
        // if object, extract keys, sort them and use to determine order of iteration over obj props
        array = [];
        for(key in collection) {
          if (collection.hasOwnProperty(key) && key.charAt(0) != '$') {
            array.push(key);
          }
        }
        array.sort();
      } else {
        array = collection || [];
      }

      // we are not using forEach for perf reasons (trying to avoid #call)
      for (index = 0, length = array.length; index < length; index++) {
        key = (collection === array) ? index : array[index];
        value = collection[key];
        last = lastOrder.shift(value);
        if (last) {
          // if we have already seen this object, then we need to reuse the
          // associated scope/element
          childScope = last.scope;
          nextOrder.push(value, last);

          if (index === last.index) {
            // do nothing
            cursor = last.element;
          } else {
            // existing item which got moved
            last.index = index;
            // This may be a noop, if the element is next, but I don't know of a good way to
            // figure this out,  since it would require extra DOM access, so let's just hope that
            // the browsers realizes that it is noop, and treats it as such.
            cursor.after(last.element);
            cursor = last.element;
          }
        } else {
          // new item which we don't know about
          childScope = parentScope.$new();
        }

        childScope[valueIdent] = value;
        if (keyIdent) childScope[keyIdent] = key;
        childScope.$index = index;
        childScope.$position = index === 0 ?
            'first' :
            (index == collectionLength - 1 ? 'last' : 'middle');

        if (!last) {
          linker(childScope, function(clone){
            cursor.after(clone);
            last = {
                scope: childScope,
                element: (cursor = clone),
                index: index
              };
            nextOrder.push(value, last);
          });
        }
      }

      //shrink children
      for (key in lastOrder) {
        if (lastOrder.hasOwnProperty(key)) {
          array = lastOrder[key];
          while(array.length) {
            value = array.pop();
            value.element.remove();
            value.scope.$destroy();
          }
        }
      }

      lastOrder = nextOrder;
    });
  };
});


/**
 * @ngdoc widget
 * @name angular.widget.@ng:non-bindable
 *
 * @description
 * Sometimes it is necessary to write code which looks like bindings but which should be left alone
 * by angular. Use `ng:non-bindable` to make angular ignore a chunk of HTML.
 *
 * Note: `ng:non-bindable` looks like a directive, but is actually an attribute widget.
 *
 * @element ANY
 *
 * @example
 * In this example there are two location where a simple binding (`{{}}`) is present, but the one
 * wrapped in `ng:non-bindable` is left alone.
 *
 * @example
    <doc:example>
      <doc:source>
        <div>Normal: {{1 + 2}}</div>
        <div ng:non-bindable>Ignored: {{1 + 2}}</div>
      </doc:source>
      <doc:scenario>
       it('should check ng:non-bindable', function() {
         expect(using('.doc-example-live').binding('1 + 2')).toBe('3');
         expect(using('.doc-example-live').element('div:last').text()).
           toMatch(/1 \+ 2/);
       });
      </doc:scenario>
    </doc:example>
 */
angularWidget("@ng:non-bindable", noop);


/**
 * @ngdoc widget
 * @name angular.widget.ng:view
 *
 * @description
 * # Overview
 * `ng:view` is a widget that complements the {@link angular.module.ng.$route $route} service by
 * including the rendered template of the current route into the main layout (`index.html`) file.
 * Every time the current route changes, the included view changes with it according to the
 * configuration of the `$route` service.
 *
 * This widget provides functionality similar to {@link angular.widget.ng:include ng:include} when
 * used like this:
 *
 *     <ng:include src="$route.current.template" scope="$route.current.scope"></ng:include>
 *
 *
 * # Advantages
 * Compared to `ng:include`, `ng:view` offers these advantages:
 *
 * - shorter syntax
 * - more efficient execution
 * - doesn't require `$route` service to be available on the root scope
 *
 *
 * @example
    <doc:example>
      <doc:source jsfiddle="false">
         <script>
           function MyCtrl($route) {
             $route.when('/overview',
               { controller: OverviewCtrl,
                 template: 'partials/guide/dev_guide.overview.html'});
             $route.when('/bootstrap',
               { controller: BootstrapCtrl,
                 template: 'partials/guide/dev_guide.bootstrap.auto_bootstrap.html'});
           };
           MyCtrl.$inject = ['$route'];

           function BootstrapCtrl() {}
           function OverviewCtrl() {}
         </script>
         <div ng:controller="MyCtrl">
           <a href="overview">overview</a> |
           <a href="bootstrap">bootstrap</a> |
           <a href="undefined">undefined</a>

           <br/>

           The view is included below:
           <hr/>
           <ng:view></ng:view>
         </div>
      </doc:source>
      <doc:scenario>
        it('should load templates', function() {
          element('.doc-example-live a:contains(overview)').click();
          expect(element('.doc-example-live ng\\:view').text()).toMatch(/Developer Guide: Overview/);

          element('.doc-example-live a:contains(bootstrap)').click();
          expect(element('.doc-example-live ng\\:view').text()).toMatch(/Developer Guide: Initializing Angular: Automatic Initialization/);
        });
      </doc:scenario>
    </doc:example>
 */
angularWidget('ng:view', function(element) {
  var compiler = this;

  if (!element[0]['ng:compiled']) {
    element[0]['ng:compiled'] = true;
    return ['$http', '$templateCache', '$route', '$anchorScroll', '$element',
    function($http,   $templateCache,   $route,   $anchorScroll,   element) {
      var template;
      var changeCounter = 0;

      this.$on('$afterRouteChange', function() {
        changeCounter++;
      });

      this.$watch(function() {return changeCounter;}, function(scope, newChangeCounter) {
        var template = $route.current && $route.current.template;

        function clearContent() {
          // ignore callback if another route change occured since
          if (newChangeCounter == changeCounter) {
            element.html('');
          }
        }

        if (template) {
          $http.get(template, {cache: $templateCache}).success(function(response) {
            // ignore callback if another route change occured since
            if (newChangeCounter == changeCounter) {
              element.html(response);
              compiler.compile(element)($route.current.scope);
              $anchorScroll();
            }
          }).error(clearContent);
        } else {
          clearContent();
        }
      });
    }];
  } else {
    compiler.descend(true);
    compiler.directives(true);
  }
});


/**
 * @ngdoc widget
 * @name angular.widget.ng:pluralize
 *
 * @description
 * # Overview
 * ng:pluralize is a widget that displays messages according to en-US localization rules.
 * These rules are bundled with angular.js and the rules can be overridden
 * (see {@link guide/dev_guide.i18n Angular i18n} dev guide). You configure ng:pluralize by
 * specifying the mappings between
 * {@link http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html
 * plural categories} and the strings to be displayed.
 *
 * # Plural categories and explicit number rules
 * There are two
 * {@link http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html
 * plural categories} in Angular's default en-US locale: "one" and "other".
 *
 * While a pural category may match many numbers (for example, in en-US locale, "other" can match
 * any number that is not 1), an explicit number rule can only match one number. For example, the
 * explicit number rule for "3" matches the number 3. You will see the use of plural categories
 * and explicit number rules throughout later parts of this documentation.
 *
 * # Configuring ng:pluralize
 * You configure ng:pluralize by providing 2 attributes: `count` and `when`.
 * You can also provide an optional attribute, `offset`.
 *
 * The value of the `count` attribute can be either a string or an {@link guide/dev_guide.expressions
 * Angular expression}; these are evaluated on the current scope for its binded value.
 *
 * The `when` attribute specifies the mappings between plural categories and the actual
 * string to be displayed. The value of the attribute should be a JSON object so that Angular
 * can interpret it correctly.
 *
 * The following example shows how to configure ng:pluralize:
 *
 * <pre>
 * <ng:pluralize count="personCount"
                 when="{'0': 'Nobody is viewing.',
 *                      'one': '1 person is viewing.',
 *                      'other': '{} people are viewing.'}">
 * </ng:pluralize>
 *</pre>
 *
 * In the example, `"0: Nobody is viewing."` is an explicit number rule. If you did not
 * specify this rule, 0 would be matched to the "other" category and "0 people are viewing"
 * would be shown instead of "Nobody is viewing". You can specify an explicit number rule for
 * other numbers, for example 12, so that instead of showing "12 people are viewing", you can
 * show "a dozen people are viewing".
 *
 * You can use a set of closed braces(`{}`) as a placeholder for the number that you want substituted
 * into pluralized strings. In the previous example, Angular will replace `{}` with
 * <span ng:non-bindable>`{{personCount}}`</span>. The closed braces `{}` is a placeholder
 * for <span ng:non-bindable>{{numberExpression}}</span>.
 *
 * # Configuring ng:pluralize with offset
 * The `offset` attribute allows further customization of pluralized text, which can result in
 * a better user experience. For example, instead of the message "4 people are viewing this document",
 * you might display "John, Kate and 2 others are viewing this document".
 * The offset attribute allows you to offset a number by any desired value.
 * Let's take a look at an example:
 *
 * <pre>
 * <ng:pluralize count="personCount" offset=2
 *               when="{'0': 'Nobody is viewing.',
 *                      '1': '{{person1}} is viewing.',
 *                      '2': '{{person1}} and {{person2}} are viewing.',
 *                      'one': '{{person1}}, {{person2}} and one other person are viewing.',
 *                      'other': '{{person1}}, {{person2}} and {} other people are viewing.'}">
 * </ng:pluralize>
 * </pre>
 *
 * Notice that we are still using two plural categories(one, other), but we added
 * three explicit number rules 0, 1 and 2.
 * When one person, perhaps John, views the document, "John is viewing" will be shown.
 * When three people view the document, no explicit number rule is found, so
 * an offset of 2 is taken off 3, and Angular uses 1 to decide the plural category.
 * In this case, plural category 'one' is matched and "John, Marry and one other person are viewing"
 * is shown.
 *
 * Note that when you specify offsets, you must provide explicit number rules for
 * numbers from 0 up to and including the offset. If you use an offset of 3, for example,
 * you must provide explicit number rules for 0, 1, 2 and 3. You must also provide plural strings for
 * plural categories "one" and "other".
 *
 * @param {string|expression} count The variable to be bounded to.
 * @param {string} when The mapping between plural category to its correspoding strings.
 * @param {number=} offset Offset to deduct from the total number.
 *
 * @example
    <doc:example>
      <doc:source>
        <script>
          function Ctrl() {
            this.person1 = 'Igor';
            this.person2 = 'Misko';
            this.personCount = 1;
          }
        </script>
        <div ng:controller="Ctrl">
          Person 1:<input type="text" ng:model="person1" value="Igor" /><br/>
          Person 2:<input type="text" ng:model="person2" value="Misko" /><br/>
          Number of People:<input type="text" ng:model="personCount" value="1" /><br/>

          <!--- Example with simple pluralization rules for en locale --->
          Without Offset:
          <ng:pluralize count="personCount"
                        when="{'0': 'Nobody is viewing.',
                               'one': '1 person is viewing.',
                               'other': '{} people are viewing.'}">
          </ng:pluralize><br>

          <!--- Example with offset --->
          With Offset(2):
          <ng:pluralize count="personCount" offset=2
                        when="{'0': 'Nobody is viewing.',
                               '1': '{{person1}} is viewing.',
                               '2': '{{person1}} and {{person2}} are viewing.',
                               'one': '{{person1}}, {{person2}} and one other person are viewing.',
                               'other': '{{person1}}, {{person2}} and {} other people are viewing.'}">
          </ng:pluralize>
        </div>
      </doc:source>
      <doc:scenario>
        it('should show correct pluralized string', function() {
          expect(element('.doc-example-live .ng-pluralize:first').text()).
                                             toBe('1 person is viewing.');
          expect(element('.doc-example-live .ng-pluralize:last').text()).
                                                toBe('Igor is viewing.');

          using('.doc-example-live').input('personCount').enter('0');
          expect(element('.doc-example-live .ng-pluralize:first').text()).
                                               toBe('Nobody is viewing.');
          expect(element('.doc-example-live .ng-pluralize:last').text()).
                                              toBe('Nobody is viewing.');

          using('.doc-example-live').input('personCount').enter('2');
          expect(element('.doc-example-live .ng-pluralize:first').text()).
                                            toBe('2 people are viewing.');
          expect(element('.doc-example-live .ng-pluralize:last').text()).
                              toBe('Igor and Misko are viewing.');

          using('.doc-example-live').input('personCount').enter('3');
          expect(element('.doc-example-live .ng-pluralize:first').text()).
                                            toBe('3 people are viewing.');
          expect(element('.doc-example-live .ng-pluralize:last').text()).
                              toBe('Igor, Misko and one other person are viewing.');

          using('.doc-example-live').input('personCount').enter('4');
          expect(element('.doc-example-live .ng-pluralize:first').text()).
                                            toBe('4 people are viewing.');
          expect(element('.doc-example-live .ng-pluralize:last').text()).
                              toBe('Igor, Misko and 2 other people are viewing.');
        });

        it('should show data-binded names', function() {
          using('.doc-example-live').input('personCount').enter('4');
          expect(element('.doc-example-live .ng-pluralize:last').text()).
              toBe('Igor, Misko and 2 other people are viewing.');

          using('.doc-example-live').input('person1').enter('Di');
          using('.doc-example-live').input('person2').enter('Vojta');
          expect(element('.doc-example-live .ng-pluralize:last').text()).
              toBe('Di, Vojta and 2 other people are viewing.');
        });
      </doc:scenario>
    </doc:example>
 */
angularWidget('ng:pluralize', function(element) {
  var numberExp = element.attr('count'),
      whenExp = element.attr('when'),
      offset = element.attr('offset') || 0;

  return ['$locale', '$element', function($locale, element) {
    var scope = this,
        whens = scope.$eval(whenExp),
        whensExpFns = {};

    forEach(whens, function(expression, key) {
      whensExpFns[key] = compileBindTemplate(expression.replace(/{}/g,
                                             '{{' + numberExp + '-' + offset + '}}'));
    });

    scope.$watch(function() {
      var value = parseFloat(scope.$eval(numberExp));

      if (!isNaN(value)) {
        //if explicit number rule such as 1, 2, 3... is defined, just use it. Otherwise,
        //check it against pluralization rules in $locale service
        if (!whens[value]) value = $locale.pluralCat(value - offset);
         return whensExpFns[value](scope, element, true);
      } else {
        return '';
      }
    }, function(scope, newVal) {
      element.text(newVal);
    });
  }];
});

/**
 * @ngdoc widget
 * @name angular.widget.form
 *
 * @description
 * Angular widget that creates a form scope using the
 * {@link angular.module.ng.$formFactory $formFactory} API. The resulting form scope instance is
 * attached to the DOM element using the jQuery `.data()` method under the `$form` key.
 * See {@link guide/dev_guide.forms forms} on detailed discussion of forms and widgets.
 *
 *
 * # Alias: `ng:form`
 *
 * In angular forms can be nested. This means that the outer form is valid when all of the child
 * forms are valid as well. However browsers do not allow nesting of `<form>` elements, for this
 * reason angular provides `<ng:form>` alias which behaves identical to `<form>` but allows
 * element nesting.
 *
 *
 * # Submitting a form and preventing default action
 *
 * Since the role of forms in client-side Angular applications is different than in old-school
 * roundtrip apps, it is desirable for the browser not to translate the form submission into a full
 * page reload that sends the data to the server. Instead some javascript logic should be triggered
 * to handle the form submission in application specific way.
 *
 * For this reason, Angular prevents the default action (form submission to the server) unless the
 * `<form>` element has an `action` attribute specified.
 *
 * You can use one of the following two ways to specify what javascript method should be called when
 * a form is submitted:
 *
 * - ng:submit on the form element (add link to ng:submit)
 * - ng:click on the first button or input field of type submit (input[type=submit])
 *
 * To prevent double execution of the handler, use only one of ng:submit or ng:click. This is
 * because of the following form submission rules coming from the html spec:
 *
 * - If a form has only one input field then hitting enter in this field triggers form submit
 * (`ng:submit`)
 * - if a form has has 2+ input fields and no buttons or input[type=submit] then hitting enter
 * doesn't trigger submit
 * - if a form has one or more input fields and one or more buttons or input[type=submit] then
 * hitting enter in any of the input fields will trigger the click handler on the *first* button or
 * input[type=submit] (`ng:click`) *and* a submit handler on the enclosing form (`ng:submit`)
 *
 * @param {string=} name Name of the form.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl() {
           this.text = 'guest';
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           text: <input type="text" name="input" ng:model="text" required>
           <span class="error" ng:show="myForm.text.$error.REQUIRED">Required!</span>
         </form>
         <tt>text = {{text}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
         expect(binding('text')).toEqual('guest');
         expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
         input('text').enter('');
         expect(binding('text')).toEqual('');
         expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */
angularWidget('form', function(form){
  this.descend(true);
  this.directives(true);
  return ['$formFactory', '$element', function($formFactory, formElement) {
    var name = formElement.attr('name'),
        parentForm = $formFactory.forElement(formElement),
        form = $formFactory(parentForm);
    formElement.data('$form', form);
    formElement.bind('submit', function(event) {
      if (!formElement.attr('action')) event.preventDefault();
    });
    if (name) {
      this[name] = form;
    }
    watch('valid');
    watch('invalid');
    function watch(name) {
      form.$watch('$' + name, function(scope, value) {
        formElement[value ? 'addClass' : 'removeClass']('ng-' + name);
      });
    }
  }];
});

angularWidget('ng:form', angularWidget('form'));

var URL_REGEXP = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
var EMAIL_REGEXP = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
var NUMBER_REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/;
var INTEGER_REGEXP = /^\s*(\-|\+)?\d+\s*$/;


/**
 * @ngdoc inputType
 * @name angular.inputType.text
 *
 * @description
 * Standard HTML text input with angular data binding.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl() {
           this.text = 'guest';
           this.word = /^\w*$/;
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           Single word: <input type="text" name="input" ng:model="text"
                               ng:pattern="word" required>
           <span class="error" ng:show="myForm.input.$error.REQUIRED">
             Required!</span>
           <span class="error" ng:show="myForm.input.$error.PATTERN">
             Single word only!</span>
         </form>
         <tt>text = {{text}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('text')).toEqual('guest');
          expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
          input('text').enter('');
          expect(binding('text')).toEqual('');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });

        it('should be invalid if multi word', function() {
          input('text').enter('hello world');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */


/**
 * @ngdoc inputType
 * @name angular.inputType.email
 *
 * @description
 * Text input with email validation. Sets the `EMAIL` validation error key if not a valid email
 * address.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl() {
           this.text = 'me@example.com';
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           Email: <input type="email" name="input" ng:model="text" required>
           <span class="error" ng:show="myForm.input.$error.REQUIRED">
             Required!</span>
           <span class="error" ng:show="myForm.input.$error.EMAIL">
             Not valid email!</span>
         </form>
         <tt>text = {{text}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
         <tt>myForm.$error.EMAIL = {{!!myForm.$error.EMAIL}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('text')).toEqual('me@example.com');
          expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
          input('text').enter('');
          expect(binding('text')).toEqual('');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });

        it('should be invalid if not email', function() {
          input('text').enter('xxx');
          expect(binding('text')).toEqual('xxx');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */
angularInputType('email', function() {
  var widget = this;
  this.$on('$validate', function(event){
    var value = widget.$viewValue;
    widget.$emit(!value || value.match(EMAIL_REGEXP) ? "$valid" : "$invalid", "EMAIL");
  });
});


/**
 * @ngdoc inputType
 * @name angular.inputType.url
 *
 * @description
 * Text input with URL validation. Sets the `URL` validation error key if the content is not a
 * valid URL.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl() {
           this.text = 'http://google.com';
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           URL: <input type="url" name="input" ng:model="text" required>
           <span class="error" ng:show="myForm.input.$error.REQUIRED">
             Required!</span>
           <span class="error" ng:show="myForm.input.$error.url">
             Not valid url!</span>
         </form>
         <tt>text = {{text}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
         <tt>myForm.$error.url = {{!!myForm.$error.url}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('text')).toEqual('http://google.com');
          expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
          input('text').enter('');
          expect(binding('text')).toEqual('');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });

        it('should be invalid if not url', function() {
          input('text').enter('xxx');
          expect(binding('text')).toEqual('xxx');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */
angularInputType('url', function() {
  var widget = this;
  this.$on('$validate', function(event){
    var value = widget.$viewValue;
    widget.$emit(!value || value.match(URL_REGEXP) ? "$valid" : "$invalid", "URL");
  });
});


/**
 * @ngdoc inputType
 * @name angular.inputType.list
 *
 * @description
 * Text input that converts between comma-seperated string into an array of strings.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl() {
           this.names = ['igor', 'misko', 'vojta'];
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           List: <input type="list" name="input" ng:model="names" required>
           <span class="error" ng:show="myForm.list.$error.REQUIRED">
             Required!</span>
         </form>
         <tt>names = {{names}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('names')).toEqual('["igor","misko","vojta"]');
          expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
          input('names').enter('');
          expect(binding('names')).toEqual('[]');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */
angularInputType('list', function() {
  function parse(viewValue) {
    var list = [];
    forEach(viewValue.split(/\s*,\s*/), function(value){
      if (value) list.push(trim(value));
    });
    return list;
  }
  this.$parseView = function() {
    isString(this.$viewValue) && (this.$modelValue = parse(this.$viewValue));
  };
  this.$parseModel = function() {
    var modelValue = this.$modelValue;
    if (isArray(modelValue)
        && (!isString(this.$viewValue) || !equals(parse(this.$viewValue), modelValue))) {
      this.$viewValue =  modelValue.join(', ');
    }
  };
});


/**
 * @ngdoc inputType
 * @name angular.inputType.number
 *
 * @description
 * Text input with number validation and transformation. Sets the `NUMBER` validation
 * error if not a valid number.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} min Sets the `MIN` validation error key if the value entered is less then `min`.
 * @param {string=} max Sets the `MAX` validation error key if the value entered is greater then `min`.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl() {
           this.value = 12;
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           Number: <input type="number" name="input" ng:model="value"
                          min="0" max="99" required>
           <span class="error" ng:show="myForm.list.$error.REQUIRED">
             Required!</span>
           <span class="error" ng:show="myForm.list.$error.NUMBER">
             Not valid number!</span>
         </form>
         <tt>value = {{value}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
         expect(binding('value')).toEqual('12');
         expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
         input('value').enter('');
         expect(binding('value')).toEqual('');
         expect(binding('myForm.input.$valid')).toEqual('false');
        });

        it('should be invalid if over max', function() {
         input('value').enter('123');
         expect(binding('value')).toEqual('123');
         expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */
angularInputType('number', numericRegexpInputType(NUMBER_REGEXP, 'NUMBER'));


/**
 * @ngdoc inputType
 * @name angular.inputType.integer
 *
 * @description
 * Text input with integer validation and transformation. Sets the `INTEGER`
 * validation error key if not a valid integer.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} min Sets the `MIN` validation error key if the value entered is less then `min`.
 * @param {string=} max Sets the `MAX` validation error key if the value entered is greater then `min`.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl() {
           this.value = 12;
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           Integer: <input type="integer" name="input" ng:model="value"
                           min="0" max="99" required>
           <span class="error" ng:show="myForm.list.$error.REQUIRED">
             Required!</span>
           <span class="error" ng:show="myForm.list.$error.INTEGER">
             Not valid integer!</span>
         </form>
         <tt>value = {{value}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('value')).toEqual('12');
          expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
          input('value').enter('1.2');
          expect(binding('value')).toEqual('12');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });

        it('should be invalid if over max', function() {
          input('value').enter('123');
          expect(binding('value')).toEqual('123');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */
angularInputType('integer', numericRegexpInputType(INTEGER_REGEXP, 'INTEGER'));


/**
 * @ngdoc inputType
 * @name angular.inputType.checkbox
 *
 * @description
 * HTML checkbox.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} ng:true-value The value to which the expression should be set when selected.
 * @param {string=} ng:false-value The value to which the expression should be set when not selected.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl() {
           this.value1 = true;
           this.value2 = 'YES'
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           Value1: <input type="checkbox" ng:model="value1"> <br/>
           Value2: <input type="checkbox" ng:model="value2"
                          ng:true-value="YES" ng:false-value="NO"> <br/>
         </form>
         <tt>value1 = {{value1}}</tt><br/>
         <tt>value2 = {{value2}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should change state', function() {
          expect(binding('value1')).toEqual('true');
          expect(binding('value2')).toEqual('YES');

          input('value1').check();
          input('value2').check();
          expect(binding('value1')).toEqual('false');
          expect(binding('value2')).toEqual('NO');
        });
      </doc:scenario>
    </doc:example>
 */
angularInputType('checkbox', function(inputElement) {
  var widget = this,
      trueValue = inputElement.attr('ng:true-value'),
      falseValue = inputElement.attr('ng:false-value');

  if (!isString(trueValue)) trueValue = true;
  if (!isString(falseValue)) falseValue = false;

  inputElement.bind('click', function() {
    widget.$apply(function() {
      widget.$emit('$viewChange', inputElement[0].checked);
    });
  });

  widget.$render = function() {
    inputElement[0].checked = widget.$viewValue;
  };

  widget.$parseModel = function() {
    widget.$viewValue = this.$modelValue === trueValue;
  };

  widget.$parseView = function() {
    widget.$modelValue = widget.$viewValue ? trueValue : falseValue;
  };
});


/**
 * @ngdoc inputType
 * @name angular.inputType.radio
 *
 * @description
 * HTML radio button.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string} value The value to which the expression should be set when selected.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl() {
           this.color = 'blue';
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           <input type="radio" ng:model="color" value="red">  Red <br/>
           <input type="radio" ng:model="color" value="green"> Green <br/>
           <input type="radio" ng:model="color" value="blue"> Blue <br/>
         </form>
         <tt>color = {{color}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should change state', function() {
          expect(binding('color')).toEqual('blue');

          input('color').select('red');
          expect(binding('color')).toEqual('red');
        });
      </doc:scenario>
    </doc:example>
 */
angularInputType('radio', function(inputElement) {
  var widget = this;

  //correct the name
  inputElement.attr('name', widget.$id + '@' + inputElement.attr('name'));
  inputElement.bind('click', function() {
    widget.$apply(function() {
      if (inputElement[0].checked) {
        widget.$emit('$viewChange', widget.$value);
      }
    });
  });

  widget.$render = function() {
    inputElement[0].checked = isDefined(widget.$value) && (widget.$value == widget.$viewValue);
  };

  if (inputElement[0].checked) {
    widget.$viewValue = widget.$value;
  }
});


function numericRegexpInputType(regexp, error) {
  return ['$element', function(inputElement) {
    var widget = this,
        min = 1 * (inputElement.attr('min') || Number.MIN_VALUE),
        max = 1 * (inputElement.attr('max') || Number.MAX_VALUE);

    widget.$on('$validate', function(event){
      var value = widget.$viewValue,
          filled = value && trim(value) != '',
          valid = isString(value) && value.match(regexp);

      widget.$emit(!filled || valid ? "$valid" : "$invalid", error);
      filled && (value = 1 * value);
      widget.$emit(valid && value < min ? "$invalid" : "$valid", "MIN");
      widget.$emit(valid && value > max ? "$invalid" : "$valid", "MAX");
    });

    widget.$parseView = function() {
      if (widget.$viewValue.match(regexp)) {
        widget.$modelValue = 1 * widget.$viewValue;
      } else if (widget.$viewValue == '') {
        widget.$modelValue = null;
      }
    };

    widget.$parseModel = function() {
      widget.$viewValue = isNumber(widget.$modelValue)
        ? '' + widget.$modelValue
        : '';
    };
  }];
}


var HTML5_INPUTS_TYPES =  makeMap(
        "search,tel,url,email,datetime,date,month,week,time,datetime-local,number,range,color," +
        "radio,checkbox,text,button,submit,reset,hidden,password");


/**
 * @ngdoc widget
 * @name angular.widget.input
 *
 * @description
 * HTML input element widget with angular data-binding. Input widget follows HTML5 input types
 * and polyfills the HTML5 validation behavior for older browsers.
 *
 * The {@link angular.inputType custom angular.inputType}s provide a shorthand for declaring new
 * inputs. This is a sharthand for text-box based inputs, and there is no need to go through the
 * full {@link angular.module.ng.$formFactory $formFactory} widget lifecycle.
 *
 *
 * @param {string} type Widget types as defined by {@link angular.inputType}. If the
 *    type is in the format of `@ScopeType` then `ScopeType` is loaded from the
 *    current scope, allowing quick definition of type.
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl() {
           this.user = {name: 'guest', last: 'visitor'};
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           User name: <input type="text" name="userName" ng:model="user.name" required>
           <span class="error" ng:show="myForm.userName.$error.REQUIRED">
             Required!</span><br>
           Last name: <input type="text" name="lastName" ng:model="user.last"
             ng:minlength="3" ng:maxlength="10">
           <span class="error" ng:show="myForm.lastName.$error.MINLENGTH">
             Too short!</span>
           <span class="error" ng:show="myForm.lastName.$error.MAXLENGTH">
             Too long!</span><br>
         </form>
         <hr>
         <tt>user = {{user}}</tt><br/>
         <tt>myForm.userName.$valid = {{myForm.userName.$valid}}</tt><br>
         <tt>myForm.userName.$error = {{myForm.userName.$error}}</tt><br>
         <tt>myForm.lastName.$valid = {{myForm.lastName.$valid}}</tt><br>
         <tt>myForm.userName.$error = {{myForm.lastName.$error}}</tt><br>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br>
         <tt>myForm.$error.MINLENGTH = {{!!myForm.$error.MINLENGTH}}</tt><br>
         <tt>myForm.$error.MAXLENGTH = {{!!myForm.$error.MAXLENGTH}}</tt><br>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('user')).toEqual('{\n  \"last\":\"visitor",\n  \"name\":\"guest\"}');
          expect(binding('myForm.userName.$valid')).toEqual('true');
          expect(binding('myForm.$valid')).toEqual('true');
        });

        it('should be invalid if empty when required', function() {
          input('user.name').enter('');
          expect(binding('user')).toEqual('{\n  \"last\":\"visitor",\n  \"name\":\"\"}');
          expect(binding('myForm.userName.$valid')).toEqual('false');
          expect(binding('myForm.$valid')).toEqual('false');
        });

        it('should be valid if empty when min length is set', function() {
          input('user.last').enter('');
          expect(binding('user')).toEqual('{\n  \"last\":\"",\n  \"name\":\"guest\"}');
          expect(binding('myForm.lastName.$valid')).toEqual('true');
          expect(binding('myForm.$valid')).toEqual('true');
        });

        it('should be invalid if less than required min length', function() {
          input('user.last').enter('xx');
          expect(binding('user')).toEqual('{\n  \"last\":\"xx",\n  \"name\":\"guest\"}');
          expect(binding('myForm.lastName.$valid')).toEqual('false');
          expect(binding('myForm.lastName.$error')).toMatch(/MINLENGTH/);
          expect(binding('myForm.$valid')).toEqual('false');
        });

        it('should be valid if longer than max length', function() {
          input('user.last').enter('some ridiculously long name');
          expect(binding('user'))
            .toEqual('{\n  \"last\":\"some ridiculously long name",\n  \"name\":\"guest\"}');
          expect(binding('myForm.lastName.$valid')).toEqual('false');
          expect(binding('myForm.lastName.$error')).toMatch(/MAXLENGTH/);
          expect(binding('myForm.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */
angularWidget('input', function(inputElement){
  this.directives(true);
  this.descend(true);
  var modelExp = inputElement.attr('ng:model');
  return modelExp &&
    ['$defer', '$formFactory', '$element', function($defer, $formFactory, inputElement){
      var form = $formFactory.forElement(inputElement),
          // We have to use .getAttribute, since jQuery tries to be smart and use the
          // type property. Trouble is some browser change unknown to text.
          type = inputElement[0].getAttribute('type') || 'text',
          TypeController,
          modelScope = this,
          patternMatch, widget,
          pattern = trim(inputElement.attr('ng:pattern')),
          minlength = parseInt(inputElement.attr('ng:minlength'), 10),
          maxlength = parseInt(inputElement.attr('ng:maxlength'), 10),
          loadFromScope = type.match(/^\s*\@\s*(.*)/);


       if (!pattern) {
         patternMatch = valueFn(true);
       } else {
         if (pattern.match(/^\/(.*)\/$/)) {
           pattern = new RegExp(pattern.substr(1, pattern.length - 2));
           patternMatch = function(value) {
             return pattern.test(value);
           };
         } else {
           patternMatch = function(value) {
             var patternObj = modelScope.$eval(pattern);
             if (!patternObj || !patternObj.test) {
               throw new Error('Expected ' + pattern + ' to be a RegExp but was ' + patternObj);
             }
             return patternObj.test(value);
           };
         }
       }

      type = lowercase(type);
      TypeController = (loadFromScope
              ? (assertArgFn(this.$eval(loadFromScope[1]), loadFromScope[1])).$unboundFn
              : angularInputType(type)) || noop;

      if (!HTML5_INPUTS_TYPES[type]) {
        try {
          // jquery will not let you so we have to go to bare metal
          inputElement[0].setAttribute('type', 'text');
        } catch(e){
          // also turns out that ie8 will not allow changing of types, but since it is not
          // html5 anyway we can ignore the error.
        }
      }

      //TODO(misko): setting $inject is a hack
      !TypeController.$inject && (TypeController.$inject = ['$element']);
      widget = form.$createWidget({
          scope: modelScope,
          model: modelExp,
          onChange: inputElement.attr('ng:change'),
          alias: inputElement.attr('name'),
          controller: TypeController,
          controllerArgs: {$element: inputElement}
      });

      watchElementProperty(this, widget, 'value', inputElement);
      watchElementProperty(this, widget, 'required', inputElement);
      watchElementProperty(this, widget, 'readonly', inputElement);
      watchElementProperty(this, widget, 'disabled', inputElement);

      widget.$pristine = !(widget.$dirty = false);

      widget.$on('$validate', function() {
        var $viewValue = trim(widget.$viewValue),
            inValid = widget.$required && !$viewValue,
            tooLong = maxlength && $viewValue && $viewValue.length > maxlength,
            tooShort = minlength && $viewValue && $viewValue.length < minlength,
            missMatch = $viewValue && !patternMatch($viewValue);

        if (widget.$error.REQUIRED != inValid){
          widget.$emit(inValid ? '$invalid' : '$valid', 'REQUIRED');
        }
        if (widget.$error.PATTERN != missMatch){
          widget.$emit(missMatch ? '$invalid' : '$valid', 'PATTERN');
        }
        if (widget.$error.MINLENGTH != tooShort){
          widget.$emit(tooShort ? '$invalid' : '$valid', 'MINLENGTH');
        }
        if (widget.$error.MAXLENGTH != tooLong){
          widget.$emit(tooLong ? '$invalid' : '$valid', 'MAXLENGTH');
        }
      });

      forEach(['valid', 'invalid', 'pristine', 'dirty'], function(name) {
        widget.$watch('$' + name, function(scope, value) {
          inputElement[value ? 'addClass' : 'removeClass']('ng-' + name);
        });
      });

      inputElement.bind('$destroy', function() {
        widget.$destroy();
      });

      if (type != 'checkbox' && type != 'radio') {
        // TODO (misko): checkbox / radio does not really belong here, but until we can do
        // widget registration with CSS, we are hacking it this way.
        widget.$render = function() {
          inputElement.val(widget.$viewValue || '');
        };

        inputElement.bind('keydown change input', function(event) {
          var key = event.keyCode;
          if (/*command*/   key != 91 &&
              /*modifiers*/ !(15 < key && key < 19) &&
              /*arrow*/     !(37 < key && key < 40)) {
            $defer(function() {
              widget.$dirty = !(widget.$pristine = false);
              var value = trim(inputElement.val());
              if (widget.$viewValue !== value ) {
                widget.$emit('$viewChange', value);
              }
            });
          }
        });
      }
    }];
});


/**
 * @ngdoc widget
 * @name angular.widget.textarea
 *
 * @description
 * HTML textarea element widget with angular data-binding. The data-binding and validation
 * properties of this element are exactly the same as those of the
 * {@link angular.widget.input input element}.
 *
 * @param {string} type Widget types as defined by {@link angular.inputType}. If the
 *    type is in the format of `@ScopeType` then `ScopeType` is loaded from the
 *    current scope, allowing quick definition of type.
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 */
angularWidget('textarea', angularWidget('input'));


function watchElementProperty(modelScope, widget, name, element) {
  var bindAttr = fromJson(element.attr('ng:bind-attr') || '{}'),
      match = /\s*{{(.*)}}\s*/.exec(bindAttr[name]),
      isBoolean = BOOLEAN_ATTR[name];
  widget['$' + name] = isBoolean
    ? ( // some browsers return true some '' when required is set without value.
        isString(element.prop(name)) || !!element.prop(name) ||
        // this is needed for ie9, since it will treat boolean attributes as false
        !!element[0].attributes[name])
    : element.attr(name);
  if (bindAttr[name] && match) {
    modelScope.$watch(match[1], function(scope, value){
      widget['$' + name] = isBoolean ? !!value : value;
      widget.$emit('$validate');
      widget.$render && widget.$render();
    });
  }
}

/**
 * @ngdoc widget
 * @name angular.widget.select
 *
 * @description
 * HTML `SELECT` element with angular data-binding.
 *
 * # `ng:options`
 *
 * Optionally `ng:options` attribute can be used to dynamically generate a list of `<option>`
 * elements for a `<select>` element using an array or an object obtained by evaluating the
 * `ng:options` expression.
 *
 * When an item in the select menu is select, the value of array element or object property
 * represented by the selected option will be bound to the model identified by the `ng:model` attribute
 * of the parent select element.
 *
 * Optionally, a single hard-coded `<option>` element, with the value set to an empty string, can
 * be nested into the `<select>` element. This element will then represent `null` or "not selected"
 * option. See example below for demonstration.
 *
 * Note: `ng:options` provides iterator facility for `<option>` element which must be used instead
 * of {@link angular.widget.@ng:repeat ng:repeat}. `ng:repeat` is not suitable for use with
 * `<option>` element because of the following reasons:
 *
 *   * value attribute of the option element that we need to bind to requires a string, but the
 *     source of data for the iteration might be in a form of array containing objects instead of
 *     strings
 *   * {@link angular.widget.@ng:repeat ng:repeat} unrolls after the select binds causing
 *     incorect rendering on most browsers.
 *   * binding to a value not in list confuses most browsers.
 *
 * @param {string} name assignable expression to data-bind to.
 * @param {string=} required The widget is considered valid only if value is entered.
 * @param {comprehension_expression=} ng:options in one of the following forms:
 *
 *   * for array data sources:
 *     * `label` **`for`** `value` **`in`** `array`
 *     * `select` **`as`** `label` **`for`** `value` **`in`** `array`
 *     * `label`  **`group by`** `group` **`for`** `value` **`in`** `array`
 *     * `select` **`as`** `label` **`group by`** `group` **`for`** `value` **`in`** `array`
 *   * for object data sources:
 *     * `label` **`for (`**`key` **`,`** `value`**`) in`** `object`
 *     * `select` **`as`** `label` **`for (`**`key` **`,`** `value`**`) in`** `object`
 *     * `label` **`group by`** `group` **`for (`**`key`**`,`** `value`**`) in`** `object`
 *     * `select` **`as`** `label` **`group by`** `group`
 *         **`for` `(`**`key`**`,`** `value`**`) in`** `object`
 *
 * Where:
 *
 *   * `array` / `object`: an expression which evaluates to an array / object to iterate over.
 *   * `value`: local variable which will refer to each item in the `array` or each property value
 *      of `object` during iteration.
 *   * `key`: local variable which will refer to a property name in `object` during iteration.
 *   * `label`: The result of this expression will be the label for `<option>` element. The
 *     `expression` will most likely refer to the `value` variable (e.g. `value.propertyName`).
 *   * `select`: The result of this expression will be bound to the model of the parent `<select>`
 *      element. If not specified, `select` expression will default to `value`.
 *   * `group`: The result of this expression will be used to group options using the `<optgroup>`
 *      DOM element.
 *
 * @example
    <doc:example>
      <doc:source>
        <script>
        function MyCntrl() {
          this.colors = [
            {name:'black', shade:'dark'},
            {name:'white', shade:'light'},
            {name:'red', shade:'dark'},
            {name:'blue', shade:'dark'},
            {name:'yellow', shade:'light'}
          ];
          this.color = this.colors[2]; // red
        }
        </script>
        <div ng:controller="MyCntrl">
          <ul>
            <li ng:repeat="color in colors">
              Name: <input ng:model="color.name">
              [<a href ng:click="colors.$remove(color)">X</a>]
            </li>
            <li>
              [<a href ng:click="colors.push({})">add</a>]
            </li>
          </ul>
          <hr/>
          Color (null not allowed):
          <select ng:model="color" ng:options="c.name for c in colors"></select><br>

          Color (null allowed):
          <div  class="nullable">
            <select ng:model="color" ng:options="c.name for c in colors">
              <option value="">-- chose color --</option>
            </select>
          </div><br/>

          Color grouped by shade:
          <select ng:model="color" ng:options="c.name group by c.shade for c in colors">
          </select><br/>


          Select <a href ng:click="color={name:'not in list'}">bogus</a>.<br>
          <hr/>
          Currently selected: {{ {selected_color:color}  }}
          <div style="border:solid 1px black; height:20px"
               ng:style="{'background-color':color.name}">
          </div>
        </div>
      </doc:source>
      <doc:scenario>
         it('should check ng:options', function() {
           expect(binding('color')).toMatch('red');
           select('color').option('0');
           expect(binding('color')).toMatch('black');
           using('.nullable').select('color').option('');
           expect(binding('color')).toMatch('null');
         });
      </doc:scenario>
    </doc:example>
 */


                       //00001111100000000000222200000000000000000000003333000000000000044444444444444444000000000555555555555555550000000666666666666666660000000000000007777
var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;


angularWidget('select', function(element){
  this.directives(true);
  this.descend(true);
  return element.attr('ng:model') &&
               ['$formFactory', '$compile', '$parse', '$element',
        function($formFactory,   $compile,   $parse,   selectElement){
    var modelScope = this,
        match,
        form = $formFactory.forElement(selectElement),
        multiple = selectElement.attr('multiple'),
        optionsExp = selectElement.attr('ng:options'),
        modelExp = selectElement.attr('ng:model'),
        widget = form.$createWidget({
          scope: this,
          model: modelExp,
          onChange: selectElement.attr('ng:change'),
          alias: selectElement.attr('name'),
          controller: optionsExp ? Options : (multiple ? Multiple : Single)});

    selectElement.bind('$destroy', function() { widget.$destroy(); });

    widget.$pristine = !(widget.$dirty = false);

    watchElementProperty(modelScope, widget, 'required', selectElement);
    watchElementProperty(modelScope, widget, 'readonly', selectElement);
    watchElementProperty(modelScope, widget, 'disabled', selectElement);

    widget.$on('$validate', function() {
      var valid = !widget.$required || !!widget.$modelValue;
      if (valid && multiple && widget.$required) valid = !!widget.$modelValue.length;
      if (valid !== !widget.$error.REQUIRED) {
        widget.$emit(valid ? '$valid' : '$invalid', 'REQUIRED');
      }
    });

    widget.$on('$viewChange', function() {
      widget.$pristine = !(widget.$dirty = true);
    });

    forEach(['valid', 'invalid', 'pristine', 'dirty'], function(name) {
      widget.$watch('$' + name, function(scope, value) {
        selectElement[value ? 'addClass' : 'removeClass']('ng-' + name);
      });
    });

    ////////////////////////////

    function Multiple() {
      var widget = this;

      this.$render = function() {
        var items = new HashMap(this.$viewValue);
        forEach(selectElement.children(), function(option){
          option.selected = isDefined(items.get(option.value));
        });
      };

      selectElement.bind('change', function() {
        widget.$apply(function() {
          var array = [];
          forEach(selectElement.children(), function(option){
            if (option.selected) {
              array.push(option.value);
            }
          });
          widget.$emit('$viewChange', array);
        });
      });

    }

    function Single() {
      var widget = this;

      widget.$render = function() {
        selectElement.val(widget.$viewValue);
      };

      selectElement.bind('change', function() {
        widget.$apply(function() {
          widget.$emit('$viewChange', selectElement.val());
        });
      });

      widget.$viewValue = selectElement.val();
    }

    function Options() {
      var widget = this,
          match;

      if (! (match = optionsExp.match(NG_OPTIONS_REGEXP))) {
        throw Error(
          "Expected ng:options in form of '_select_ (as _label_)? for (_key_,)?_value_ in _collection_'" +
          " but got '" + optionsExp + "'.");
      }

      var widgetScope = this,
          displayFn = $parse(match[2] || match[1]),
          valueName = match[4] || match[6],
          keyName = match[5],
          groupByFn = $parse(match[3] || ''),
          valueFn = $parse(match[2] ? match[1] : valueName),
          valuesFn = $parse(match[7]),
          // we can't just jqLite('<option>') since jqLite is not smart enough
          // to create it in <select> and IE barfs otherwise.
          optionTemplate = jqLite(document.createElement('option')),
          optGroupTemplate = jqLite(document.createElement('optgroup')),
          nullOption = false, // if false then user will not be able to select it
          // This is an array of array of existing option groups in DOM. We try to reuse these if possible
          // optionGroupsCache[0] is the options with no option group
          // optionGroupsCache[?][0] is the parent: either the SELECT or OPTGROUP element
          optionGroupsCache = [[{element: selectElement, label:''}]];

      // find existing special options
      forEach(selectElement.children(), function(option) {
        if (option.value == '') {
          // developer declared null option, so user should be able to select it
          nullOption = jqLite(option).remove();
          // compile the element since there might be bindings in it
          $compile(nullOption)(modelScope);
        }
      });
      selectElement.html(''); // clear contents

      selectElement.bind('change', function() {
        widgetScope.$apply(function() {
          var optionGroup,
              collection = valuesFn(modelScope) || [],
              key = selectElement.val(),
              tempScope = inherit(modelScope),
              value, optionElement, index, groupIndex, length, groupLength;

          if (multiple) {
            value = [];
            for (groupIndex = 0, groupLength = optionGroupsCache.length;
            groupIndex < groupLength;
            groupIndex++) {
              // list of options for that group. (first item has the parent)
              optionGroup = optionGroupsCache[groupIndex];

              for(index = 1, length = optionGroup.length; index < length; index++) {
                if ((optionElement = optionGroup[index].element)[0].selected) {
                  if (keyName) tempScope[keyName] = key;
                  tempScope[valueName] = collection[optionElement.val()];
                  value.push(valueFn(tempScope));
                }
              }
            }
          } else {
            if (key == '?') {
              value = undefined;
            } else if (key == ''){
              value = null;
            } else {
              tempScope[valueName] = collection[key];
              if (keyName) tempScope[keyName] = key;
              value = valueFn(tempScope);
            }
          }
          if (isDefined(value) && modelScope.$viewVal !== value) {
            widgetScope.$emit('$viewChange', value);
          }
        });
      });

      widgetScope.$watch(render);
      widgetScope.$render = render;

      function render() {
        var optionGroups = {'':[]}, // Temporary location for the option groups before we render them
            optionGroupNames = [''],
            optionGroupName,
            optionGroup,
            option,
            existingParent, existingOptions, existingOption,
            modelValue = widget.$modelValue,
            values = valuesFn(modelScope) || [],
            keys = keyName ? sortedKeys(values) : values,
            groupLength, length,
            groupIndex, index,
            optionScope = inherit(modelScope),
            selected,
            selectedSet = false, // nothing is selected yet
            lastElement,
            element;

        if (multiple) {
          selectedSet = new HashMap(modelValue);
        } else if (modelValue === null || nullOption) {
          // if we are not multiselect, and we are null then we have to add the nullOption
          optionGroups[''].push({selected:modelValue === null, id:'', label:''});
          selectedSet = true;
        }

        // We now build up the list of options we need (we merge later)
        for (index = 0; length = keys.length, index < length; index++) {
             optionScope[valueName] = values[keyName ? optionScope[keyName]=keys[index]:index];
             optionGroupName = groupByFn(optionScope) || '';
          if (!(optionGroup = optionGroups[optionGroupName])) {
            optionGroup = optionGroups[optionGroupName] = [];
            optionGroupNames.push(optionGroupName);
          }
          if (multiple) {
            selected = selectedSet.remove(valueFn(optionScope)) != undefined;
          } else {
            selected = modelValue === valueFn(optionScope);
            selectedSet = selectedSet || selected; // see if at least one item is selected
          }
          optionGroup.push({
            id: keyName ? keys[index] : index,   // either the index into array or key from object
            label: displayFn(optionScope) || '', // what will be seen by the user
            selected: selected                   // determine if we should be selected
          });
        }
        if (!multiple && !selectedSet) {
          // nothing was selected, we have to insert the undefined item
          optionGroups[''].unshift({id:'?', label:'', selected:true});
        }

        // Now we need to update the list of DOM nodes to match the optionGroups we computed above
        for (groupIndex = 0, groupLength = optionGroupNames.length;
             groupIndex < groupLength;
             groupIndex++) {
          // current option group name or '' if no group
          optionGroupName = optionGroupNames[groupIndex];

          // list of options for that group. (first item has the parent)
          optionGroup = optionGroups[optionGroupName];

          if (optionGroupsCache.length <= groupIndex) {
            // we need to grow the optionGroups
            existingParent = {
              element: optGroupTemplate.clone().attr('label', optionGroupName),
              label: optionGroup.label
            };
            existingOptions = [existingParent];
            optionGroupsCache.push(existingOptions);
            selectElement.append(existingParent.element);
          } else {
            existingOptions = optionGroupsCache[groupIndex];
            existingParent = existingOptions[0];  // either SELECT (no group) or OPTGROUP element

            // update the OPTGROUP label if not the same.
            if (existingParent.label != optionGroupName) {
              existingParent.element.attr('label', existingParent.label = optionGroupName);
            }
          }

          lastElement = null;  // start at the begining
          for(index = 0, length = optionGroup.length; index < length; index++) {
            option = optionGroup[index];
            if ((existingOption = existingOptions[index+1])) {
              // reuse elements
              lastElement = existingOption.element;
              if (existingOption.label !== option.label) {
                lastElement.text(existingOption.label = option.label);
              }
              if (existingOption.id !== option.id) {
                lastElement.val(existingOption.id = option.id);
              }
              if (existingOption.element.selected !== option.selected) {
                lastElement.prop('selected', (existingOption.selected = option.selected));
              }
            } else {
              // grow elements

              // if it's a null option
              if (option.id === '' && nullOption) {
                // put back the pre-compiled element
                element = nullOption;
              } else {
                // jQuery(v1.4.2) Bug: We should be able to chain the method calls, but
                // in this version of jQuery on some browser the .text() returns a string
                // rather then the element.
                (element = optionTemplate.clone())
                    .val(option.id)
                    .attr('selected', option.selected)
                    .text(option.label);
              }

              existingOptions.push(existingOption = {
                  element: element,
                  label: option.label,
                  id: option.id,
                  selected: option.selected
              });
              if (lastElement) {
                lastElement.after(element);
              } else {
                existingParent.element.append(element);
              }
              lastElement = element;
            }
          }
          // remove any excessive OPTIONs in a group
          index++; // increment since the existingOptions[0] is parent element not OPTION
          while(existingOptions.length > index) {
            existingOptions.pop().element.remove();
          }
        }
        // remove any excessive OPTGROUPs from select
        while(optionGroupsCache.length > groupIndex) {
          optionGroupsCache.pop()[0].element.remove();
        }
      };
    }
  }];
});
  //try to bind to jquery now so that one can write angular.element().read()
  //but we will rebind on bootstrap again.
  bindJQuery();

  publishExternalAPI(angular);

  jqLiteWrap(document).ready(function() {
    angularInit(document, bootstrap);
  });

})(window, document);
angular.element(document).find('head').append('<style type="text/css">@charset "UTF-8";[ng\\:cloak],.ng-cloak{display:none;}ng\\:form{display:block;}</style>');