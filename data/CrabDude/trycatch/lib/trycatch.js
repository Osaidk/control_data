var domain = require('domain')
  , path = require('path')
  , hookit = require('hookit')
  , FormatStackTrace = require('./FormatStackTrace')
  , formatErrorModule = require('./formatError')
  , formatErrorWithOptions = formatErrorModule.formatError
  , formatStackWithOptions = formatErrorModule.formatStack
  , normalizeError = formatErrorModule.normalizeError
  , addNonEnumerableValue = formatErrorModule.addNonEnumerableValue
  , delimitter = '\n    ----------------------------------------\n'
  , stackHolder = {}
  , defaultColors
  , defaultFileNameFilter
  , options

defaultColors = {
  'node': 'default'
, 'node_modules': 'cyan'
, 'default': 'red'
}

defaultFileNameFilter = [
  path.dirname(__filename)
, require.resolve('hookit')
, 'domain.js'
, 'Domain.emit'
]

options = {
  'long-stack-traces': false
, 'colors': defaultColors
, 'format': null
, 'filter': defaultFileNameFilter
}

function trycatch(tryFn, catchFn) {
  var parentDomain
    , isLST
    , parentStack
    , d

  if ('function' !== typeof tryFn || 'function' !== typeof catchFn) {
    throw new Error('tryFn and catchFn must be functions')
  }

  parentDomain = domain.active
  isLST = options['long-stack-traces']
  d = domain.create()

  if (isLST) {
    parentStack = trycatch.currentStack
    trycatch.currentStack = null
  }

  d.on('error', _trycatchOnError)
  trycatch.sameTick = true
  runInDomain(d, tryFn, trycatchit)
  trycatch.sameTick = false

  if (isLST) {
    trycatch.currentStack = parentStack
  }

  return d

  function _trycatchOnError(err) {
    err = normalizeError(err)
    if (Error.stackTraceLimit === 0) err.stack = err.originalStack

    if (!err.catchable) {
      // Most likely a domain "caught" error
      d.exit()
      throw err
    }

    if (err.caught) {
      addNonEnumerableValue(err, 'rethrown', true)
    } else addNonEnumerableValue(err, 'caught', true)

    if (isLST) {
      if (err.rethrown && err.parentStack) {
        err.stack += delimitter + err.parentStack
        err.parentStack = undefined
      }

      if (parentStack) {
        if (err.parentStack) err.parentStack = parentStack
        else {
          addNonEnumerableValue(err, 'parentStack', parentStack)
        }
      }
    }

    d.exit()
    handleException(err, parentDomain, catchFn)
  }
}

function Stack(unformattedStack, parentStack) {
  this.unformattedStack = unformattedStack
  this.parentStack = parentStack
}

Stack.prototype.toString = function() {
  // Format frames and chop off leading non-stack portion
  if (this.stack === undefined) {
    // When stackTraceLimit === 0, stack is empty
    this.stack = formatStack(this.unformattedStack.substr(16))
    this.unformattedStack = undefined
    this.parentStack = this.parentStack ? delimitter + this.parentStack : ''
  }
  return this.stack + this.parentStack
}

// Generate a new callback
// Ensure it runs in the same domain
function wrap(callback, name) {
  var isLST
    , stack
    , d
    , oldStack

  if ('function' !== typeof callback || callback && callback.name === '_trycatchOnError') return callback

  isLST = options['long-stack-traces']
  d = process.domain
  if (isLST) {
    oldStack = trycatch.currentStack
    stack = getUpdatedCurrentStack()
  }

  // Inherit from callback for when properties are added
  _trycatchNewCallback.__proto__ = callback
  _trycatchNewCallback._trycatchCurrentStack = stack
  return _trycatchNewCallback

  function _trycatchNewCallback() {
    // Don't stomp stack in synchronous EventEmitter case
    if (isLST && trycatch.currentStack !== oldStack) trycatch.currentStack = stack
    runInDomain(d, callback, trycatchit, this, arguments)
  }
}

function getUpdatedCurrentStack() {
  // MUST use Error.captureStackTrace to avoid stack filtering
  Error.captureStackTrace(stackHolder)
  return stackHolder.stack ? new Stack(stackHolder.stack, trycatch.currentStack) : ''
}

function runInDomain(d, tryFn, trycatchitFn, that, args) {
  var hasDomain = d && !d._disposed
  var enterExit = hasDomain && process.domain !== d

  enterExit && d.enter()
  var err = trycatchitFn(tryFn, that, args)
  enterExit && d.exit()
  if (err) {
    err = normalizeError(err)
    if (hasDomain) {
      d.emit('error', err)
    } else {
      handleException(err)
    }
  }
}

// To avoid V8 deopt
function trycatchit(tryFn, that, args) {
  try {
    // To avoid slow apply for common use
    switch(args ? args.length??: 0) {
    case 0:
      tryFn.call(that)
      break
    case 1:
      tryFn.call(that, args[0])
      break
    case 2:
      tryFn.call(that, args[0], args[1])
      break
    case 3:
      tryFn.call(that, args[0], args[1], args[2])
      break
    case 4:
      tryFn.call(that, args[0], args[1], args[2], args[3])
      break
    case 5:
      tryFn.call(that, args[0], args[1], args[2], args[3], args[4])
      break
    case 6:
      tryFn.call(that, args[0], args[1], args[2], args[3], args[4], args[5])
      break
    case 7:
      tryFn.call(that, args[0], args[1], args[2], args[3], args[4], args[5], args[6])
      break
    case 8:
      tryFn.call(that, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7])
      break
    case 9:
      tryFn.call(that, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8])
      break
    case 10:
      tryFn.call(that, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9])
      break
    default:
      tryFn.apply(that, args)
    }
  } catch(err) {
    return err
  }
}

function handleException(err, parentDomain, catchFn) {
  var caught
    , secondError

  if (!err.catchable) {
    // Unexpected error, core in undefined state, requires restart
    caught = process.emit('uncaughtException', err)
    // Otherwise crash the process
    if (!caught) {
      throw err
    }
    return
  }

  if (parentDomain) {
    runInDomain(parentDomain, catchFn, trycatchit, null, [err])
    return
  }

  if ('function' === typeof catchFn) {
    secondError = trycatchit(catchFn, null, [err])
    if (secondError) {
      handleException(secondError);
    }
    return
  }

  caught = process.emit('uncaughtApplicationException', err)
  if (!caught) {
    caught = process.emit('uncaughtException', err)
  }
  if (!caught) {
    throw err
  }
}

function formatError(err, stack) {
  return formatErrorWithOptions(err, stack
  , {
      lineFormatter: trycatch.format
    , colors: options.colors
    , filter: options.filter
    })
}

function formatStack(stack) {
  return formatStackWithOptions(stack
  , {
      lineFormatter: trycatch.format
    , colors: options.colors
    , filter: options.filter
    })
}

/* Config Logic */

function configure(opts) {
  if (null != opts['long-stack-traces']) {
    options['long-stack-traces'] = Boolean(opts['long-stack-traces'])

    // No longer necessary, but nice to have
    Error.stackTraceLimit = options['long-stack-traces'] ? Infinity  : 10
  }

  if (undefined !== opts.colors) {
    if (opts.colors === null) {
      options.colors = defaultColors
    } else if ('object' === typeof opts.colors) {
      if ('undefined' !== typeof opts.colors.node) {
        options.colors.node = opts.colors.node
      }
      if ('undefined' !== typeof opts.colors.node_modules) {
        options.colors.node_modules = opts.colors.node_modules
      }
      if ('undefined' !== typeof opts.colors.default) {
        options.colors.default = opts.colors.default
      }
    }
  }

  if ('undefined' !== typeof opts.format) {
    if ('function' === typeof opts.format) {
      trycatch.format = options.format = opts.format
    } else if (!Boolean(opts.format)) {
      trycatch.format = null
    }
  }

  if (undefined !== opts.filter) {
    if (null === opts.filter) {
      options.filter = defaultFileNameFilter
    } else if (Array.isArray(opts.filter)) {
      options.filter = defaultFileNameFilter.concat(opts.filter)
    }
  }

  return this
}

Error.prepareStackTrace = prepareStackTrace
function prepareStackTrace(err, frames) {
  var stack = FormatStackTrace.call(this, err, frames)
    , currentStack
    , i, l

  if (err === stackHolder) return stack

  stack = formatError(err, stack)
  if (options['long-stack-traces']) {
    if (!trycatch.sameTick) {
      for (i=0, l=frames.length; i<l; i++) {
        if ('_trycatchNewCallback' === frames[i].getFunctionName()) {
          // In case long-stack-traces were toggled
          currentStack = frames[i].getFunction()._trycatchCurrentStack
          stack += currentStack ? delimitter + frames[i].getFunction()._trycatchCurrentStack : ''
          break
        }
      }
    } else if (trycatch.currentStack) {
      stack += delimitter + trycatch.currentStack
    }
  }
  return stack
}

// Pass callback wrapping function to hookit
hookit(wrap)

trycatch.configure = configure
trycatch.format = null

module.exports = trycatch
