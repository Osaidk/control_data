/**
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Utilities and constants shared by the entire GF library.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('gf');


/**
 * GF version identifier.
 * Used on the network to identify this GF library.
 * @const
 * @type {number}
 */
gf.VERSION = 1;


/**
 * @define {boolean} True if the runtime is being compiled in server mode.
 * This will exclude all types and features that are not supported on servers
 * (or workers), such as audio/input/etc.
 */
gf.SERVER = false;


/**
 * True if the runtime is being compiled in client mode.
 * @const
 * @type {boolean}
 */
gf.CLIENT = !gf.SERVER;


/**
 * @define {boolean} True if running under node. Guard all node code with this
 * define to ensure it does not leak into client/worker code.
 */
gf.NODE = false;


/**
 * @define {string} Relative path from where the code is executing to where the
 * bin/ folder can be found.
 * Resource paths generated by the content pipeline will use this as their base
 * path.
 */
gf.BIN_PATH = '../';


/**
 * @define {boolean} Whether the build client/server communication channel is
 * supported.
 * Release builds should set this to false.
 */
gf.BUILD_CLIENT = true;


// Define a global 'gfdefines' object with any of the above defines to
// override their values in debug mode
if (!COMPILED && goog.global['gfdefines']) {
  var gfd = goog.global['gfdefines'];
  var gfr = goog.global['gf'];
  gfr['SERVER'] = goog.isDef(gfd['SERVER']) ? gfd['SERVER'] : gf.SERVER;
  gfr['CLIENT'] = !gfr['SERVER'];
  gfr['NODE'] = goog.isDef(gfd['NODE']) ? gfd['NODE'] : gf.NODE;
  gfr['BIN_PATH'] = goog.isDef(gfd['BIN_PATH']) ? gfd['BIN_PATH'] : gf.BIN_PATH;
  gfr['BUILD_CLIENT'] = goog.isDef(gfd['BUILD_CLIENT']) ?
      gfd['BUILD_CLIENT'] : gf.BUILD_CLIENT;
}


/**
 * Create a high performance time function from window.performance, if present.
 * @return {number} A time, in ms.
 * @private
 */
gf.performanceNow_ = (function() {
  var performance = goog.global['performance'];
  if (performance && performance['now']) {
    return function() {
      return performance['now']();
    };
  } else if (performance && performance['webkitNow']) {
    return function() {
      return performance['webkitNow']();
    };
  }
  return undefined;
})();


/**
 * Returns a non-wall time timestamp in milliseconds.
 * If available this will use a high precision timer. Otherwise it will fall
 * back to the default browser time.
 *
 * The time value is relative to page navigation, not wall time. Only use it for
 * relative measurements.
 *
 * @return {number} A monotonically increasing timer with sub-millisecond
 *      resolution (if supported).
 */
gf.now = (function() {
  if (gf.NODE) {
    try {
      var microtime = require('microtime');
      return function gfNowMicrotime() {
        return microtime['nowDouble']() * 1000;
      };
    } catch (e) {
      var hrtime = goog.global['process']['hrtime'];
      return function gfNowHrtime() {
        var timeValue = hrtime();
        return (timeValue[0] * 1000) + timeValue[1] / 1000000;
      };
    }
  }

  // This dance is a little silly, but calling off of the closure object is
  // 2x+ faster than dereferencing the global and using a direct call instead of
  // a .call() is 2x+ on top of that.
  if (gf.performanceNow_) {
    return gf.performanceNow_;
  } else {
    return Date.now;
  }
})();