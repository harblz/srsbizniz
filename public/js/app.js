webpackJsonp([0],[
/* 0 */,
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
  * vue-router v2.7.0
  * (c) 2017 Evan You
  * @license MIT
  */
/*  */

function assert (condition, message) {
  if (!condition) {
    throw new Error(("[vue-router] " + message))
  }
}

function warn (condition, message) {
  if (process.env.NODE_ENV !== 'production' && !condition) {
    typeof console !== 'undefined' && console.warn(("[vue-router] " + message));
  }
}

function isError (err) {
  return Object.prototype.toString.call(err).indexOf('Error') > -1
}

var View = {
  name: 'router-view',
  functional: true,
  props: {
    name: {
      type: String,
      default: 'default'
    }
  },
  render: function render (_, ref) {
    var props = ref.props;
    var children = ref.children;
    var parent = ref.parent;
    var data = ref.data;

    data.routerView = true;

    // directly use parent context's createElement() function
    // so that components rendered by router-view can resolve named slots
    var h = parent.$createElement;
    var name = props.name;
    var route = parent.$route;
    var cache = parent._routerViewCache || (parent._routerViewCache = {});

    // determine current view depth, also check to see if the tree
    // has been toggled inactive but kept-alive.
    var depth = 0;
    var inactive = false;
    while (parent && parent._routerRoot !== parent) {
      if (parent.$vnode && parent.$vnode.data.routerView) {
        depth++;
      }
      if (parent._inactive) {
        inactive = true;
      }
      parent = parent.$parent;
    }
    data.routerViewDepth = depth;

    // render previous view if the tree is inactive and kept-alive
    if (inactive) {
      return h(cache[name], data, children)
    }

    var matched = route.matched[depth];
    // render empty node if no matched route
    if (!matched) {
      cache[name] = null;
      return h()
    }

    var component = cache[name] = matched.components[name];

    // attach instance registration hook
    // this will be called in the instance's injected lifecycle hooks
    data.registerRouteInstance = function (vm, val) {
      // val could be undefined for unregistration
      var current = matched.instances[name];
      if (
        (val && current !== vm) ||
        (!val && current === vm)
      ) {
        matched.instances[name] = val;
      }
    }

    // also regiseter instance in prepatch hook
    // in case the same component instance is reused across different routes
    ;(data.hook || (data.hook = {})).prepatch = function (_, vnode) {
      matched.instances[name] = vnode.componentInstance;
    };

    // resolve props
    data.props = resolveProps(route, matched.props && matched.props[name]);

    return h(component, data, children)
  }
};

function resolveProps (route, config) {
  switch (typeof config) {
    case 'undefined':
      return
    case 'object':
      return config
    case 'function':
      return config(route)
    case 'boolean':
      return config ? route.params : undefined
    default:
      if (process.env.NODE_ENV !== 'production') {
        warn(
          false,
          "props in \"" + (route.path) + "\" is a " + (typeof config) + ", " +
          "expecting an object, function or boolean."
        );
      }
  }
}

/*  */

var encodeReserveRE = /[!'()*]/g;
var encodeReserveReplacer = function (c) { return '%' + c.charCodeAt(0).toString(16); };
var commaRE = /%2C/g;

// fixed encodeURIComponent which is more conformant to RFC3986:
// - escapes [!'()*]
// - preserve commas
var encode = function (str) { return encodeURIComponent(str)
  .replace(encodeReserveRE, encodeReserveReplacer)
  .replace(commaRE, ','); };

var decode = decodeURIComponent;

function resolveQuery (
  query,
  extraQuery,
  _parseQuery
) {
  if ( extraQuery === void 0 ) extraQuery = {};

  var parse = _parseQuery || parseQuery;
  var parsedQuery;
  try {
    parsedQuery = parse(query || '');
  } catch (e) {
    process.env.NODE_ENV !== 'production' && warn(false, e.message);
    parsedQuery = {};
  }
  for (var key in extraQuery) {
    var val = extraQuery[key];
    parsedQuery[key] = Array.isArray(val) ? val.slice() : val;
  }
  return parsedQuery
}

function parseQuery (query) {
  var res = {};

  query = query.trim().replace(/^(\?|#|&)/, '');

  if (!query) {
    return res
  }

  query.split('&').forEach(function (param) {
    var parts = param.replace(/\+/g, ' ').split('=');
    var key = decode(parts.shift());
    var val = parts.length > 0
      ? decode(parts.join('='))
      : null;

    if (res[key] === undefined) {
      res[key] = val;
    } else if (Array.isArray(res[key])) {
      res[key].push(val);
    } else {
      res[key] = [res[key], val];
    }
  });

  return res
}

function stringifyQuery (obj) {
  var res = obj ? Object.keys(obj).map(function (key) {
    var val = obj[key];

    if (val === undefined) {
      return ''
    }

    if (val === null) {
      return encode(key)
    }

    if (Array.isArray(val)) {
      var result = [];
      val.forEach(function (val2) {
        if (val2 === undefined) {
          return
        }
        if (val2 === null) {
          result.push(encode(key));
        } else {
          result.push(encode(key) + '=' + encode(val2));
        }
      });
      return result.join('&')
    }

    return encode(key) + '=' + encode(val)
  }).filter(function (x) { return x.length > 0; }).join('&') : null;
  return res ? ("?" + res) : ''
}

/*  */


var trailingSlashRE = /\/?$/;

function createRoute (
  record,
  location,
  redirectedFrom,
  router
) {
  var stringifyQuery$$1 = router && router.options.stringifyQuery;
  var route = {
    name: location.name || (record && record.name),
    meta: (record && record.meta) || {},
    path: location.path || '/',
    hash: location.hash || '',
    query: location.query || {},
    params: location.params || {},
    fullPath: getFullPath(location, stringifyQuery$$1),
    matched: record ? formatMatch(record) : []
  };
  if (redirectedFrom) {
    route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery$$1);
  }
  return Object.freeze(route)
}

// the starting route that represents the initial state
var START = createRoute(null, {
  path: '/'
});

function formatMatch (record) {
  var res = [];
  while (record) {
    res.unshift(record);
    record = record.parent;
  }
  return res
}

function getFullPath (
  ref,
  _stringifyQuery
) {
  var path = ref.path;
  var query = ref.query; if ( query === void 0 ) query = {};
  var hash = ref.hash; if ( hash === void 0 ) hash = '';

  var stringify = _stringifyQuery || stringifyQuery;
  return (path || '/') + stringify(query) + hash
}

function isSameRoute (a, b) {
  if (b === START) {
    return a === b
  } else if (!b) {
    return false
  } else if (a.path && b.path) {
    return (
      a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query)
    )
  } else if (a.name && b.name) {
    return (
      a.name === b.name &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query) &&
      isObjectEqual(a.params, b.params)
    )
  } else {
    return false
  }
}

function isObjectEqual (a, b) {
  if ( a === void 0 ) a = {};
  if ( b === void 0 ) b = {};

  var aKeys = Object.keys(a);
  var bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every(function (key) {
    var aVal = a[key];
    var bVal = b[key];
    // check nested equality
    if (typeof aVal === 'object' && typeof bVal === 'object') {
      return isObjectEqual(aVal, bVal)
    }
    return String(aVal) === String(bVal)
  })
}

function isIncludedRoute (current, target) {
  return (
    current.path.replace(trailingSlashRE, '/').indexOf(
      target.path.replace(trailingSlashRE, '/')
    ) === 0 &&
    (!target.hash || current.hash === target.hash) &&
    queryIncludes(current.query, target.query)
  )
}

function queryIncludes (current, target) {
  for (var key in target) {
    if (!(key in current)) {
      return false
    }
  }
  return true
}

/*  */

// work around weird flow bug
var toTypes = [String, Object];
var eventTypes = [String, Array];

var Link = {
  name: 'router-link',
  props: {
    to: {
      type: toTypes,
      required: true
    },
    tag: {
      type: String,
      default: 'a'
    },
    exact: Boolean,
    append: Boolean,
    replace: Boolean,
    activeClass: String,
    exactActiveClass: String,
    event: {
      type: eventTypes,
      default: 'click'
    }
  },
  render: function render (h) {
    var this$1 = this;

    var router = this.$router;
    var current = this.$route;
    var ref = router.resolve(this.to, current, this.append);
    var location = ref.location;
    var route = ref.route;
    var href = ref.href;

    var classes = {};
    var globalActiveClass = router.options.linkActiveClass;
    var globalExactActiveClass = router.options.linkExactActiveClass;
    // Support global empty active class
    var activeClassFallback = globalActiveClass == null
            ? 'router-link-active'
            : globalActiveClass;
    var exactActiveClassFallback = globalExactActiveClass == null
            ? 'router-link-exact-active'
            : globalExactActiveClass;
    var activeClass = this.activeClass == null
            ? activeClassFallback
            : this.activeClass;
    var exactActiveClass = this.exactActiveClass == null
            ? exactActiveClassFallback
            : this.exactActiveClass;
    var compareTarget = location.path
      ? createRoute(null, location, null, router)
      : route;

    classes[exactActiveClass] = isSameRoute(current, compareTarget);
    classes[activeClass] = this.exact
      ? classes[exactActiveClass]
      : isIncludedRoute(current, compareTarget);

    var handler = function (e) {
      if (guardEvent(e)) {
        if (this$1.replace) {
          router.replace(location);
        } else {
          router.push(location);
        }
      }
    };

    var on = { click: guardEvent };
    if (Array.isArray(this.event)) {
      this.event.forEach(function (e) { on[e] = handler; });
    } else {
      on[this.event] = handler;
    }

    var data = {
      class: classes
    };

    if (this.tag === 'a') {
      data.on = on;
      data.attrs = { href: href };
    } else {
      // find the first <a> child and apply listener and href
      var a = findAnchor(this.$slots.default);
      if (a) {
        // in case the <a> is a static node
        a.isStatic = false;
        var extend = _Vue.util.extend;
        var aData = a.data = extend({}, a.data);
        aData.on = on;
        var aAttrs = a.data.attrs = extend({}, a.data.attrs);
        aAttrs.href = href;
      } else {
        // doesn't have <a> child, apply listener to self
        data.on = on;
      }
    }

    return h(this.tag, data, this.$slots.default)
  }
};

function guardEvent (e) {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) { return }
  // don't redirect when preventDefault called
  if (e.defaultPrevented) { return }
  // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) { return }
  // don't redirect if `target="_blank"`
  if (e.currentTarget && e.currentTarget.getAttribute) {
    var target = e.currentTarget.getAttribute('target');
    if (/\b_blank\b/i.test(target)) { return }
  }
  // this may be a Weex event which doesn't have this method
  if (e.preventDefault) {
    e.preventDefault();
  }
  return true
}

function findAnchor (children) {
  if (children) {
    var child;
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      if (child.tag === 'a') {
        return child
      }
      if (child.children && (child = findAnchor(child.children))) {
        return child
      }
    }
  }
}

var _Vue;

function install (Vue) {
  if (install.installed) { return }
  install.installed = true;

  _Vue = Vue;

  var isDef = function (v) { return v !== undefined; };

  var registerInstance = function (vm, callVal) {
    var i = vm.$options._parentVnode;
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal);
    }
  };

  Vue.mixin({
    beforeCreate: function beforeCreate () {
      if (isDef(this.$options.router)) {
        this._routerRoot = this;
        this._router = this.$options.router;
        this._router.init(this);
        Vue.util.defineReactive(this, '_route', this._router.history.current);
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
      }
      registerInstance(this, this);
    },
    destroyed: function destroyed () {
      registerInstance(this);
    }
  });

  Object.defineProperty(Vue.prototype, '$router', {
    get: function get () { return this._routerRoot._router }
  });

  Object.defineProperty(Vue.prototype, '$route', {
    get: function get () { return this._routerRoot._route }
  });

  Vue.component('router-view', View);
  Vue.component('router-link', Link);

  var strats = Vue.config.optionMergeStrategies;
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created;
}

/*  */

var inBrowser = typeof window !== 'undefined';

/*  */

function resolvePath (
  relative,
  base,
  append
) {
  var firstChar = relative.charAt(0);
  if (firstChar === '/') {
    return relative
  }

  if (firstChar === '?' || firstChar === '#') {
    return base + relative
  }

  var stack = base.split('/');

  // remove trailing segment if:
  // - not appending
  // - appending to trailing slash (last segment is empty)
  if (!append || !stack[stack.length - 1]) {
    stack.pop();
  }

  // resolve relative path
  var segments = relative.replace(/^\//, '').split('/');
  for (var i = 0; i < segments.length; i++) {
    var segment = segments[i];
    if (segment === '..') {
      stack.pop();
    } else if (segment !== '.') {
      stack.push(segment);
    }
  }

  // ensure leading slash
  if (stack[0] !== '') {
    stack.unshift('');
  }

  return stack.join('/')
}

function parsePath (path) {
  var hash = '';
  var query = '';

  var hashIndex = path.indexOf('#');
  if (hashIndex >= 0) {
    hash = path.slice(hashIndex);
    path = path.slice(0, hashIndex);
  }

  var queryIndex = path.indexOf('?');
  if (queryIndex >= 0) {
    query = path.slice(queryIndex + 1);
    path = path.slice(0, queryIndex);
  }

  return {
    path: path,
    query: query,
    hash: hash
  }
}

function cleanPath (path) {
  return path.replace(/\/\//g, '/')
}

var index$1 = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

/**
 * Expose `pathToRegexp`.
 */
var index = pathToRegexp;
var parse_1 = parse;
var compile_1 = compile;
var tokensToFunction_1 = tokensToFunction;
var tokensToRegExp_1 = tokensToRegExp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g');

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse (str, options) {
  var tokens = [];
  var key = 0;
  var index = 0;
  var path = '';
  var defaultDelimiter = options && options.delimiter || '/';
  var res;

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0];
    var escaped = res[1];
    var offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      continue
    }

    var next = str[index];
    var prefix = res[2];
    var name = res[3];
    var capture = res[4];
    var group = res[5];
    var modifier = res[6];
    var asterisk = res[7];

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = '';
    }

    var partial = prefix != null && next != null && next !== prefix;
    var repeat = modifier === '+' || modifier === '*';
    var optional = modifier === '?' || modifier === '*';
    var delimiter = res[2] || defaultDelimiter;
    var pattern = capture || group;

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      asterisk: !!asterisk,
      pattern: pattern ? escapeGroup(pattern) : (asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?')
    });
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index);
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path);
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile (str, options) {
  return tokensToFunction(parse(str, options))
}

/**
 * Prettier encoding of URI path segments.
 *
 * @param  {string}
 * @return {string}
 */
function encodeURIComponentPretty (str) {
  return encodeURI(str).replace(/[\/?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
 *
 * @param  {string}
 * @return {string}
 */
function encodeAsterisk (str) {
  return encodeURI(str).replace(/[?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length);

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
    }
  }

  return function (obj, opts) {
    var path = '';
    var data = obj || {};
    var options = opts || {};
    var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        path += token;

        continue
      }

      var value = data[token.name];
      var segment;

      if (value == null) {
        if (token.optional) {
          // Prepend partial segment prefixes.
          if (token.partial) {
            path += token.prefix;
          }

          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (index$1(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received `' + JSON.stringify(value) + '`')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j]);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received `' + JSON.stringify(segment) + '`')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }

        continue
      }

      segment = token.asterisk ? encodeAsterisk(value) : encode(value);

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment;
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {!RegExp} re
 * @param  {Array}   keys
 * @return {!RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {!Array}  keys
 * @return {!RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        asterisk: false,
        pattern: null
      });
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array}   keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = [];

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {!Array}  keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function stringToRegexp (path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}          tokens
 * @param  {(Array|Object)=} keys
 * @param  {Object=}         options
 * @return {!RegExp}
 */
function tokensToRegExp (tokens, keys, options) {
  if (!index$1(keys)) {
    options = /** @type {!Object} */ (keys || options);
    keys = [];
  }

  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var route = '';

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];

    if (typeof token === 'string') {
      route += escapeString(token);
    } else {
      var prefix = escapeString(token.prefix);
      var capture = '(?:' + token.pattern + ')';

      keys.push(token);

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*';
      }

      if (token.optional) {
        if (!token.partial) {
          capture = '(?:' + prefix + '(' + capture + '))?';
        } else {
          capture = prefix + '(' + capture + ')?';
        }
      } else {
        capture = prefix + '(' + capture + ')';
      }

      route += capture;
    }
  }

  var delimiter = escapeString(options.delimiter || '/');
  var endsWithDelimiter = route.slice(-delimiter.length) === delimiter;

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithDelimiter ? route.slice(0, -delimiter.length) : route) + '(?:' + delimiter + '(?=$))?';
  }

  if (end) {
    route += '$';
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithDelimiter ? '' : '(?=' + delimiter + '|$)';
  }

  return attachKeys(new RegExp('^' + route, flags(options)), keys)
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {(Array|Object)=}       keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp (path, keys, options) {
  if (!index$1(keys)) {
    options = /** @type {!Object} */ (keys || options);
    keys = [];
  }

  options = options || {};

  if (path instanceof RegExp) {
    return regexpToRegexp(path, /** @type {!Array} */ (keys))
  }

  if (index$1(path)) {
    return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options)
  }

  return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options)
}

index.parse = parse_1;
index.compile = compile_1;
index.tokensToFunction = tokensToFunction_1;
index.tokensToRegExp = tokensToRegExp_1;

/*  */

var regexpCompileCache = Object.create(null);

function fillParams (
  path,
  params,
  routeMsg
) {
  try {
    var filler =
      regexpCompileCache[path] ||
      (regexpCompileCache[path] = index.compile(path));
    return filler(params || {}, { pretty: true })
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      warn(false, ("missing param for " + routeMsg + ": " + (e.message)));
    }
    return ''
  }
}

/*  */

function createRouteMap (
  routes,
  oldPathList,
  oldPathMap,
  oldNameMap
) {
  // the path list is used to control path matching priority
  var pathList = oldPathList || [];
  var pathMap = oldPathMap || Object.create(null);
  var nameMap = oldNameMap || Object.create(null);

  routes.forEach(function (route) {
    addRouteRecord(pathList, pathMap, nameMap, route);
  });

  // ensure wildcard routes are always at the end
  for (var i = 0, l = pathList.length; i < l; i++) {
    if (pathList[i] === '*') {
      pathList.push(pathList.splice(i, 1)[0]);
      l--;
      i--;
    }
  }

  return {
    pathList: pathList,
    pathMap: pathMap,
    nameMap: nameMap
  }
}

function addRouteRecord (
  pathList,
  pathMap,
  nameMap,
  route,
  parent,
  matchAs
) {
  var path = route.path;
  var name = route.name;
  if (process.env.NODE_ENV !== 'production') {
    assert(path != null, "\"path\" is required in a route configuration.");
    assert(
      typeof route.component !== 'string',
      "route config \"component\" for path: " + (String(path || name)) + " cannot be a " +
      "string id. Use an actual component instead."
    );
  }

  var normalizedPath = normalizePath(path, parent);
  var pathToRegexpOptions = route.pathToRegexpOptions || {};

  if (typeof route.caseSensitive === 'boolean') {
    pathToRegexpOptions.sensitive = route.caseSensitive;
  }

  var record = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
    components: route.components || { default: route.component },
    instances: {},
    name: name,
    parent: parent,
    matchAs: matchAs,
    redirect: route.redirect,
    beforeEnter: route.beforeEnter,
    meta: route.meta || {},
    props: route.props == null
      ? {}
      : route.components
        ? route.props
        : { default: route.props }
  };

  if (route.children) {
    // Warn if route is named, does not redirect and has a default child route.
    // If users navigate to this route by name, the default child will
    // not be rendered (GH Issue #629)
    if (process.env.NODE_ENV !== 'production') {
      if (route.name && !route.redirect && route.children.some(function (child) { return /^\/?$/.test(child.path); })) {
        warn(
          false,
          "Named Route '" + (route.name) + "' has a default child route. " +
          "When navigating to this named route (:to=\"{name: '" + (route.name) + "'\"), " +
          "the default child route will not be rendered. Remove the name from " +
          "this route and use the name of the default child route for named " +
          "links instead."
        );
      }
    }
    route.children.forEach(function (child) {
      var childMatchAs = matchAs
        ? cleanPath((matchAs + "/" + (child.path)))
        : undefined;
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs);
    });
  }

  if (route.alias !== undefined) {
    var aliases = Array.isArray(route.alias)
      ? route.alias
      : [route.alias];

    aliases.forEach(function (alias) {
      var aliasRoute = {
        path: alias,
        children: route.children
      };
      addRouteRecord(
        pathList,
        pathMap,
        nameMap,
        aliasRoute,
        parent,
        record.path || '/' // matchAs
      );
    });
  }

  if (!pathMap[record.path]) {
    pathList.push(record.path);
    pathMap[record.path] = record;
  }

  if (name) {
    if (!nameMap[name]) {
      nameMap[name] = record;
    } else if (process.env.NODE_ENV !== 'production' && !matchAs) {
      warn(
        false,
        "Duplicate named routes definition: " +
        "{ name: \"" + name + "\", path: \"" + (record.path) + "\" }"
      );
    }
  }
}

function compileRouteRegex (path, pathToRegexpOptions) {
  var regex = index(path, [], pathToRegexpOptions);
  if (process.env.NODE_ENV !== 'production') {
    var keys = {};
    regex.keys.forEach(function (key) {
      warn(!keys[key.name], ("Duplicate param keys in route with path: \"" + path + "\""));
      keys[key.name] = true;
    });
  }
  return regex
}

function normalizePath (path, parent) {
  path = path.replace(/\/$/, '');
  if (path[0] === '/') { return path }
  if (parent == null) { return path }
  return cleanPath(((parent.path) + "/" + path))
}

/*  */


function normalizeLocation (
  raw,
  current,
  append,
  router
) {
  var next = typeof raw === 'string' ? { path: raw } : raw;
  // named target
  if (next.name || next._normalized) {
    return next
  }

  // relative params
  if (!next.path && next.params && current) {
    next = assign({}, next);
    next._normalized = true;
    var params = assign(assign({}, current.params), next.params);
    if (current.name) {
      next.name = current.name;
      next.params = params;
    } else if (current.matched.length) {
      var rawPath = current.matched[current.matched.length - 1].path;
      next.path = fillParams(rawPath, params, ("path " + (current.path)));
    } else if (process.env.NODE_ENV !== 'production') {
      warn(false, "relative params navigation requires a current route.");
    }
    return next
  }

  var parsedPath = parsePath(next.path || '');
  var basePath = (current && current.path) || '/';
  var path = parsedPath.path
    ? resolvePath(parsedPath.path, basePath, append || next.append)
    : basePath;

  var query = resolveQuery(
    parsedPath.query,
    next.query,
    router && router.options.parseQuery
  );

  var hash = next.hash || parsedPath.hash;
  if (hash && hash.charAt(0) !== '#') {
    hash = "#" + hash;
  }

  return {
    _normalized: true,
    path: path,
    query: query,
    hash: hash
  }
}

function assign (a, b) {
  for (var key in b) {
    a[key] = b[key];
  }
  return a
}

/*  */


function createMatcher (
  routes,
  router
) {
  var ref = createRouteMap(routes);
  var pathList = ref.pathList;
  var pathMap = ref.pathMap;
  var nameMap = ref.nameMap;

  function addRoutes (routes) {
    createRouteMap(routes, pathList, pathMap, nameMap);
  }

  function match (
    raw,
    currentRoute,
    redirectedFrom
  ) {
    var location = normalizeLocation(raw, currentRoute, false, router);
    var name = location.name;

    if (name) {
      var record = nameMap[name];
      if (process.env.NODE_ENV !== 'production') {
        warn(record, ("Route with name '" + name + "' does not exist"));
      }
      if (!record) { return _createRoute(null, location) }
      var paramNames = record.regex.keys
        .filter(function (key) { return !key.optional; })
        .map(function (key) { return key.name; });

      if (typeof location.params !== 'object') {
        location.params = {};
      }

      if (currentRoute && typeof currentRoute.params === 'object') {
        for (var key in currentRoute.params) {
          if (!(key in location.params) && paramNames.indexOf(key) > -1) {
            location.params[key] = currentRoute.params[key];
          }
        }
      }

      if (record) {
        location.path = fillParams(record.path, location.params, ("named route \"" + name + "\""));
        return _createRoute(record, location, redirectedFrom)
      }
    } else if (location.path) {
      location.params = {};
      for (var i = 0; i < pathList.length; i++) {
        var path = pathList[i];
        var record$1 = pathMap[path];
        if (matchRoute(record$1.regex, location.path, location.params)) {
          return _createRoute(record$1, location, redirectedFrom)
        }
      }
    }
    // no match
    return _createRoute(null, location)
  }

  function redirect (
    record,
    location
  ) {
    var originalRedirect = record.redirect;
    var redirect = typeof originalRedirect === 'function'
        ? originalRedirect(createRoute(record, location, null, router))
        : originalRedirect;

    if (typeof redirect === 'string') {
      redirect = { path: redirect };
    }

    if (!redirect || typeof redirect !== 'object') {
      if (process.env.NODE_ENV !== 'production') {
        warn(
          false, ("invalid redirect option: " + (JSON.stringify(redirect)))
        );
      }
      return _createRoute(null, location)
    }

    var re = redirect;
    var name = re.name;
    var path = re.path;
    var query = location.query;
    var hash = location.hash;
    var params = location.params;
    query = re.hasOwnProperty('query') ? re.query : query;
    hash = re.hasOwnProperty('hash') ? re.hash : hash;
    params = re.hasOwnProperty('params') ? re.params : params;

    if (name) {
      // resolved named direct
      var targetRecord = nameMap[name];
      if (process.env.NODE_ENV !== 'production') {
        assert(targetRecord, ("redirect failed: named route \"" + name + "\" not found."));
      }
      return match({
        _normalized: true,
        name: name,
        query: query,
        hash: hash,
        params: params
      }, undefined, location)
    } else if (path) {
      // 1. resolve relative redirect
      var rawPath = resolveRecordPath(path, record);
      // 2. resolve params
      var resolvedPath = fillParams(rawPath, params, ("redirect route with path \"" + rawPath + "\""));
      // 3. rematch with existing query and hash
      return match({
        _normalized: true,
        path: resolvedPath,
        query: query,
        hash: hash
      }, undefined, location)
    } else {
      if (process.env.NODE_ENV !== 'production') {
        warn(false, ("invalid redirect option: " + (JSON.stringify(redirect))));
      }
      return _createRoute(null, location)
    }
  }

  function alias (
    record,
    location,
    matchAs
  ) {
    var aliasedPath = fillParams(matchAs, location.params, ("aliased route with path \"" + matchAs + "\""));
    var aliasedMatch = match({
      _normalized: true,
      path: aliasedPath
    });
    if (aliasedMatch) {
      var matched = aliasedMatch.matched;
      var aliasedRecord = matched[matched.length - 1];
      location.params = aliasedMatch.params;
      return _createRoute(aliasedRecord, location)
    }
    return _createRoute(null, location)
  }

  function _createRoute (
    record,
    location,
    redirectedFrom
  ) {
    if (record && record.redirect) {
      return redirect(record, redirectedFrom || location)
    }
    if (record && record.matchAs) {
      return alias(record, location, record.matchAs)
    }
    return createRoute(record, location, redirectedFrom, router)
  }

  return {
    match: match,
    addRoutes: addRoutes
  }
}

function matchRoute (
  regex,
  path,
  params
) {
  var m = path.match(regex);

  if (!m) {
    return false
  } else if (!params) {
    return true
  }

  for (var i = 1, len = m.length; i < len; ++i) {
    var key = regex.keys[i - 1];
    var val = typeof m[i] === 'string' ? decodeURIComponent(m[i]) : m[i];
    if (key) {
      params[key.name] = val;
    }
  }

  return true
}

function resolveRecordPath (path, record) {
  return resolvePath(path, record.parent ? record.parent.path : '/', true)
}

/*  */


var positionStore = Object.create(null);

function setupScroll () {
  window.addEventListener('popstate', function (e) {
    saveScrollPosition();
    if (e.state && e.state.key) {
      setStateKey(e.state.key);
    }
  });
}

function handleScroll (
  router,
  to,
  from,
  isPop
) {
  if (!router.app) {
    return
  }

  var behavior = router.options.scrollBehavior;
  if (!behavior) {
    return
  }

  if (process.env.NODE_ENV !== 'production') {
    assert(typeof behavior === 'function', "scrollBehavior must be a function");
  }

  // wait until re-render finishes before scrolling
  router.app.$nextTick(function () {
    var position = getScrollPosition();
    var shouldScroll = behavior(to, from, isPop ? position : null);
    if (!shouldScroll) {
      return
    }
    var isObject = typeof shouldScroll === 'object';
    if (isObject && typeof shouldScroll.selector === 'string') {
      var el = document.querySelector(shouldScroll.selector);
      if (el) {
        var offset = shouldScroll.offset && typeof shouldScroll.offset === 'object' ? shouldScroll.offset : {};
        offset = normalizeOffset(offset);
        position = getElementPosition(el, offset);
      } else if (isValidPosition(shouldScroll)) {
        position = normalizePosition(shouldScroll);
      }
    } else if (isObject && isValidPosition(shouldScroll)) {
      position = normalizePosition(shouldScroll);
    }

    if (position) {
      window.scrollTo(position.x, position.y);
    }
  });
}

function saveScrollPosition () {
  var key = getStateKey();
  if (key) {
    positionStore[key] = {
      x: window.pageXOffset,
      y: window.pageYOffset
    };
  }
}

function getScrollPosition () {
  var key = getStateKey();
  if (key) {
    return positionStore[key]
  }
}

function getElementPosition (el, offset) {
  var docEl = document.documentElement;
  var docRect = docEl.getBoundingClientRect();
  var elRect = el.getBoundingClientRect();
  return {
    x: elRect.left - docRect.left - offset.x,
    y: elRect.top - docRect.top - offset.y
  }
}

function isValidPosition (obj) {
  return isNumber(obj.x) || isNumber(obj.y)
}

function normalizePosition (obj) {
  return {
    x: isNumber(obj.x) ? obj.x : window.pageXOffset,
    y: isNumber(obj.y) ? obj.y : window.pageYOffset
  }
}

function normalizeOffset (obj) {
  return {
    x: isNumber(obj.x) ? obj.x : 0,
    y: isNumber(obj.y) ? obj.y : 0
  }
}

function isNumber (v) {
  return typeof v === 'number'
}

/*  */

var supportsPushState = inBrowser && (function () {
  var ua = window.navigator.userAgent;

  if (
    (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
    ua.indexOf('Mobile Safari') !== -1 &&
    ua.indexOf('Chrome') === -1 &&
    ua.indexOf('Windows Phone') === -1
  ) {
    return false
  }

  return window.history && 'pushState' in window.history
})();

// use User Timing api (if present) for more accurate key precision
var Time = inBrowser && window.performance && window.performance.now
  ? window.performance
  : Date;

var _key = genKey();

function genKey () {
  return Time.now().toFixed(3)
}

function getStateKey () {
  return _key
}

function setStateKey (key) {
  _key = key;
}

function pushState (url, replace) {
  saveScrollPosition();
  // try...catch the pushState call to get around Safari
  // DOM Exception 18 where it limits to 100 pushState calls
  var history = window.history;
  try {
    if (replace) {
      history.replaceState({ key: _key }, '', url);
    } else {
      _key = genKey();
      history.pushState({ key: _key }, '', url);
    }
  } catch (e) {
    window.location[replace ? 'replace' : 'assign'](url);
  }
}

function replaceState (url) {
  pushState(url, true);
}

/*  */

function runQueue (queue, fn, cb) {
  var step = function (index) {
    if (index >= queue.length) {
      cb();
    } else {
      if (queue[index]) {
        fn(queue[index], function () {
          step(index + 1);
        });
      } else {
        step(index + 1);
      }
    }
  };
  step(0);
}

/*  */

function resolveAsyncComponents (matched) {
  return function (to, from, next) {
    var hasAsync = false;
    var pending = 0;
    var error = null;

    flatMapComponents(matched, function (def, _, match, key) {
      // if it's a function and doesn't have cid attached,
      // assume it's an async component resolve function.
      // we are not using Vue's default async resolving mechanism because
      // we want to halt the navigation until the incoming component has been
      // resolved.
      if (typeof def === 'function' && def.cid === undefined) {
        hasAsync = true;
        pending++;

        var resolve = once(function (resolvedDef) {
          if (resolvedDef.__esModule && resolvedDef.default) {
            resolvedDef = resolvedDef.default;
          }
          // save resolved on async factory in case it's used elsewhere
          def.resolved = typeof resolvedDef === 'function'
            ? resolvedDef
            : _Vue.extend(resolvedDef);
          match.components[key] = resolvedDef;
          pending--;
          if (pending <= 0) {
            next();
          }
        });

        var reject = once(function (reason) {
          var msg = "Failed to resolve async component " + key + ": " + reason;
          process.env.NODE_ENV !== 'production' && warn(false, msg);
          if (!error) {
            error = isError(reason)
              ? reason
              : new Error(msg);
            next(error);
          }
        });

        var res;
        try {
          res = def(resolve, reject);
        } catch (e) {
          reject(e);
        }
        if (res) {
          if (typeof res.then === 'function') {
            res.then(resolve, reject);
          } else {
            // new syntax in Vue 2.3
            var comp = res.component;
            if (comp && typeof comp.then === 'function') {
              comp.then(resolve, reject);
            }
          }
        }
      }
    });

    if (!hasAsync) { next(); }
  }
}

function flatMapComponents (
  matched,
  fn
) {
  return flatten(matched.map(function (m) {
    return Object.keys(m.components).map(function (key) { return fn(
      m.components[key],
      m.instances[key],
      m, key
    ); })
  }))
}

function flatten (arr) {
  return Array.prototype.concat.apply([], arr)
}

// in Webpack 2, require.ensure now also returns a Promise
// so the resolve/reject functions may get called an extra time
// if the user uses an arrow function shorthand that happens to
// return that Promise.
function once (fn) {
  var called = false;
  return function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    if (called) { return }
    called = true;
    return fn.apply(this, args)
  }
}

/*  */

var History = function History (router, base) {
  this.router = router;
  this.base = normalizeBase(base);
  // start with a route object that stands for "nowhere"
  this.current = START;
  this.pending = null;
  this.ready = false;
  this.readyCbs = [];
  this.readyErrorCbs = [];
  this.errorCbs = [];
};

History.prototype.listen = function listen (cb) {
  this.cb = cb;
};

History.prototype.onReady = function onReady (cb, errorCb) {
  if (this.ready) {
    cb();
  } else {
    this.readyCbs.push(cb);
    if (errorCb) {
      this.readyErrorCbs.push(errorCb);
    }
  }
};

History.prototype.onError = function onError (errorCb) {
  this.errorCbs.push(errorCb);
};

History.prototype.transitionTo = function transitionTo (location, onComplete, onAbort) {
    var this$1 = this;

  var route = this.router.match(location, this.current);
  this.confirmTransition(route, function () {
    this$1.updateRoute(route);
    onComplete && onComplete(route);
    this$1.ensureURL();

    // fire ready cbs once
    if (!this$1.ready) {
      this$1.ready = true;
      this$1.readyCbs.forEach(function (cb) { cb(route); });
    }
  }, function (err) {
    if (onAbort) {
      onAbort(err);
    }
    if (err && !this$1.ready) {
      this$1.ready = true;
      this$1.readyErrorCbs.forEach(function (cb) { cb(err); });
    }
  });
};

History.prototype.confirmTransition = function confirmTransition (route, onComplete, onAbort) {
    var this$1 = this;

  var current = this.current;
  var abort = function (err) {
    if (isError(err)) {
      if (this$1.errorCbs.length) {
        this$1.errorCbs.forEach(function (cb) { cb(err); });
      } else {
        warn(false, 'uncaught error during route navigation:');
        console.error(err);
      }
    }
    onAbort && onAbort(err);
  };
  if (
    isSameRoute(route, current) &&
    // in the case the route map has been dynamically appended to
    route.matched.length === current.matched.length
  ) {
    this.ensureURL();
    return abort()
  }

  var ref = resolveQueue(this.current.matched, route.matched);
    var updated = ref.updated;
    var deactivated = ref.deactivated;
    var activated = ref.activated;

  var queue = [].concat(
    // in-component leave guards
    extractLeaveGuards(deactivated),
    // global before hooks
    this.router.beforeHooks,
    // in-component update hooks
    extractUpdateHooks(updated),
    // in-config enter guards
    activated.map(function (m) { return m.beforeEnter; }),
    // async components
    resolveAsyncComponents(activated)
  );

  this.pending = route;
  var iterator = function (hook, next) {
    if (this$1.pending !== route) {
      return abort()
    }
    try {
      hook(route, current, function (to) {
        if (to === false || isError(to)) {
          // next(false) -> abort navigation, ensure current URL
          this$1.ensureURL(true);
          abort(to);
        } else if (
          typeof to === 'string' ||
          (typeof to === 'object' && (
            typeof to.path === 'string' ||
            typeof to.name === 'string'
          ))
        ) {
          // next('/') or next({ path: '/' }) -> redirect
          abort();
          if (typeof to === 'object' && to.replace) {
            this$1.replace(to);
          } else {
            this$1.push(to);
          }
        } else {
          // confirm transition and pass on the value
          next(to);
        }
      });
    } catch (e) {
      abort(e);
    }
  };

  runQueue(queue, iterator, function () {
    var postEnterCbs = [];
    var isValid = function () { return this$1.current === route; };
    // wait until async components are resolved before
    // extracting in-component enter guards
    var enterGuards = extractEnterGuards(activated, postEnterCbs, isValid);
    var queue = enterGuards.concat(this$1.router.resolveHooks);
    runQueue(queue, iterator, function () {
      if (this$1.pending !== route) {
        return abort()
      }
      this$1.pending = null;
      onComplete(route);
      if (this$1.router.app) {
        this$1.router.app.$nextTick(function () {
          postEnterCbs.forEach(function (cb) { cb(); });
        });
      }
    });
  });
};

History.prototype.updateRoute = function updateRoute (route) {
  var prev = this.current;
  this.current = route;
  this.cb && this.cb(route);
  this.router.afterHooks.forEach(function (hook) {
    hook && hook(route, prev);
  });
};

function normalizeBase (base) {
  if (!base) {
    if (inBrowser) {
      // respect <base> tag
      var baseEl = document.querySelector('base');
      base = (baseEl && baseEl.getAttribute('href')) || '/';
      // strip full URL origin
      base = base.replace(/^https?:\/\/[^\/]+/, '');
    } else {
      base = '/';
    }
  }
  // make sure there's the starting slash
  if (base.charAt(0) !== '/') {
    base = '/' + base;
  }
  // remove trailing slash
  return base.replace(/\/$/, '')
}

function resolveQueue (
  current,
  next
) {
  var i;
  var max = Math.max(current.length, next.length);
  for (i = 0; i < max; i++) {
    if (current[i] !== next[i]) {
      break
    }
  }
  return {
    updated: next.slice(0, i),
    activated: next.slice(i),
    deactivated: current.slice(i)
  }
}

function extractGuards (
  records,
  name,
  bind,
  reverse
) {
  var guards = flatMapComponents(records, function (def, instance, match, key) {
    var guard = extractGuard(def, name);
    if (guard) {
      return Array.isArray(guard)
        ? guard.map(function (guard) { return bind(guard, instance, match, key); })
        : bind(guard, instance, match, key)
    }
  });
  return flatten(reverse ? guards.reverse() : guards)
}

function extractGuard (
  def,
  key
) {
  if (typeof def !== 'function') {
    // extend now so that global mixins are applied.
    def = _Vue.extend(def);
  }
  return def.options[key]
}

function extractLeaveGuards (deactivated) {
  return extractGuards(deactivated, 'beforeRouteLeave', bindGuard, true)
}

function extractUpdateHooks (updated) {
  return extractGuards(updated, 'beforeRouteUpdate', bindGuard)
}

function bindGuard (guard, instance) {
  if (instance) {
    return function boundRouteGuard () {
      return guard.apply(instance, arguments)
    }
  }
}

function extractEnterGuards (
  activated,
  cbs,
  isValid
) {
  return extractGuards(activated, 'beforeRouteEnter', function (guard, _, match, key) {
    return bindEnterGuard(guard, match, key, cbs, isValid)
  })
}

function bindEnterGuard (
  guard,
  match,
  key,
  cbs,
  isValid
) {
  return function routeEnterGuard (to, from, next) {
    return guard(to, from, function (cb) {
      next(cb);
      if (typeof cb === 'function') {
        cbs.push(function () {
          // #750
          // if a router-view is wrapped with an out-in transition,
          // the instance may not have been registered at this time.
          // we will need to poll for registration until current route
          // is no longer valid.
          poll(cb, match.instances, key, isValid);
        });
      }
    })
  }
}

function poll (
  cb, // somehow flow cannot infer this is a function
  instances,
  key,
  isValid
) {
  if (instances[key]) {
    cb(instances[key]);
  } else if (isValid()) {
    setTimeout(function () {
      poll(cb, instances, key, isValid);
    }, 16);
  }
}

/*  */


var HTML5History = (function (History$$1) {
  function HTML5History (router, base) {
    var this$1 = this;

    History$$1.call(this, router, base);

    var expectScroll = router.options.scrollBehavior;

    if (expectScroll) {
      setupScroll();
    }

    window.addEventListener('popstate', function (e) {
      var current = this$1.current;
      this$1.transitionTo(getLocation(this$1.base), function (route) {
        if (expectScroll) {
          handleScroll(router, route, current, true);
        }
      });
    });
  }

  if ( History$$1 ) HTML5History.__proto__ = History$$1;
  HTML5History.prototype = Object.create( History$$1 && History$$1.prototype );
  HTML5History.prototype.constructor = HTML5History;

  HTML5History.prototype.go = function go (n) {
    window.history.go(n);
  };

  HTML5History.prototype.push = function push (location, onComplete, onAbort) {
    var this$1 = this;

    var ref = this;
    var fromRoute = ref.current;
    this.transitionTo(location, function (route) {
      pushState(cleanPath(this$1.base + route.fullPath));
      handleScroll(this$1.router, route, fromRoute, false);
      onComplete && onComplete(route);
    }, onAbort);
  };

  HTML5History.prototype.replace = function replace (location, onComplete, onAbort) {
    var this$1 = this;

    var ref = this;
    var fromRoute = ref.current;
    this.transitionTo(location, function (route) {
      replaceState(cleanPath(this$1.base + route.fullPath));
      handleScroll(this$1.router, route, fromRoute, false);
      onComplete && onComplete(route);
    }, onAbort);
  };

  HTML5History.prototype.ensureURL = function ensureURL (push) {
    if (getLocation(this.base) !== this.current.fullPath) {
      var current = cleanPath(this.base + this.current.fullPath);
      push ? pushState(current) : replaceState(current);
    }
  };

  HTML5History.prototype.getCurrentLocation = function getCurrentLocation () {
    return getLocation(this.base)
  };

  return HTML5History;
}(History));

function getLocation (base) {
  var path = window.location.pathname;
  if (base && path.indexOf(base) === 0) {
    path = path.slice(base.length);
  }
  return (path || '/') + window.location.search + window.location.hash
}

/*  */


var HashHistory = (function (History$$1) {
  function HashHistory (router, base, fallback) {
    History$$1.call(this, router, base);
    // check history fallback deeplinking
    if (fallback && checkFallback(this.base)) {
      return
    }
    ensureSlash();
  }

  if ( History$$1 ) HashHistory.__proto__ = History$$1;
  HashHistory.prototype = Object.create( History$$1 && History$$1.prototype );
  HashHistory.prototype.constructor = HashHistory;

  // this is delayed until the app mounts
  // to avoid the hashchange listener being fired too early
  HashHistory.prototype.setupListeners = function setupListeners () {
    var this$1 = this;

    window.addEventListener('hashchange', function () {
      if (!ensureSlash()) {
        return
      }
      this$1.transitionTo(getHash(), function (route) {
        replaceHash(route.fullPath);
      });
    });
  };

  HashHistory.prototype.push = function push (location, onComplete, onAbort) {
    this.transitionTo(location, function (route) {
      pushHash(route.fullPath);
      onComplete && onComplete(route);
    }, onAbort);
  };

  HashHistory.prototype.replace = function replace (location, onComplete, onAbort) {
    this.transitionTo(location, function (route) {
      replaceHash(route.fullPath);
      onComplete && onComplete(route);
    }, onAbort);
  };

  HashHistory.prototype.go = function go (n) {
    window.history.go(n);
  };

  HashHistory.prototype.ensureURL = function ensureURL (push) {
    var current = this.current.fullPath;
    if (getHash() !== current) {
      push ? pushHash(current) : replaceHash(current);
    }
  };

  HashHistory.prototype.getCurrentLocation = function getCurrentLocation () {
    return getHash()
  };

  return HashHistory;
}(History));

function checkFallback (base) {
  var location = getLocation(base);
  if (!/^\/#/.test(location)) {
    window.location.replace(
      cleanPath(base + '/#' + location)
    );
    return true
  }
}

function ensureSlash () {
  var path = getHash();
  if (path.charAt(0) === '/') {
    return true
  }
  replaceHash('/' + path);
  return false
}

function getHash () {
  // We can't use window.location.hash here because it's not
  // consistent across browsers - Firefox will pre-decode it!
  var href = window.location.href;
  var index = href.indexOf('#');
  return index === -1 ? '' : href.slice(index + 1)
}

function pushHash (path) {
  window.location.hash = path;
}

function replaceHash (path) {
  var href = window.location.href;
  var i = href.indexOf('#');
  var base = i >= 0 ? href.slice(0, i) : href;
  window.location.replace((base + "#" + path));
}

/*  */


var AbstractHistory = (function (History$$1) {
  function AbstractHistory (router, base) {
    History$$1.call(this, router, base);
    this.stack = [];
    this.index = -1;
  }

  if ( History$$1 ) AbstractHistory.__proto__ = History$$1;
  AbstractHistory.prototype = Object.create( History$$1 && History$$1.prototype );
  AbstractHistory.prototype.constructor = AbstractHistory;

  AbstractHistory.prototype.push = function push (location, onComplete, onAbort) {
    var this$1 = this;

    this.transitionTo(location, function (route) {
      this$1.stack = this$1.stack.slice(0, this$1.index + 1).concat(route);
      this$1.index++;
      onComplete && onComplete(route);
    }, onAbort);
  };

  AbstractHistory.prototype.replace = function replace (location, onComplete, onAbort) {
    var this$1 = this;

    this.transitionTo(location, function (route) {
      this$1.stack = this$1.stack.slice(0, this$1.index).concat(route);
      onComplete && onComplete(route);
    }, onAbort);
  };

  AbstractHistory.prototype.go = function go (n) {
    var this$1 = this;

    var targetIndex = this.index + n;
    if (targetIndex < 0 || targetIndex >= this.stack.length) {
      return
    }
    var route = this.stack[targetIndex];
    this.confirmTransition(route, function () {
      this$1.index = targetIndex;
      this$1.updateRoute(route);
    });
  };

  AbstractHistory.prototype.getCurrentLocation = function getCurrentLocation () {
    var current = this.stack[this.stack.length - 1];
    return current ? current.fullPath : '/'
  };

  AbstractHistory.prototype.ensureURL = function ensureURL () {
    // noop
  };

  return AbstractHistory;
}(History));

/*  */

var VueRouter = function VueRouter (options) {
  if ( options === void 0 ) options = {};

  this.app = null;
  this.apps = [];
  this.options = options;
  this.beforeHooks = [];
  this.resolveHooks = [];
  this.afterHooks = [];
  this.matcher = createMatcher(options.routes || [], this);

  var mode = options.mode || 'hash';
  this.fallback = mode === 'history' && !supportsPushState && options.fallback !== false;
  if (this.fallback) {
    mode = 'hash';
  }
  if (!inBrowser) {
    mode = 'abstract';
  }
  this.mode = mode;

  switch (mode) {
    case 'history':
      this.history = new HTML5History(this, options.base);
      break
    case 'hash':
      this.history = new HashHistory(this, options.base, this.fallback);
      break
    case 'abstract':
      this.history = new AbstractHistory(this, options.base);
      break
    default:
      if (process.env.NODE_ENV !== 'production') {
        assert(false, ("invalid mode: " + mode));
      }
  }
};

var prototypeAccessors = { currentRoute: {} };

VueRouter.prototype.match = function match (
  raw,
  current,
  redirectedFrom
) {
  return this.matcher.match(raw, current, redirectedFrom)
};

prototypeAccessors.currentRoute.get = function () {
  return this.history && this.history.current
};

VueRouter.prototype.init = function init (app /* Vue component instance */) {
    var this$1 = this;

  process.env.NODE_ENV !== 'production' && assert(
    install.installed,
    "not installed. Make sure to call `Vue.use(VueRouter)` " +
    "before creating root instance."
  );

  this.apps.push(app);

  // main app already initialized.
  if (this.app) {
    return
  }

  this.app = app;

  var history = this.history;

  if (history instanceof HTML5History) {
    history.transitionTo(history.getCurrentLocation());
  } else if (history instanceof HashHistory) {
    var setupHashListener = function () {
      history.setupListeners();
    };
    history.transitionTo(
      history.getCurrentLocation(),
      setupHashListener,
      setupHashListener
    );
  }

  history.listen(function (route) {
    this$1.apps.forEach(function (app) {
      app._route = route;
    });
  });
};

VueRouter.prototype.beforeEach = function beforeEach (fn) {
  return registerHook(this.beforeHooks, fn)
};

VueRouter.prototype.beforeResolve = function beforeResolve (fn) {
  return registerHook(this.resolveHooks, fn)
};

VueRouter.prototype.afterEach = function afterEach (fn) {
  return registerHook(this.afterHooks, fn)
};

VueRouter.prototype.onReady = function onReady (cb, errorCb) {
  this.history.onReady(cb, errorCb);
};

VueRouter.prototype.onError = function onError (errorCb) {
  this.history.onError(errorCb);
};

VueRouter.prototype.push = function push (location, onComplete, onAbort) {
  this.history.push(location, onComplete, onAbort);
};

VueRouter.prototype.replace = function replace (location, onComplete, onAbort) {
  this.history.replace(location, onComplete, onAbort);
};

VueRouter.prototype.go = function go (n) {
  this.history.go(n);
};

VueRouter.prototype.back = function back () {
  this.go(-1);
};

VueRouter.prototype.forward = function forward () {
  this.go(1);
};

VueRouter.prototype.getMatchedComponents = function getMatchedComponents (to) {
  var route = to
    ? to.matched
      ? to
      : this.resolve(to).route
    : this.currentRoute;
  if (!route) {
    return []
  }
  return [].concat.apply([], route.matched.map(function (m) {
    return Object.keys(m.components).map(function (key) {
      return m.components[key]
    })
  }))
};

VueRouter.prototype.resolve = function resolve (
  to,
  current,
  append
) {
  var location = normalizeLocation(
    to,
    current || this.history.current,
    append,
    this
  );
  var route = this.match(location, current);
  var fullPath = route.redirectedFrom || route.fullPath;
  var base = this.history.base;
  var href = createHref(base, fullPath, this.mode);
  return {
    location: location,
    route: route,
    href: href,
    // for backwards compat
    normalizedTo: location,
    resolved: route
  }
};

VueRouter.prototype.addRoutes = function addRoutes (routes) {
  this.matcher.addRoutes(routes);
  if (this.history.current !== START) {
    this.history.transitionTo(this.history.getCurrentLocation());
  }
};

Object.defineProperties( VueRouter.prototype, prototypeAccessors );

function registerHook (list, fn) {
  list.push(fn);
  return function () {
    var i = list.indexOf(fn);
    if (i > -1) { list.splice(i, 1); }
  }
}

function createHref (base, fullPath, mode) {
  var path = mode === 'hash' ? '#' + fullPath : fullPath;
  return base ? cleanPath(base + '/' + path) : path
}

VueRouter.install = install;
VueRouter.version = '2.7.0';

if (inBrowser && window.Vue) {
  window.Vue.use(VueRouter);
}

/* harmony default export */ __webpack_exports__["a"] = (VueRouter);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(1)))

/***/ }),
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */,
/* 11 */
/***/ (function(module, exports) {

module.exports = function normalizeComponent (
  rawScriptExports,
  compiledTemplate,
  scopeId,
  cssModules
) {
  var esModule
  var scriptExports = rawScriptExports = rawScriptExports || {}

  // ES6 modules interop
  var type = typeof rawScriptExports.default
  if (type === 'object' || type === 'function') {
    esModule = rawScriptExports
    scriptExports = rawScriptExports.default
  }

  // Vue.extend constructor export interop
  var options = typeof scriptExports === 'function'
    ? scriptExports.options
    : scriptExports

  // render functions
  if (compiledTemplate) {
    options.render = compiledTemplate.render
    options.staticRenderFns = compiledTemplate.staticRenderFns
  }

  // scopedId
  if (scopeId) {
    options._scopeId = scopeId
  }

  // inject cssModules
  if (cssModules) {
    var computed = options.computed || (options.computed = {})
    Object.keys(cssModules).forEach(function (key) {
      var module = cssModules[key]
      computed[key] = function () { return module }
    })
  }

  return {
    esModule: esModule,
    exports: scriptExports,
    options: options
  }
}


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bootstrap__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__routes__ = __webpack_require__(38);




new Vue({

    el: '#app',

    router: __WEBPACK_IMPORTED_MODULE_1__routes__["a" /* default */]

});

/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vue_router__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_axios__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_axios___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_axios__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_bulma_css_bulma_css__ = __webpack_require__(33);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_bulma_css_bulma_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_bulma_css_bulma_css__);








window.Vue = __WEBPACK_IMPORTED_MODULE_0_vue__["default"];

__WEBPACK_IMPORTED_MODULE_0_vue__["default"].use(__WEBPACK_IMPORTED_MODULE_1_vue_router__["a" /* default */]);

window.axios = __WEBPACK_IMPORTED_MODULE_2_axios___default.a;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

var token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

/***/ }),
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(34);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(36)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../css-loader/index.js!./bulma.css", function() {
			var newContent = require("!!../../css-loader/index.js!./bulma.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(35)();
// imports


// module
exports.push([module.i, "/*! bulma.io v0.4.2 | MIT License | github.com/jgthms/bulma */\n@-webkit-keyframes spinAround {\n  from {\n    -webkit-transform: rotate(0deg);\n            transform: rotate(0deg);\n  }\n  to {\n    -webkit-transform: rotate(359deg);\n            transform: rotate(359deg);\n  }\n}\n@keyframes spinAround {\n  from {\n    -webkit-transform: rotate(0deg);\n            transform: rotate(0deg);\n  }\n  to {\n    -webkit-transform: rotate(359deg);\n            transform: rotate(359deg);\n  }\n}\n\n/*! minireset.css v0.0.2 | MIT License | github.com/jgthms/minireset.css */\nhtml,\nbody,\np,\nol,\nul,\nli,\ndl,\ndt,\ndd,\nblockquote,\nfigure,\nfieldset,\nlegend,\ntextarea,\npre,\niframe,\nhr,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  margin: 0;\n  padding: 0;\n}\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: 100%;\n  font-weight: normal;\n}\n\nul {\n  list-style: none;\n}\n\nbutton,\ninput,\nselect,\ntextarea {\n  margin: 0;\n}\n\nhtml {\n  -webkit-box-sizing: border-box;\n          box-sizing: border-box;\n}\n\n* {\n  -webkit-box-sizing: inherit;\n          box-sizing: inherit;\n}\n\n*:before, *:after {\n  -webkit-box-sizing: inherit;\n          box-sizing: inherit;\n}\n\nimg,\nembed,\nobject,\naudio,\nvideo {\n  max-width: 100%;\n}\n\niframe {\n  border: 0;\n}\n\ntable {\n  border-collapse: collapse;\n  border-spacing: 0;\n}\n\ntd,\nth {\n  padding: 0;\n  text-align: left;\n}\n\nhtml {\n  background-color: #fff;\n  font-size: 16px;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  min-width: 300px;\n  overflow-x: hidden;\n  overflow-y: scroll;\n  text-rendering: optimizeLegibility;\n}\n\narticle,\naside,\nfigure,\nfooter,\nheader,\nhgroup,\nsection {\n  display: block;\n}\n\nbody,\nbutton,\ninput,\nselect,\ntextarea {\n  font-family: BlinkMacSystemFont, -apple-system, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", \"Helvetica\", \"Arial\", sans-serif;\n}\n\ncode,\npre {\n  -moz-osx-font-smoothing: auto;\n  -webkit-font-smoothing: auto;\n  font-family: monospace;\n}\n\nbody {\n  color: #4a4a4a;\n  font-size: 1rem;\n  font-weight: 400;\n  line-height: 1.5;\n  overflow-x: hidden;\n}\n\na {\n  color: #00d1b2;\n  cursor: pointer;\n  text-decoration: none;\n  -webkit-transition: none 86ms ease-out;\n  transition: none 86ms ease-out;\n}\n\na:hover {\n  color: #363636;\n}\n\ncode {\n  background-color: whitesmoke;\n  color: #ff3860;\n  font-size: 0.8em;\n  font-weight: normal;\n  padding: 0.25em 0.5em 0.25em;\n}\n\nhr {\n  background-color: #dbdbdb;\n  border: none;\n  display: block;\n  height: 1px;\n  margin: 1.5rem 0;\n}\n\nimg {\n  max-width: 100%;\n}\n\ninput[type=\"checkbox\"],\ninput[type=\"radio\"] {\n  vertical-align: baseline;\n}\n\nsmall {\n  font-size: 0.875em;\n}\n\nspan {\n  font-style: inherit;\n  font-weight: inherit;\n}\n\nstrong {\n  color: #363636;\n  font-weight: 700;\n}\n\npre {\n  background-color: whitesmoke;\n  color: #4a4a4a;\n  font-size: 0.8em;\n  white-space: pre;\n  word-wrap: normal;\n}\n\npre code {\n  -webkit-overflow-scrolling: touch;\n  background: none;\n  color: inherit;\n  display: block;\n  font-size: 1em;\n  overflow-x: auto;\n  padding: 1.25rem 1.5rem;\n}\n\ntable {\n  width: 100%;\n}\n\ntable td,\ntable th {\n  text-align: left;\n  vertical-align: top;\n}\n\ntable th {\n  color: #363636;\n}\n\n.is-block {\n  display: block;\n}\n\n@media screen and (max-width: 768px) {\n  .is-block-mobile {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-block-tablet {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 999px) {\n  .is-block-tablet-only {\n    display: block !important;\n  }\n}\n\n@media screen and (max-width: 999px) {\n  .is-block-touch {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1000px) {\n  .is-block-desktop {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1000px) and (max-width: 1191px) {\n  .is-block-desktop-only {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1192px) {\n  .is-block-widescreen {\n    display: block !important;\n  }\n}\n\n.is-flex {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n}\n\n@media screen and (max-width: 768px) {\n  .is-flex-mobile {\n    display: -webkit-box !important;\n    display: -ms-flexbox !important;\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-flex-tablet {\n    display: -webkit-box !important;\n    display: -ms-flexbox !important;\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 999px) {\n  .is-flex-tablet-only {\n    display: -webkit-box !important;\n    display: -ms-flexbox !important;\n    display: flex !important;\n  }\n}\n\n@media screen and (max-width: 999px) {\n  .is-flex-touch {\n    display: -webkit-box !important;\n    display: -ms-flexbox !important;\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1000px) {\n  .is-flex-desktop {\n    display: -webkit-box !important;\n    display: -ms-flexbox !important;\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1000px) and (max-width: 1191px) {\n  .is-flex-desktop-only {\n    display: -webkit-box !important;\n    display: -ms-flexbox !important;\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1192px) {\n  .is-flex-widescreen {\n    display: -webkit-box !important;\n    display: -ms-flexbox !important;\n    display: flex !important;\n  }\n}\n\n.is-inline {\n  display: inline;\n}\n\n@media screen and (max-width: 768px) {\n  .is-inline-mobile {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-inline-tablet {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 999px) {\n  .is-inline-tablet-only {\n    display: inline !important;\n  }\n}\n\n@media screen and (max-width: 999px) {\n  .is-inline-touch {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1000px) {\n  .is-inline-desktop {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1000px) and (max-width: 1191px) {\n  .is-inline-desktop-only {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1192px) {\n  .is-inline-widescreen {\n    display: inline !important;\n  }\n}\n\n.is-inline-block {\n  display: inline-block;\n}\n\n@media screen and (max-width: 768px) {\n  .is-inline-block-mobile {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-inline-block-tablet {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 999px) {\n  .is-inline-block-tablet-only {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (max-width: 999px) {\n  .is-inline-block-touch {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1000px) {\n  .is-inline-block-desktop {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1000px) and (max-width: 1191px) {\n  .is-inline-block-desktop-only {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1192px) {\n  .is-inline-block-widescreen {\n    display: inline-block !important;\n  }\n}\n\n.is-inline-flex {\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n}\n\n@media screen and (max-width: 768px) {\n  .is-inline-flex-mobile {\n    display: -webkit-inline-box !important;\n    display: -ms-inline-flexbox !important;\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-inline-flex-tablet {\n    display: -webkit-inline-box !important;\n    display: -ms-inline-flexbox !important;\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 999px) {\n  .is-inline-flex-tablet-only {\n    display: -webkit-inline-box !important;\n    display: -ms-inline-flexbox !important;\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (max-width: 999px) {\n  .is-inline-flex-touch {\n    display: -webkit-inline-box !important;\n    display: -ms-inline-flexbox !important;\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1000px) {\n  .is-inline-flex-desktop {\n    display: -webkit-inline-box !important;\n    display: -ms-inline-flexbox !important;\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1000px) and (max-width: 1191px) {\n  .is-inline-flex-desktop-only {\n    display: -webkit-inline-box !important;\n    display: -ms-inline-flexbox !important;\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1192px) {\n  .is-inline-flex-widescreen {\n    display: -webkit-inline-box !important;\n    display: -ms-inline-flexbox !important;\n    display: inline-flex !important;\n  }\n}\n\n.is-clearfix:after {\n  clear: both;\n  content: \" \";\n  display: table;\n}\n\n.is-pulled-left {\n  float: left;\n}\n\n.is-pulled-right {\n  float: right;\n}\n\n.is-clipped {\n  overflow: hidden !important;\n}\n\n.is-overlay {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n\n.has-text-centered {\n  text-align: center;\n}\n\n.has-text-left {\n  text-align: left;\n}\n\n.has-text-right {\n  text-align: right;\n}\n\n.has-text-white {\n  color: white;\n}\n\na.has-text-white:hover, a.has-text-white:focus {\n  color: #e6e6e6;\n}\n\n.has-text-black {\n  color: #0a0a0a;\n}\n\na.has-text-black:hover, a.has-text-black:focus {\n  color: black;\n}\n\n.has-text-light {\n  color: whitesmoke;\n}\n\na.has-text-light:hover, a.has-text-light:focus {\n  color: #dbdbdb;\n}\n\n.has-text-dark {\n  color: #363636;\n}\n\na.has-text-dark:hover, a.has-text-dark:focus {\n  color: #1c1c1c;\n}\n\n.has-text-primary {\n  color: #00d1b2;\n}\n\na.has-text-primary:hover, a.has-text-primary:focus {\n  color: #009e86;\n}\n\n.has-text-info {\n  color: #3273dc;\n}\n\na.has-text-info:hover, a.has-text-info:focus {\n  color: #205bbc;\n}\n\n.has-text-success {\n  color: #23d160;\n}\n\na.has-text-success:hover, a.has-text-success:focus {\n  color: #1ca64c;\n}\n\n.has-text-warning {\n  color: #ffdd57;\n}\n\na.has-text-warning:hover, a.has-text-warning:focus {\n  color: #ffd324;\n}\n\n.has-text-danger {\n  color: #ff3860;\n}\n\na.has-text-danger:hover, a.has-text-danger:focus {\n  color: #ff0537;\n}\n\n.is-hidden {\n  display: none !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-hidden-mobile {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-hidden-tablet {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 999px) {\n  .is-hidden-tablet-only {\n    display: none !important;\n  }\n}\n\n@media screen and (max-width: 999px) {\n  .is-hidden-touch {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1000px) {\n  .is-hidden-desktop {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1000px) and (max-width: 1191px) {\n  .is-hidden-desktop-only {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1192px) {\n  .is-hidden-widescreen {\n    display: none !important;\n  }\n}\n\n.is-marginless {\n  margin: 0 !important;\n}\n\n.is-paddingless {\n  padding: 0 !important;\n}\n\n.is-unselectable {\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n\n.box {\n  background-color: white;\n  border-radius: 5px;\n  -webkit-box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);\n          box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);\n  display: block;\n  padding: 1.25rem;\n}\n\n.box:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\na.box:hover, a.box:focus {\n  -webkit-box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px #00d1b2;\n          box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px #00d1b2;\n}\n\na.box:active {\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2), 0 0 0 1px #00d1b2;\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2), 0 0 0 1px #00d1b2;\n}\n\n.button {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  border: 1px solid transparent;\n  border-radius: 3px;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n  font-size: 1rem;\n  height: 2.25em;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n  line-height: 1.5;\n  padding-bottom: calc(0.375em - 1px);\n  padding-left: calc(0.625em - 1px);\n  padding-right: calc(0.625em - 1px);\n  padding-top: calc(0.375em - 1px);\n  position: relative;\n  vertical-align: top;\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  background-color: white;\n  border-color: #dbdbdb;\n  color: #363636;\n  cursor: pointer;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  padding-left: 0.75em;\n  padding-right: 0.75em;\n  text-align: center;\n  white-space: nowrap;\n}\n\n.button:focus, .button.is-focused, .button:active, .button.is-active {\n  outline: none;\n}\n\n.button[disabled] {\n  cursor: not-allowed;\n}\n\n.button strong {\n  color: inherit;\n}\n\n.button .icon, .button .icon.is-small, .button .icon.is-medium, .button .icon.is-large {\n  height: 1.5em;\n  width: 1.5em;\n}\n\n.button .icon:first-child:not(:last-child) {\n  margin-left: calc(-0.375em - 1px);\n  margin-right: 0.1875em;\n}\n\n.button .icon:last-child:not(:first-child) {\n  margin-left: 0.1875em;\n  margin-right: calc(-0.375em - 1px);\n}\n\n.button .icon:first-child:last-child {\n  margin-left: calc(-0.375em - 1px);\n  margin-right: calc(-0.375em - 1px);\n}\n\n.button:hover, .button.is-hovered {\n  border-color: #b5b5b5;\n  color: #363636;\n}\n\n.button:focus, .button.is-focused {\n  border-color: #00d1b2;\n  -webkit-box-shadow: 0 0 0.5em rgba(0, 209, 178, 0.25);\n          box-shadow: 0 0 0.5em rgba(0, 209, 178, 0.25);\n  color: #363636;\n}\n\n.button:active, .button.is-active {\n  border-color: #4a4a4a;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n  color: #363636;\n}\n\n.button.is-link {\n  background-color: transparent;\n  border-color: transparent;\n  color: #4a4a4a;\n  text-decoration: underline;\n}\n\n.button.is-link:hover, .button.is-link.is-hovered, .button.is-link:focus, .button.is-link.is-focused, .button.is-link:active, .button.is-link.is-active {\n  background-color: whitesmoke;\n  color: #363636;\n}\n\n.button.is-link[disabled] {\n  background-color: transparent;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n}\n\n.button.is-white {\n  background-color: white;\n  border-color: transparent;\n  color: #0a0a0a;\n}\n\n.button.is-white:hover, .button.is-white.is-hovered {\n  background-color: #f9f9f9;\n  border-color: transparent;\n  color: #0a0a0a;\n}\n\n.button.is-white:focus, .button.is-white.is-focused {\n  border-color: transparent;\n  -webkit-box-shadow: 0 0 0.5em rgba(255, 255, 255, 0.25);\n          box-shadow: 0 0 0.5em rgba(255, 255, 255, 0.25);\n  color: #0a0a0a;\n}\n\n.button.is-white:active, .button.is-white.is-active {\n  background-color: #f2f2f2;\n  border-color: transparent;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n  color: #0a0a0a;\n}\n\n.button.is-white[disabled] {\n  background-color: white;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n}\n\n.button.is-white.is-inverted {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.button.is-white.is-inverted:hover {\n  background-color: black;\n}\n\n.button.is-white.is-inverted[disabled] {\n  background-color: #0a0a0a;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: white;\n}\n\n.button.is-white.is-loading:after {\n  border-color: transparent transparent #0a0a0a #0a0a0a !important;\n}\n\n.button.is-white.is-outlined {\n  background-color: transparent;\n  border-color: white;\n  color: white;\n}\n\n.button.is-white.is-outlined:hover, .button.is-white.is-outlined:focus {\n  background-color: white;\n  border-color: white;\n  color: #0a0a0a;\n}\n\n.button.is-white.is-outlined.is-loading:after {\n  border-color: transparent transparent white white !important;\n}\n\n.button.is-white.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: white;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: white;\n}\n\n.button.is-white.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #0a0a0a;\n  color: #0a0a0a;\n}\n\n.button.is-white.is-inverted.is-outlined:hover, .button.is-white.is-inverted.is-outlined:focus {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.button.is-white.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #0a0a0a;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #0a0a0a;\n}\n\n.button.is-black {\n  background-color: #0a0a0a;\n  border-color: transparent;\n  color: white;\n}\n\n.button.is-black:hover, .button.is-black.is-hovered {\n  background-color: #040404;\n  border-color: transparent;\n  color: white;\n}\n\n.button.is-black:focus, .button.is-black.is-focused {\n  border-color: transparent;\n  -webkit-box-shadow: 0 0 0.5em rgba(10, 10, 10, 0.25);\n          box-shadow: 0 0 0.5em rgba(10, 10, 10, 0.25);\n  color: white;\n}\n\n.button.is-black:active, .button.is-black.is-active {\n  background-color: black;\n  border-color: transparent;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n  color: white;\n}\n\n.button.is-black[disabled] {\n  background-color: #0a0a0a;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n}\n\n.button.is-black.is-inverted {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.button.is-black.is-inverted:hover {\n  background-color: #f2f2f2;\n}\n\n.button.is-black.is-inverted[disabled] {\n  background-color: white;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #0a0a0a;\n}\n\n.button.is-black.is-loading:after {\n  border-color: transparent transparent white white !important;\n}\n\n.button.is-black.is-outlined {\n  background-color: transparent;\n  border-color: #0a0a0a;\n  color: #0a0a0a;\n}\n\n.button.is-black.is-outlined:hover, .button.is-black.is-outlined:focus {\n  background-color: #0a0a0a;\n  border-color: #0a0a0a;\n  color: white;\n}\n\n.button.is-black.is-outlined.is-loading:after {\n  border-color: transparent transparent #0a0a0a #0a0a0a !important;\n}\n\n.button.is-black.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #0a0a0a;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #0a0a0a;\n}\n\n.button.is-black.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: white;\n  color: white;\n}\n\n.button.is-black.is-inverted.is-outlined:hover, .button.is-black.is-inverted.is-outlined:focus {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.button.is-black.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: white;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: white;\n}\n\n.button.is-light {\n  background-color: whitesmoke;\n  border-color: transparent;\n  color: #363636;\n}\n\n.button.is-light:hover, .button.is-light.is-hovered {\n  background-color: #eeeeee;\n  border-color: transparent;\n  color: #363636;\n}\n\n.button.is-light:focus, .button.is-light.is-focused {\n  border-color: transparent;\n  -webkit-box-shadow: 0 0 0.5em rgba(245, 245, 245, 0.25);\n          box-shadow: 0 0 0.5em rgba(245, 245, 245, 0.25);\n  color: #363636;\n}\n\n.button.is-light:active, .button.is-light.is-active {\n  background-color: #e8e8e8;\n  border-color: transparent;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n  color: #363636;\n}\n\n.button.is-light[disabled] {\n  background-color: whitesmoke;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n}\n\n.button.is-light.is-inverted {\n  background-color: #363636;\n  color: whitesmoke;\n}\n\n.button.is-light.is-inverted:hover {\n  background-color: #292929;\n}\n\n.button.is-light.is-inverted[disabled] {\n  background-color: #363636;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: whitesmoke;\n}\n\n.button.is-light.is-loading:after {\n  border-color: transparent transparent #363636 #363636 !important;\n}\n\n.button.is-light.is-outlined {\n  background-color: transparent;\n  border-color: whitesmoke;\n  color: whitesmoke;\n}\n\n.button.is-light.is-outlined:hover, .button.is-light.is-outlined:focus {\n  background-color: whitesmoke;\n  border-color: whitesmoke;\n  color: #363636;\n}\n\n.button.is-light.is-outlined.is-loading:after {\n  border-color: transparent transparent whitesmoke whitesmoke !important;\n}\n\n.button.is-light.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: whitesmoke;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: whitesmoke;\n}\n\n.button.is-light.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #363636;\n  color: #363636;\n}\n\n.button.is-light.is-inverted.is-outlined:hover, .button.is-light.is-inverted.is-outlined:focus {\n  background-color: #363636;\n  color: whitesmoke;\n}\n\n.button.is-light.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #363636;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #363636;\n}\n\n.button.is-dark {\n  background-color: #363636;\n  border-color: transparent;\n  color: whitesmoke;\n}\n\n.button.is-dark:hover, .button.is-dark.is-hovered {\n  background-color: #2f2f2f;\n  border-color: transparent;\n  color: whitesmoke;\n}\n\n.button.is-dark:focus, .button.is-dark.is-focused {\n  border-color: transparent;\n  -webkit-box-shadow: 0 0 0.5em rgba(54, 54, 54, 0.25);\n          box-shadow: 0 0 0.5em rgba(54, 54, 54, 0.25);\n  color: whitesmoke;\n}\n\n.button.is-dark:active, .button.is-dark.is-active {\n  background-color: #292929;\n  border-color: transparent;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n  color: whitesmoke;\n}\n\n.button.is-dark[disabled] {\n  background-color: #363636;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n}\n\n.button.is-dark.is-inverted {\n  background-color: whitesmoke;\n  color: #363636;\n}\n\n.button.is-dark.is-inverted:hover {\n  background-color: #e8e8e8;\n}\n\n.button.is-dark.is-inverted[disabled] {\n  background-color: whitesmoke;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #363636;\n}\n\n.button.is-dark.is-loading:after {\n  border-color: transparent transparent whitesmoke whitesmoke !important;\n}\n\n.button.is-dark.is-outlined {\n  background-color: transparent;\n  border-color: #363636;\n  color: #363636;\n}\n\n.button.is-dark.is-outlined:hover, .button.is-dark.is-outlined:focus {\n  background-color: #363636;\n  border-color: #363636;\n  color: whitesmoke;\n}\n\n.button.is-dark.is-outlined.is-loading:after {\n  border-color: transparent transparent #363636 #363636 !important;\n}\n\n.button.is-dark.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #363636;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #363636;\n}\n\n.button.is-dark.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: whitesmoke;\n  color: whitesmoke;\n}\n\n.button.is-dark.is-inverted.is-outlined:hover, .button.is-dark.is-inverted.is-outlined:focus {\n  background-color: whitesmoke;\n  color: #363636;\n}\n\n.button.is-dark.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: whitesmoke;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: whitesmoke;\n}\n\n.button.is-primary {\n  background-color: #00d1b2;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-primary:hover, .button.is-primary.is-hovered {\n  background-color: #00c4a7;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-primary:focus, .button.is-primary.is-focused {\n  border-color: transparent;\n  -webkit-box-shadow: 0 0 0.5em rgba(0, 209, 178, 0.25);\n          box-shadow: 0 0 0.5em rgba(0, 209, 178, 0.25);\n  color: #fff;\n}\n\n.button.is-primary:active, .button.is-primary.is-active {\n  background-color: #00b89c;\n  border-color: transparent;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n  color: #fff;\n}\n\n.button.is-primary[disabled] {\n  background-color: #00d1b2;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n}\n\n.button.is-primary.is-inverted {\n  background-color: #fff;\n  color: #00d1b2;\n}\n\n.button.is-primary.is-inverted:hover {\n  background-color: #f2f2f2;\n}\n\n.button.is-primary.is-inverted[disabled] {\n  background-color: #fff;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #00d1b2;\n}\n\n.button.is-primary.is-loading:after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-primary.is-outlined {\n  background-color: transparent;\n  border-color: #00d1b2;\n  color: #00d1b2;\n}\n\n.button.is-primary.is-outlined:hover, .button.is-primary.is-outlined:focus {\n  background-color: #00d1b2;\n  border-color: #00d1b2;\n  color: #fff;\n}\n\n.button.is-primary.is-outlined.is-loading:after {\n  border-color: transparent transparent #00d1b2 #00d1b2 !important;\n}\n\n.button.is-primary.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #00d1b2;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #00d1b2;\n}\n\n.button.is-primary.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  color: #fff;\n}\n\n.button.is-primary.is-inverted.is-outlined:hover, .button.is-primary.is-inverted.is-outlined:focus {\n  background-color: #fff;\n  color: #00d1b2;\n}\n\n.button.is-primary.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #fff;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #fff;\n}\n\n.button.is-info {\n  background-color: #3273dc;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-info:hover, .button.is-info.is-hovered {\n  background-color: #276cda;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-info:focus, .button.is-info.is-focused {\n  border-color: transparent;\n  -webkit-box-shadow: 0 0 0.5em rgba(50, 115, 220, 0.25);\n          box-shadow: 0 0 0.5em rgba(50, 115, 220, 0.25);\n  color: #fff;\n}\n\n.button.is-info:active, .button.is-info.is-active {\n  background-color: #2366d1;\n  border-color: transparent;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n  color: #fff;\n}\n\n.button.is-info[disabled] {\n  background-color: #3273dc;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n}\n\n.button.is-info.is-inverted {\n  background-color: #fff;\n  color: #3273dc;\n}\n\n.button.is-info.is-inverted:hover {\n  background-color: #f2f2f2;\n}\n\n.button.is-info.is-inverted[disabled] {\n  background-color: #fff;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #3273dc;\n}\n\n.button.is-info.is-loading:after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-info.is-outlined {\n  background-color: transparent;\n  border-color: #3273dc;\n  color: #3273dc;\n}\n\n.button.is-info.is-outlined:hover, .button.is-info.is-outlined:focus {\n  background-color: #3273dc;\n  border-color: #3273dc;\n  color: #fff;\n}\n\n.button.is-info.is-outlined.is-loading:after {\n  border-color: transparent transparent #3273dc #3273dc !important;\n}\n\n.button.is-info.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #3273dc;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #3273dc;\n}\n\n.button.is-info.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  color: #fff;\n}\n\n.button.is-info.is-inverted.is-outlined:hover, .button.is-info.is-inverted.is-outlined:focus {\n  background-color: #fff;\n  color: #3273dc;\n}\n\n.button.is-info.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #fff;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #fff;\n}\n\n.button.is-success {\n  background-color: #23d160;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-success:hover, .button.is-success.is-hovered {\n  background-color: #22c65b;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-success:focus, .button.is-success.is-focused {\n  border-color: transparent;\n  -webkit-box-shadow: 0 0 0.5em rgba(35, 209, 96, 0.25);\n          box-shadow: 0 0 0.5em rgba(35, 209, 96, 0.25);\n  color: #fff;\n}\n\n.button.is-success:active, .button.is-success.is-active {\n  background-color: #20bc56;\n  border-color: transparent;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n  color: #fff;\n}\n\n.button.is-success[disabled] {\n  background-color: #23d160;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n}\n\n.button.is-success.is-inverted {\n  background-color: #fff;\n  color: #23d160;\n}\n\n.button.is-success.is-inverted:hover {\n  background-color: #f2f2f2;\n}\n\n.button.is-success.is-inverted[disabled] {\n  background-color: #fff;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #23d160;\n}\n\n.button.is-success.is-loading:after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-success.is-outlined {\n  background-color: transparent;\n  border-color: #23d160;\n  color: #23d160;\n}\n\n.button.is-success.is-outlined:hover, .button.is-success.is-outlined:focus {\n  background-color: #23d160;\n  border-color: #23d160;\n  color: #fff;\n}\n\n.button.is-success.is-outlined.is-loading:after {\n  border-color: transparent transparent #23d160 #23d160 !important;\n}\n\n.button.is-success.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #23d160;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #23d160;\n}\n\n.button.is-success.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  color: #fff;\n}\n\n.button.is-success.is-inverted.is-outlined:hover, .button.is-success.is-inverted.is-outlined:focus {\n  background-color: #fff;\n  color: #23d160;\n}\n\n.button.is-success.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #fff;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #fff;\n}\n\n.button.is-warning {\n  background-color: #ffdd57;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning:hover, .button.is-warning.is-hovered {\n  background-color: #ffdb4a;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning:focus, .button.is-warning.is-focused {\n  border-color: transparent;\n  -webkit-box-shadow: 0 0 0.5em rgba(255, 221, 87, 0.25);\n          box-shadow: 0 0 0.5em rgba(255, 221, 87, 0.25);\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning:active, .button.is-warning.is-active {\n  background-color: #ffd83d;\n  border-color: transparent;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning[disabled] {\n  background-color: #ffdd57;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n}\n\n.button.is-warning.is-inverted {\n  background-color: rgba(0, 0, 0, 0.7);\n  color: #ffdd57;\n}\n\n.button.is-warning.is-inverted:hover {\n  background-color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning.is-inverted[disabled] {\n  background-color: rgba(0, 0, 0, 0.7);\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #ffdd57;\n}\n\n.button.is-warning.is-loading:after {\n  border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important;\n}\n\n.button.is-warning.is-outlined {\n  background-color: transparent;\n  border-color: #ffdd57;\n  color: #ffdd57;\n}\n\n.button.is-warning.is-outlined:hover, .button.is-warning.is-outlined:focus {\n  background-color: #ffdd57;\n  border-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning.is-outlined.is-loading:after {\n  border-color: transparent transparent #ffdd57 #ffdd57 !important;\n}\n\n.button.is-warning.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #ffdd57;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #ffdd57;\n}\n\n.button.is-warning.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: rgba(0, 0, 0, 0.7);\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning.is-inverted.is-outlined:hover, .button.is-warning.is-inverted.is-outlined:focus {\n  background-color: rgba(0, 0, 0, 0.7);\n  color: #ffdd57;\n}\n\n.button.is-warning.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: rgba(0, 0, 0, 0.7);\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-danger {\n  background-color: #ff3860;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-danger:hover, .button.is-danger.is-hovered {\n  background-color: #ff2b56;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-danger:focus, .button.is-danger.is-focused {\n  border-color: transparent;\n  -webkit-box-shadow: 0 0 0.5em rgba(255, 56, 96, 0.25);\n          box-shadow: 0 0 0.5em rgba(255, 56, 96, 0.25);\n  color: #fff;\n}\n\n.button.is-danger:active, .button.is-danger.is-active {\n  background-color: #ff1f4b;\n  border-color: transparent;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n  color: #fff;\n}\n\n.button.is-danger[disabled] {\n  background-color: #ff3860;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n}\n\n.button.is-danger.is-inverted {\n  background-color: #fff;\n  color: #ff3860;\n}\n\n.button.is-danger.is-inverted:hover {\n  background-color: #f2f2f2;\n}\n\n.button.is-danger.is-inverted[disabled] {\n  background-color: #fff;\n  border-color: transparent;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #ff3860;\n}\n\n.button.is-danger.is-loading:after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-danger.is-outlined {\n  background-color: transparent;\n  border-color: #ff3860;\n  color: #ff3860;\n}\n\n.button.is-danger.is-outlined:hover, .button.is-danger.is-outlined:focus {\n  background-color: #ff3860;\n  border-color: #ff3860;\n  color: #fff;\n}\n\n.button.is-danger.is-outlined.is-loading:after {\n  border-color: transparent transparent #ff3860 #ff3860 !important;\n}\n\n.button.is-danger.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #ff3860;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #ff3860;\n}\n\n.button.is-danger.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  color: #fff;\n}\n\n.button.is-danger.is-inverted.is-outlined:hover, .button.is-danger.is-inverted.is-outlined:focus {\n  background-color: #fff;\n  color: #ff3860;\n}\n\n.button.is-danger.is-inverted.is-outlined[disabled] {\n  background-color: transparent;\n  border-color: #fff;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #fff;\n}\n\n.button.is-small {\n  border-radius: 2px;\n  font-size: 0.75rem;\n}\n\n.button.is-medium {\n  font-size: 1.25rem;\n}\n\n.button.is-large {\n  font-size: 1.5rem;\n}\n\n.button[disabled] {\n  background-color: white;\n  border-color: #dbdbdb;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  opacity: 0.5;\n}\n\n.button.is-fullwidth {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  width: 100%;\n}\n\n.button.is-loading {\n  color: transparent !important;\n  pointer-events: none;\n}\n\n.button.is-loading:after {\n  -webkit-animation: spinAround 500ms infinite linear;\n          animation: spinAround 500ms infinite linear;\n  border: 2px solid #dbdbdb;\n  border-radius: 290486px;\n  border-right-color: transparent;\n  border-top-color: transparent;\n  content: \"\";\n  display: block;\n  height: 1em;\n  position: relative;\n  width: 1em;\n  position: absolute;\n  left: calc(50% - (1em / 2));\n  top: calc(50% - (1em / 2));\n  position: absolute !important;\n}\n\n.button.is-static {\n  background-color: whitesmoke;\n  border-color: #dbdbdb;\n  color: #7a7a7a;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  pointer-events: none;\n}\n\nbutton.button,\ninput[type=\"submit\"].button {\n  line-height: 1;\n  padding-bottom: 0.4em;\n  padding-top: 0.35em;\n}\n\n.content {\n  color: #4a4a4a;\n}\n\n.content:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.content li + li {\n  margin-top: 0.25em;\n}\n\n.content p:not(:last-child),\n.content dl:not(:last-child),\n.content ol:not(:last-child),\n.content ul:not(:last-child),\n.content blockquote:not(:last-child),\n.content pre:not(:last-child),\n.content table:not(:last-child) {\n  margin-bottom: 1em;\n}\n\n.content h1,\n.content h2,\n.content h3,\n.content h4,\n.content h5,\n.content h6 {\n  color: #363636;\n  font-weight: 400;\n  line-height: 1.125;\n}\n\n.content h1 {\n  font-size: 2em;\n  margin-bottom: 0.5em;\n}\n\n.content h1:not(:first-child) {\n  margin-top: 1em;\n}\n\n.content h2 {\n  font-size: 1.75em;\n  margin-bottom: 0.5714em;\n}\n\n.content h2:not(:first-child) {\n  margin-top: 1.1428em;\n}\n\n.content h3 {\n  font-size: 1.5em;\n  margin-bottom: 0.6666em;\n}\n\n.content h3:not(:first-child) {\n  margin-top: 1.3333em;\n}\n\n.content h4 {\n  font-size: 1.25em;\n  margin-bottom: 0.8em;\n}\n\n.content h5 {\n  font-size: 1.125em;\n  margin-bottom: 0.8888em;\n}\n\n.content h6 {\n  font-size: 1em;\n  margin-bottom: 1em;\n}\n\n.content blockquote {\n  background-color: whitesmoke;\n  border-left: 5px solid #dbdbdb;\n  padding: 1.25em 1.5em;\n}\n\n.content ol {\n  list-style: decimal outside;\n  margin-left: 2em;\n  margin-top: 1em;\n}\n\n.content ul {\n  list-style: disc outside;\n  margin-left: 2em;\n  margin-top: 1em;\n}\n\n.content ul ul {\n  list-style-type: circle;\n  margin-top: 0.5em;\n}\n\n.content ul ul ul {\n  list-style-type: square;\n}\n\n.content dd {\n  margin-left: 2em;\n}\n\n.content figure {\n  text-align: center;\n}\n\n.content figure img {\n  display: inline-block;\n}\n\n.content figure figcaption {\n  font-style: italic;\n}\n\n.content pre {\n  -webkit-overflow-scrolling: touch;\n  overflow-x: auto;\n  padding: 1.25em 1.5em;\n  white-space: pre;\n  word-wrap: normal;\n}\n\n.content sup,\n.content sub {\n  font-size: 70%;\n}\n\n.content table {\n  width: 100%;\n}\n\n.content table td,\n.content table th {\n  border: 1px solid #dbdbdb;\n  border-width: 0 0 1px;\n  padding: 0.5em 0.75em;\n  vertical-align: top;\n}\n\n.content table th {\n  color: #363636;\n  text-align: left;\n}\n\n.content table tr:hover {\n  background-color: whitesmoke;\n}\n\n.content table thead td,\n.content table thead th {\n  border-width: 0 0 2px;\n  color: #363636;\n}\n\n.content table tfoot td,\n.content table tfoot th {\n  border-width: 2px 0 0;\n  color: #363636;\n}\n\n.content table tbody tr:last-child td,\n.content table tbody tr:last-child th {\n  border-bottom-width: 0;\n}\n\n.content.is-small {\n  font-size: 0.75rem;\n}\n\n.content.is-medium {\n  font-size: 1.25rem;\n}\n\n.content.is-large {\n  font-size: 1.5rem;\n}\n\n.input,\n.textarea {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  border: 1px solid transparent;\n  border-radius: 3px;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n  font-size: 1rem;\n  height: 2.25em;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n  line-height: 1.5;\n  padding-bottom: calc(0.375em - 1px);\n  padding-left: calc(0.625em - 1px);\n  padding-right: calc(0.625em - 1px);\n  padding-top: calc(0.375em - 1px);\n  position: relative;\n  vertical-align: top;\n  background-color: white;\n  border-color: #dbdbdb;\n  color: #363636;\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.1);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.1);\n  max-width: 100%;\n  width: 100%;\n}\n\n.input:focus, .input.is-focused, .input:active, .input.is-active,\n.textarea:focus,\n.textarea.is-focused,\n.textarea:active,\n.textarea.is-active {\n  outline: none;\n}\n\n.input[disabled],\n.textarea[disabled] {\n  cursor: not-allowed;\n}\n\n.input:hover, .input.is-hovered,\n.textarea:hover,\n.textarea.is-hovered {\n  border-color: #b5b5b5;\n}\n\n.input:focus, .input.is-focused, .input:active, .input.is-active,\n.textarea:focus,\n.textarea.is-focused,\n.textarea:active,\n.textarea.is-active {\n  border-color: #00d1b2;\n}\n\n.input[disabled],\n.textarea[disabled] {\n  background-color: whitesmoke;\n  border-color: whitesmoke;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #7a7a7a;\n}\n\n.input[disabled]::-moz-placeholder,\n.textarea[disabled]::-moz-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.input[disabled]::-webkit-input-placeholder,\n.textarea[disabled]::-webkit-input-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.input[disabled]:-moz-placeholder,\n.textarea[disabled]:-moz-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.input[disabled]:-ms-input-placeholder,\n.textarea[disabled]:-ms-input-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.input[type=\"search\"],\n.textarea[type=\"search\"] {\n  border-radius: 290486px;\n}\n\n.input.is-white,\n.textarea.is-white {\n  border-color: white;\n}\n\n.input.is-black,\n.textarea.is-black {\n  border-color: #0a0a0a;\n}\n\n.input.is-light,\n.textarea.is-light {\n  border-color: whitesmoke;\n}\n\n.input.is-dark,\n.textarea.is-dark {\n  border-color: #363636;\n}\n\n.input.is-primary,\n.textarea.is-primary {\n  border-color: #00d1b2;\n}\n\n.input.is-info,\n.textarea.is-info {\n  border-color: #3273dc;\n}\n\n.input.is-success,\n.textarea.is-success {\n  border-color: #23d160;\n}\n\n.input.is-warning,\n.textarea.is-warning {\n  border-color: #ffdd57;\n}\n\n.input.is-danger,\n.textarea.is-danger {\n  border-color: #ff3860;\n}\n\n.input.is-small,\n.textarea.is-small {\n  border-radius: 2px;\n  font-size: 0.75rem;\n}\n\n.input.is-medium,\n.textarea.is-medium {\n  font-size: 1.25rem;\n}\n\n.input.is-large,\n.textarea.is-large {\n  font-size: 1.5rem;\n}\n\n.input.is-fullwidth,\n.textarea.is-fullwidth {\n  display: block;\n  width: 100%;\n}\n\n.input.is-inline,\n.textarea.is-inline {\n  display: inline;\n  width: auto;\n}\n\n.textarea {\n  display: block;\n  max-height: 600px;\n  max-width: 100%;\n  min-height: 120px;\n  min-width: 100%;\n  padding: 0.625em;\n  resize: vertical;\n}\n\n.checkbox,\n.radio {\n  cursor: pointer;\n  display: inline-block;\n  line-height: 1.25;\n  position: relative;\n}\n\n.checkbox input,\n.radio input {\n  cursor: pointer;\n}\n\n.checkbox:hover,\n.radio:hover {\n  color: #363636;\n}\n\n.checkbox[disabled],\n.radio[disabled] {\n  color: #7a7a7a;\n  cursor: not-allowed;\n}\n\n.radio + .radio {\n  margin-left: 0.5em;\n}\n\n.select {\n  display: inline-block;\n  height: 2.25em;\n  max-width: 100%;\n  position: relative;\n  vertical-align: top;\n}\n\n.select:after {\n  border: 1px solid #00d1b2;\n  border-right: 0;\n  border-top: 0;\n  content: \" \";\n  display: block;\n  height: 0.5em;\n  pointer-events: none;\n  position: absolute;\n  -webkit-transform: rotate(-45deg);\n          transform: rotate(-45deg);\n  width: 0.5em;\n  margin-top: -0.375em;\n  right: 1.125em;\n  top: 50%;\n  z-index: 4;\n}\n\n.select select {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  border: 1px solid transparent;\n  border-radius: 3px;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n  font-size: 1rem;\n  height: 2.25em;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n  line-height: 1.5;\n  padding-bottom: calc(0.375em - 1px);\n  padding-left: calc(0.625em - 1px);\n  padding-right: calc(0.625em - 1px);\n  padding-top: calc(0.375em - 1px);\n  position: relative;\n  vertical-align: top;\n  background-color: white;\n  border-color: #dbdbdb;\n  color: #363636;\n  cursor: pointer;\n  display: block;\n  font-size: 1em;\n  max-width: 100%;\n  outline: none;\n  padding-right: 2.5em;\n}\n\n.select select:focus, .select select.is-focused, .select select:active, .select select.is-active {\n  outline: none;\n}\n\n.select select[disabled] {\n  cursor: not-allowed;\n}\n\n.select select:hover, .select select.is-hovered {\n  border-color: #b5b5b5;\n}\n\n.select select:focus, .select select.is-focused, .select select:active, .select select.is-active {\n  border-color: #00d1b2;\n}\n\n.select select[disabled] {\n  background-color: whitesmoke;\n  border-color: whitesmoke;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #7a7a7a;\n}\n\n.select select[disabled]::-moz-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.select select[disabled]::-webkit-input-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.select select[disabled]:-moz-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.select select[disabled]:-ms-input-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.select select:hover {\n  border-color: #b5b5b5;\n}\n\n.select select::-ms-expand {\n  display: none;\n}\n\n.select select[disabled]:hover {\n  border-color: whitesmoke;\n}\n\n.select:hover:after {\n  border-color: #363636;\n}\n\n.select.is-white select {\n  border-color: white;\n}\n\n.select.is-black select {\n  border-color: #0a0a0a;\n}\n\n.select.is-light select {\n  border-color: whitesmoke;\n}\n\n.select.is-dark select {\n  border-color: #363636;\n}\n\n.select.is-primary select {\n  border-color: #00d1b2;\n}\n\n.select.is-info select {\n  border-color: #3273dc;\n}\n\n.select.is-success select {\n  border-color: #23d160;\n}\n\n.select.is-warning select {\n  border-color: #ffdd57;\n}\n\n.select.is-danger select {\n  border-color: #ff3860;\n}\n\n.select.is-small {\n  border-radius: 2px;\n  font-size: 0.75rem;\n}\n\n.select.is-medium {\n  font-size: 1.25rem;\n}\n\n.select.is-large {\n  font-size: 1.5rem;\n}\n\n.select.is-disabled:after {\n  border-color: #7a7a7a;\n}\n\n.select.is-fullwidth {\n  width: 100%;\n}\n\n.select.is-fullwidth select {\n  width: 100%;\n}\n\n.select.is-loading:after {\n  -webkit-animation: spinAround 500ms infinite linear;\n          animation: spinAround 500ms infinite linear;\n  border: 2px solid #dbdbdb;\n  border-radius: 290486px;\n  border-right-color: transparent;\n  border-top-color: transparent;\n  content: \"\";\n  display: block;\n  height: 1em;\n  position: relative;\n  width: 1em;\n  margin-top: 0;\n  position: absolute;\n  right: 0.625em;\n  top: 0.625em;\n  -webkit-transform: none;\n          transform: none;\n}\n\n.select.is-loading.is-small:after {\n  font-size: 0.75rem;\n}\n\n.select.is-loading.is-medium:after {\n  font-size: 1.25rem;\n}\n\n.select.is-loading.is-large:after {\n  font-size: 1.5rem;\n}\n\n.label {\n  color: #363636;\n  display: block;\n  font-size: 1rem;\n  font-weight: 700;\n}\n\n.label:not(:last-child) {\n  margin-bottom: 0.5em;\n}\n\n.label.is-small {\n  font-size: 0.75rem;\n}\n\n.label.is-medium {\n  font-size: 1.25rem;\n}\n\n.label.is-large {\n  font-size: 1.5rem;\n}\n\n.help {\n  display: block;\n  font-size: 0.75rem;\n  margin-top: 0.25rem;\n}\n\n.help.is-white {\n  color: white;\n}\n\n.help.is-black {\n  color: #0a0a0a;\n}\n\n.help.is-light {\n  color: whitesmoke;\n}\n\n.help.is-dark {\n  color: #363636;\n}\n\n.help.is-primary {\n  color: #00d1b2;\n}\n\n.help.is-info {\n  color: #3273dc;\n}\n\n.help.is-success {\n  color: #23d160;\n}\n\n.help.is-warning {\n  color: #ffdd57;\n}\n\n.help.is-danger {\n  color: #ff3860;\n}\n\n.field:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.field.has-addons {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n}\n\n.field.has-addons .control {\n  margin-right: -1px;\n}\n\n.field.has-addons .control:first-child .button,\n.field.has-addons .control:first-child .input,\n.field.has-addons .control:first-child .select select {\n  border-bottom-left-radius: 3px;\n  border-top-left-radius: 3px;\n}\n\n.field.has-addons .control:last-child .button,\n.field.has-addons .control:last-child .input,\n.field.has-addons .control:last-child .select select {\n  border-bottom-right-radius: 3px;\n  border-top-right-radius: 3px;\n}\n\n.field.has-addons .control .button,\n.field.has-addons .control .input,\n.field.has-addons .control .select select {\n  border-radius: 0;\n}\n\n.field.has-addons .control .button:hover, .field.has-addons .control .button.is-hovered,\n.field.has-addons .control .input:hover,\n.field.has-addons .control .input.is-hovered,\n.field.has-addons .control .select select:hover,\n.field.has-addons .control .select select.is-hovered {\n  z-index: 2;\n}\n\n.field.has-addons .control .button:focus, .field.has-addons .control .button.is-focused, .field.has-addons .control .button:active, .field.has-addons .control .button.is-active,\n.field.has-addons .control .input:focus,\n.field.has-addons .control .input.is-focused,\n.field.has-addons .control .input:active,\n.field.has-addons .control .input.is-active,\n.field.has-addons .control .select select:focus,\n.field.has-addons .control .select select.is-focused,\n.field.has-addons .control .select select:active,\n.field.has-addons .control .select select.is-active {\n  z-index: 3;\n}\n\n.field.has-addons .control .button:focus:hover, .field.has-addons .control .button.is-focused:hover, .field.has-addons .control .button:active:hover, .field.has-addons .control .button.is-active:hover,\n.field.has-addons .control .input:focus:hover,\n.field.has-addons .control .input.is-focused:hover,\n.field.has-addons .control .input:active:hover,\n.field.has-addons .control .input.is-active:hover,\n.field.has-addons .control .select select:focus:hover,\n.field.has-addons .control .select select.is-focused:hover,\n.field.has-addons .control .select select:active:hover,\n.field.has-addons .control .select select.is-active:hover {\n  z-index: 4;\n}\n\n.field.has-addons .control.is-expanded {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n}\n\n.field.has-addons.has-addons-centered {\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n}\n\n.field.has-addons.has-addons-right {\n  -webkit-box-pack: end;\n      -ms-flex-pack: end;\n          justify-content: flex-end;\n}\n\n.field.has-addons.has-addons-fullwidth .control {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n}\n\n.field.is-grouped {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n}\n\n.field.is-grouped > .control {\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n}\n\n.field.is-grouped > .control:not(:last-child) {\n  margin-bottom: 0;\n  margin-right: 0.75rem;\n}\n\n.field.is-grouped > .control.is-expanded {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 1;\n      flex-shrink: 1;\n}\n\n.field.is-grouped.is-grouped-centered {\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n}\n\n.field.is-grouped.is-grouped-right {\n  -webkit-box-pack: end;\n      -ms-flex-pack: end;\n          justify-content: flex-end;\n}\n\n@media screen and (min-width: 769px), print {\n  .field.is-horizontal {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n}\n\n.field-label .label {\n  font-size: inherit;\n}\n\n@media screen and (max-width: 768px) {\n  .field-label {\n    margin-bottom: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .field-label {\n    -ms-flex-preferred-size: 0;\n        flex-basis: 0;\n    -webkit-box-flex: 1;\n        -ms-flex-positive: 1;\n            flex-grow: 1;\n    -ms-flex-negative: 0;\n        flex-shrink: 0;\n    margin-right: 1.5rem;\n    text-align: right;\n  }\n  .field-label.is-small {\n    font-size: 0.75rem;\n    padding-top: 0.375em;\n  }\n  .field-label.is-normal {\n    padding-top: 0.375em;\n  }\n  .field-label.is-medium {\n    font-size: 1.25rem;\n    padding-top: 0.375em;\n  }\n  .field-label.is-large {\n    font-size: 1.5rem;\n    padding-top: 0.375em;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .field-body {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n    -ms-flex-preferred-size: 0;\n        flex-basis: 0;\n    -webkit-box-flex: 5;\n        -ms-flex-positive: 5;\n            flex-grow: 5;\n    -ms-flex-negative: 1;\n        flex-shrink: 1;\n  }\n  .field-body .field {\n    -ms-flex-negative: 1;\n        flex-shrink: 1;\n  }\n  .field-body .field:not(.is-narrow) {\n    -webkit-box-flex: 1;\n        -ms-flex-positive: 1;\n            flex-grow: 1;\n  }\n  .field-body .field:not(:last-child) {\n    margin-bottom: 0;\n    margin-right: 0.75rem;\n  }\n}\n\n.control {\n  font-size: 1rem;\n  position: relative;\n  text-align: left;\n}\n\n.control.has-icon .icon {\n  color: #dbdbdb;\n  height: 2.25em;\n  pointer-events: none;\n  position: absolute;\n  top: 0;\n  width: 2.25em;\n  z-index: 4;\n}\n\n.control.has-icon .input:focus + .icon {\n  color: #7a7a7a;\n}\n\n.control.has-icon .input.is-small + .icon {\n  font-size: 0.75rem;\n}\n\n.control.has-icon .input.is-medium + .icon {\n  font-size: 1.25rem;\n}\n\n.control.has-icon .input.is-large + .icon {\n  font-size: 1.5rem;\n}\n\n.control.has-icon:not(.has-icon-right) .icon {\n  left: 0;\n}\n\n.control.has-icon:not(.has-icon-right) .input {\n  padding-left: 2.25em;\n}\n\n.control.has-icon.has-icon-right .icon {\n  right: 0;\n}\n\n.control.has-icon.has-icon-right .input {\n  padding-right: 2.25em;\n}\n\n.control.has-icons-left .input:focus ~ .icon,\n.control.has-icons-left .select select:focus ~ .icon, .control.has-icons-right .input:focus ~ .icon,\n.control.has-icons-right .select select:focus ~ .icon {\n  color: #7a7a7a;\n}\n\n.control.has-icons-left .input.is-small ~ .icon,\n.control.has-icons-left .select select.is-small ~ .icon, .control.has-icons-right .input.is-small ~ .icon,\n.control.has-icons-right .select select.is-small ~ .icon {\n  font-size: 0.75rem;\n}\n\n.control.has-icons-left .input.is-medium ~ .icon,\n.control.has-icons-left .select select.is-medium ~ .icon, .control.has-icons-right .input.is-medium ~ .icon,\n.control.has-icons-right .select select.is-medium ~ .icon {\n  font-size: 1.25rem;\n}\n\n.control.has-icons-left .input.is-large ~ .icon,\n.control.has-icons-left .select select.is-large ~ .icon, .control.has-icons-right .input.is-large ~ .icon,\n.control.has-icons-right .select select.is-large ~ .icon {\n  font-size: 1.5rem;\n}\n\n.control.has-icons-left .icon, .control.has-icons-right .icon {\n  color: #dbdbdb;\n  height: 2.25em;\n  pointer-events: none;\n  position: absolute;\n  top: 0;\n  width: 2.25em;\n  z-index: 4;\n}\n\n.control.has-icons-left .input,\n.control.has-icons-left .select select {\n  padding-left: 2.25em;\n}\n\n.control.has-icons-left .icon.is-left {\n  left: 0;\n}\n\n.control.has-icons-right .input,\n.control.has-icons-right .select select {\n  padding-right: 2.25em;\n}\n\n.control.has-icons-right .icon.is-right {\n  right: 0;\n}\n\n.control.is-loading:after {\n  -webkit-animation: spinAround 500ms infinite linear;\n          animation: spinAround 500ms infinite linear;\n  border: 2px solid #dbdbdb;\n  border-radius: 290486px;\n  border-right-color: transparent;\n  border-top-color: transparent;\n  content: \"\";\n  display: block;\n  height: 1em;\n  position: relative;\n  width: 1em;\n  position: absolute !important;\n  right: 0.625em;\n  top: 0.625em;\n}\n\n.control.is-loading.is-small:after {\n  font-size: 0.75rem;\n}\n\n.control.is-loading.is-medium:after {\n  font-size: 1.25rem;\n}\n\n.control.is-loading.is-large:after {\n  font-size: 1.5rem;\n}\n\n.icon {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  height: 1.5rem;\n  width: 1.5rem;\n}\n\n.icon .fa {\n  font-size: 21px;\n}\n\n.icon.is-small {\n  height: 1rem;\n  width: 1rem;\n}\n\n.icon.is-small .fa {\n  font-size: 14px;\n}\n\n.icon.is-medium {\n  height: 2rem;\n  width: 2rem;\n}\n\n.icon.is-medium .fa {\n  font-size: 28px;\n}\n\n.icon.is-large {\n  height: 3rem;\n  width: 3rem;\n}\n\n.icon.is-large .fa {\n  font-size: 42px;\n}\n\n.image {\n  display: block;\n  position: relative;\n}\n\n.image img {\n  display: block;\n  height: auto;\n  width: 100%;\n}\n\n.image.is-square img, .image.is-1by1 img, .image.is-4by3 img, .image.is-3by2 img, .image.is-16by9 img, .image.is-2by1 img {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  height: 100%;\n  width: 100%;\n}\n\n.image.is-square, .image.is-1by1 {\n  padding-top: 100%;\n}\n\n.image.is-4by3 {\n  padding-top: 75%;\n}\n\n.image.is-3by2 {\n  padding-top: 66.6666%;\n}\n\n.image.is-16by9 {\n  padding-top: 56.25%;\n}\n\n.image.is-2by1 {\n  padding-top: 50%;\n}\n\n.image.is-16x16 {\n  height: 16px;\n  width: 16px;\n}\n\n.image.is-24x24 {\n  height: 24px;\n  width: 24px;\n}\n\n.image.is-32x32 {\n  height: 32px;\n  width: 32px;\n}\n\n.image.is-48x48 {\n  height: 48px;\n  width: 48px;\n}\n\n.image.is-64x64 {\n  height: 64px;\n  width: 64px;\n}\n\n.image.is-96x96 {\n  height: 96px;\n  width: 96px;\n}\n\n.image.is-128x128 {\n  height: 128px;\n  width: 128px;\n}\n\n.notification {\n  background-color: whitesmoke;\n  border-radius: 3px;\n  padding: 1.25rem 2.5rem 1.25rem 1.5rem;\n  position: relative;\n}\n\n.notification:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.notification a:not(.button) {\n  color: currentColor;\n  text-decoration: underline;\n}\n\n.notification code,\n.notification pre {\n  background: white;\n}\n\n.notification pre code {\n  background: transparent;\n}\n\n.notification > .delete {\n  position: absolute;\n  right: 0.5em;\n  top: 0.5em;\n}\n\n.notification .title,\n.notification .subtitle,\n.notification .content {\n  color: inherit;\n}\n\n.notification.is-white {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.notification.is-black {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.notification.is-light {\n  background-color: whitesmoke;\n  color: #363636;\n}\n\n.notification.is-dark {\n  background-color: #363636;\n  color: whitesmoke;\n}\n\n.notification.is-primary {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.notification.is-info {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.notification.is-success {\n  background-color: #23d160;\n  color: #fff;\n}\n\n.notification.is-warning {\n  background-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.notification.is-danger {\n  background-color: #ff3860;\n  color: #fff;\n}\n\n.progress {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  border: none;\n  border-radius: 290486px;\n  display: block;\n  height: 1rem;\n  overflow: hidden;\n  padding: 0;\n  width: 100%;\n}\n\n.progress:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.progress::-webkit-progress-bar {\n  background-color: #dbdbdb;\n}\n\n.progress::-webkit-progress-value {\n  background-color: #4a4a4a;\n}\n\n.progress::-moz-progress-bar {\n  background-color: #4a4a4a;\n}\n\n.progress.is-white::-webkit-progress-value {\n  background-color: white;\n}\n\n.progress.is-white::-moz-progress-bar {\n  background-color: white;\n}\n\n.progress.is-black::-webkit-progress-value {\n  background-color: #0a0a0a;\n}\n\n.progress.is-black::-moz-progress-bar {\n  background-color: #0a0a0a;\n}\n\n.progress.is-light::-webkit-progress-value {\n  background-color: whitesmoke;\n}\n\n.progress.is-light::-moz-progress-bar {\n  background-color: whitesmoke;\n}\n\n.progress.is-dark::-webkit-progress-value {\n  background-color: #363636;\n}\n\n.progress.is-dark::-moz-progress-bar {\n  background-color: #363636;\n}\n\n.progress.is-primary::-webkit-progress-value {\n  background-color: #00d1b2;\n}\n\n.progress.is-primary::-moz-progress-bar {\n  background-color: #00d1b2;\n}\n\n.progress.is-info::-webkit-progress-value {\n  background-color: #3273dc;\n}\n\n.progress.is-info::-moz-progress-bar {\n  background-color: #3273dc;\n}\n\n.progress.is-success::-webkit-progress-value {\n  background-color: #23d160;\n}\n\n.progress.is-success::-moz-progress-bar {\n  background-color: #23d160;\n}\n\n.progress.is-warning::-webkit-progress-value {\n  background-color: #ffdd57;\n}\n\n.progress.is-warning::-moz-progress-bar {\n  background-color: #ffdd57;\n}\n\n.progress.is-danger::-webkit-progress-value {\n  background-color: #ff3860;\n}\n\n.progress.is-danger::-moz-progress-bar {\n  background-color: #ff3860;\n}\n\n.progress.is-small {\n  height: 0.75rem;\n}\n\n.progress.is-medium {\n  height: 1.25rem;\n}\n\n.progress.is-large {\n  height: 1.5rem;\n}\n\n.table {\n  background-color: white;\n  color: #363636;\n  margin-bottom: 1.5rem;\n  width: 100%;\n}\n\n.table td,\n.table th {\n  border: 1px solid #dbdbdb;\n  border-width: 0 0 1px;\n  padding: 0.5em 0.75em;\n  vertical-align: top;\n}\n\n.table td.is-narrow,\n.table th.is-narrow {\n  white-space: nowrap;\n  width: 1%;\n}\n\n.table th {\n  color: #363636;\n  text-align: left;\n}\n\n.table tr:hover {\n  background-color: #fafafa;\n}\n\n.table tr.is-selected {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.table tr.is-selected a,\n.table tr.is-selected strong {\n  color: currentColor;\n}\n\n.table tr.is-selected td,\n.table tr.is-selected th {\n  border-color: #fff;\n  color: currentColor;\n}\n\n.table thead td,\n.table thead th {\n  border-width: 0 0 2px;\n  color: #7a7a7a;\n}\n\n.table tfoot td,\n.table tfoot th {\n  border-width: 2px 0 0;\n  color: #7a7a7a;\n}\n\n.table tbody tr:last-child td,\n.table tbody tr:last-child th {\n  border-bottom-width: 0;\n}\n\n.table.is-bordered td,\n.table.is-bordered th {\n  border-width: 1px;\n}\n\n.table.is-bordered tr:last-child td,\n.table.is-bordered tr:last-child th {\n  border-bottom-width: 1px;\n}\n\n.table.is-narrow td,\n.table.is-narrow th {\n  padding: 0.25em 0.5em;\n}\n\n.table.is-striped tbody tr:not(.is-selected):nth-child(even) {\n  background-color: #fafafa;\n}\n\n.table.is-striped tbody tr:not(.is-selected):nth-child(even):hover {\n  background-color: whitesmoke;\n}\n\n.tag {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  background-color: whitesmoke;\n  border-radius: 290486px;\n  color: #4a4a4a;\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n  font-size: 0.75rem;\n  height: 2em;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  line-height: 1.5;\n  padding-left: 0.875em;\n  padding-right: 0.875em;\n  white-space: nowrap;\n}\n\n.tag .delete {\n  margin-left: 0.25em;\n  margin-right: -0.375em;\n}\n\n.tag.is-white {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.tag.is-black {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.tag.is-light {\n  background-color: whitesmoke;\n  color: #363636;\n}\n\n.tag.is-dark {\n  background-color: #363636;\n  color: whitesmoke;\n}\n\n.tag.is-primary {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.tag.is-info {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.tag.is-success {\n  background-color: #23d160;\n  color: #fff;\n}\n\n.tag.is-warning {\n  background-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.tag.is-danger {\n  background-color: #ff3860;\n  color: #fff;\n}\n\n.tag.is-medium {\n  font-size: 1rem;\n}\n\n.tag.is-large {\n  font-size: 1.25rem;\n}\n\n.title,\n.subtitle {\n  word-break: break-word;\n}\n\n.title:not(:last-child),\n.subtitle:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.title em,\n.title span,\n.subtitle em,\n.subtitle span {\n  font-weight: 300;\n}\n\n.title strong,\n.subtitle strong {\n  font-weight: 500;\n}\n\n.title .tag,\n.subtitle .tag {\n  vertical-align: middle;\n}\n\n.title {\n  color: #363636;\n  font-size: 2rem;\n  font-weight: 300;\n  line-height: 1.125;\n}\n\n.title strong {\n  color: inherit;\n}\n\n.title + .highlight {\n  margin-top: -0.75rem;\n}\n\n.title:not(.is-spaced) + .subtitle {\n  margin-top: -1.5rem;\n}\n\n.title.is-1 {\n  font-size: 3rem;\n}\n\n.title.is-2 {\n  font-size: 2.5rem;\n}\n\n.title.is-3 {\n  font-size: 2rem;\n}\n\n.title.is-4 {\n  font-size: 1.5rem;\n}\n\n.title.is-5 {\n  font-size: 1.25rem;\n}\n\n.title.is-6 {\n  font-size: 1rem;\n}\n\n.subtitle {\n  color: #4a4a4a;\n  font-size: 1.25rem;\n  font-weight: 300;\n  line-height: 1.25;\n}\n\n.subtitle strong {\n  color: #363636;\n}\n\n.subtitle:not(.is-spaced) + .title {\n  margin-top: -1.5rem;\n}\n\n.subtitle.is-1 {\n  font-size: 3rem;\n}\n\n.subtitle.is-2 {\n  font-size: 2.5rem;\n}\n\n.subtitle.is-3 {\n  font-size: 2rem;\n}\n\n.subtitle.is-4 {\n  font-size: 1.5rem;\n}\n\n.subtitle.is-5 {\n  font-size: 1.25rem;\n}\n\n.subtitle.is-6 {\n  font-size: 1rem;\n}\n\n.block:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.container {\n  position: relative;\n}\n\n@media screen and (min-width: 1000px) {\n  .container {\n    margin: 0 auto;\n    max-width: 960px;\n    width: 960px;\n  }\n  .container.is-fluid {\n    margin: 0 20px;\n    max-width: none;\n    width: auto;\n  }\n}\n\n@media screen and (min-width: 1192px) {\n  .container {\n    max-width: 1152px;\n    width: 1152px;\n  }\n}\n\n@media screen and (min-width: 1384px) {\n  .container {\n    max-width: 1344px;\n    width: 1344px;\n  }\n}\n\n.delete {\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  background-color: rgba(10, 10, 10, 0.2);\n  border: none;\n  border-radius: 290486px;\n  cursor: pointer;\n  display: inline-block;\n  -webkit-box-flex: 0;\n      -ms-flex-positive: 0;\n          flex-grow: 0;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  font-size: 1rem;\n  height: 20px;\n  max-height: 20px;\n  max-width: 20px;\n  min-height: 20px;\n  min-width: 20px;\n  outline: none;\n  position: relative;\n  vertical-align: top;\n  width: 20px;\n}\n\n.delete:before, .delete:after {\n  background-color: white;\n  content: \"\";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  -webkit-transform: translateX(-50%) translateY(-50%) rotate(45deg);\n          transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  -webkit-transform-origin: center center;\n          transform-origin: center center;\n}\n\n.delete:before {\n  height: 2px;\n  width: 50%;\n}\n\n.delete:after {\n  height: 50%;\n  width: 2px;\n}\n\n.delete:hover, .delete:focus {\n  background-color: rgba(10, 10, 10, 0.3);\n}\n\n.delete:active {\n  background-color: rgba(10, 10, 10, 0.4);\n}\n\n.delete.is-small {\n  height: 16px;\n  max-height: 16px;\n  max-width: 16px;\n  min-height: 16px;\n  min-width: 16px;\n  width: 16px;\n}\n\n.delete.is-medium {\n  height: 24px;\n  max-height: 24px;\n  max-width: 24px;\n  min-height: 24px;\n  min-width: 24px;\n  width: 24px;\n}\n\n.delete.is-large {\n  height: 32px;\n  max-height: 32px;\n  max-width: 32px;\n  min-height: 32px;\n  min-width: 32px;\n  width: 32px;\n}\n\n.fa {\n  font-size: 21px;\n  text-align: center;\n  vertical-align: top;\n}\n\n.heading {\n  display: block;\n  font-size: 11px;\n  letter-spacing: 1px;\n  margin-bottom: 5px;\n  text-transform: uppercase;\n}\n\n.highlight {\n  font-weight: 400;\n  max-width: 100%;\n  overflow: hidden;\n  padding: 0;\n}\n\n.highlight:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.highlight pre {\n  overflow: auto;\n  max-width: 100%;\n}\n\n.loader {\n  -webkit-animation: spinAround 500ms infinite linear;\n          animation: spinAround 500ms infinite linear;\n  border: 2px solid #dbdbdb;\n  border-radius: 290486px;\n  border-right-color: transparent;\n  border-top-color: transparent;\n  content: \"\";\n  display: block;\n  height: 1em;\n  position: relative;\n  width: 1em;\n}\n\n.number {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  background-color: whitesmoke;\n  border-radius: 290486px;\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n  font-size: 1.25rem;\n  height: 2em;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  margin-right: 1.5rem;\n  min-width: 2.5em;\n  padding: 0.25rem 0.5rem;\n  text-align: center;\n  vertical-align: top;\n}\n\n.breadcrumb {\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  font-size: 1rem;\n  overflow: hidden;\n  overflow-x: auto;\n  white-space: nowrap;\n}\n\n.breadcrumb:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.breadcrumb a {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  color: #7a7a7a;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  padding: 0.5em 0.75em;\n}\n\n.breadcrumb a:hover {\n  color: #363636;\n}\n\n.breadcrumb li {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n}\n\n.breadcrumb li.is-active a {\n  color: #363636;\n  cursor: default;\n  pointer-events: none;\n}\n\n.breadcrumb li + li:before {\n  color: #4a4a4a;\n  content: '/';\n}\n\n.breadcrumb ul, .breadcrumb ol {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n}\n\n.breadcrumb .icon:first-child {\n  margin-right: 0.5em;\n}\n\n.breadcrumb .icon:last-child {\n  margin-left: 0.5em;\n}\n\n.breadcrumb.is-centered ol, .breadcrumb.is-centered ul {\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n}\n\n.breadcrumb.is-right ol, .breadcrumb.is-right ul {\n  -webkit-box-pack: end;\n      -ms-flex-pack: end;\n          justify-content: flex-end;\n}\n\n.breadcrumb.is-small {\n  font-size: 0.75rem;\n}\n\n.breadcrumb.is-medium {\n  font-size: 1.25rem;\n}\n\n.breadcrumb.is-large {\n  font-size: 1.5rem;\n}\n\n.breadcrumb.has-arrow-separator li + li:before {\n  content: '\\2192';\n}\n\n.breadcrumb.has-bullet-separator li + li:before {\n  content: '\\2022';\n}\n\n.breadcrumb.has-dot-separator li + li:before {\n  content: '\\B7';\n}\n\n.breadcrumb.has-succeeds-separator li + li:before {\n  content: '\\227B';\n}\n\n.card-header {\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  -webkit-box-shadow: 0 1px 2px rgba(10, 10, 10, 0.1);\n          box-shadow: 0 1px 2px rgba(10, 10, 10, 0.1);\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n}\n\n.card-header-title {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  color: #363636;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  font-weight: 700;\n  padding: 0.75rem;\n}\n\n.card-header-icon {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  cursor: pointer;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  padding: 0.75rem;\n}\n\n.card-image {\n  display: block;\n  position: relative;\n}\n\n.card-content {\n  padding: 1.5rem;\n}\n\n.card-footer {\n  border-top: 1px solid #dbdbdb;\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n}\n\n.card-footer-item {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -ms-flex-preferred-size: 0;\n      flex-basis: 0;\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  padding: 0.75rem;\n}\n\n.card-footer-item:not(:last-child) {\n  border-right: 1px solid #dbdbdb;\n}\n\n.card {\n  background-color: white;\n  -webkit-box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);\n          box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);\n  color: #4a4a4a;\n  max-width: 100%;\n  position: relative;\n}\n\n.card .media:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.level-item {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -ms-flex-preferred-size: auto;\n      flex-basis: auto;\n  -webkit-box-flex: 0;\n      -ms-flex-positive: 0;\n          flex-grow: 0;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n}\n\n.level-item .title,\n.level-item .subtitle {\n  margin-bottom: 0;\n}\n\n@media screen and (max-width: 768px) {\n  .level-item:not(:last-child) {\n    margin-bottom: 0.75rem;\n  }\n}\n\n.level-left,\n.level-right {\n  -ms-flex-preferred-size: auto;\n      flex-basis: auto;\n  -webkit-box-flex: 0;\n      -ms-flex-positive: 0;\n          flex-grow: 0;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n}\n\n.level-left .level-item:not(:last-child),\n.level-right .level-item:not(:last-child) {\n  margin-right: 0.75rem;\n}\n\n.level-left .level-item.is-flexible,\n.level-right .level-item.is-flexible {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n}\n\n.level-left {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n}\n\n@media screen and (max-width: 768px) {\n  .level-left + .level-right {\n    margin-top: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .level-left {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n}\n\n.level-right {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  -webkit-box-pack: end;\n      -ms-flex-pack: end;\n          justify-content: flex-end;\n}\n\n@media screen and (min-width: 769px), print {\n  .level-right {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n}\n\n.level {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  -webkit-box-pack: justify;\n      -ms-flex-pack: justify;\n          justify-content: space-between;\n}\n\n.level:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.level code {\n  border-radius: 3px;\n}\n\n.level img {\n  display: inline-block;\n  vertical-align: top;\n}\n\n.level.is-mobile {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n}\n\n.level.is-mobile .level-left,\n.level.is-mobile .level-right {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n}\n\n.level.is-mobile .level-left + .level-right {\n  margin-top: 0;\n}\n\n.level.is-mobile .level-item:not(:last-child) {\n  margin-bottom: 0;\n}\n\n.level.is-mobile .level-item:not(.is-narrow) {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n}\n\n@media screen and (min-width: 769px), print {\n  .level {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n  .level > .level-item:not(.is-narrow) {\n    -webkit-box-flex: 1;\n        -ms-flex-positive: 1;\n            flex-grow: 1;\n  }\n}\n\n.media-left,\n.media-right {\n  -ms-flex-preferred-size: auto;\n      flex-basis: auto;\n  -webkit-box-flex: 0;\n      -ms-flex-positive: 0;\n          flex-grow: 0;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n}\n\n.media-left {\n  margin-right: 1rem;\n}\n\n.media-right {\n  margin-left: 1rem;\n}\n\n.media-content {\n  -ms-flex-preferred-size: auto;\n      flex-basis: auto;\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 1;\n      flex-shrink: 1;\n  text-align: left;\n}\n\n.media {\n  -webkit-box-align: start;\n      -ms-flex-align: start;\n          align-items: flex-start;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  text-align: left;\n}\n\n.media .content:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.media .media {\n  border-top: 1px solid rgba(219, 219, 219, 0.5);\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  padding-top: 0.75rem;\n}\n\n.media .media .content:not(:last-child),\n.media .media .control:not(:last-child) {\n  margin-bottom: 0.5rem;\n}\n\n.media .media .media {\n  padding-top: 0.5rem;\n}\n\n.media .media .media + .media {\n  margin-top: 0.5rem;\n}\n\n.media + .media {\n  border-top: 1px solid rgba(219, 219, 219, 0.5);\n  margin-top: 1rem;\n  padding-top: 1rem;\n}\n\n.media.is-large + .media {\n  margin-top: 1.5rem;\n  padding-top: 1.5rem;\n}\n\n.menu {\n  font-size: 1rem;\n}\n\n.menu-list {\n  line-height: 1.25;\n}\n\n.menu-list a {\n  border-radius: 2px;\n  color: #4a4a4a;\n  display: block;\n  padding: 0.5em 0.75em;\n}\n\n.menu-list a:hover {\n  background-color: whitesmoke;\n  color: #00d1b2;\n}\n\n.menu-list a.is-active {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.menu-list li ul {\n  border-left: 1px solid #dbdbdb;\n  margin: 0.75em;\n  padding-left: 0.75em;\n}\n\n.menu-label {\n  color: #7a7a7a;\n  font-size: 0.8em;\n  letter-spacing: 0.1em;\n  text-transform: uppercase;\n}\n\n.menu-label:not(:first-child) {\n  margin-top: 1em;\n}\n\n.menu-label:not(:last-child) {\n  margin-bottom: 1em;\n}\n\n.message {\n  background-color: whitesmoke;\n  border-radius: 3px;\n  font-size: 1rem;\n}\n\n.message:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.message.is-white {\n  background-color: white;\n}\n\n.message.is-white .message-header {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.message.is-white .message-body {\n  border-color: white;\n  color: #4d4d4d;\n}\n\n.message.is-black {\n  background-color: #fafafa;\n}\n\n.message.is-black .message-header {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.message.is-black .message-body {\n  border-color: #0a0a0a;\n  color: #090909;\n}\n\n.message.is-light {\n  background-color: #fafafa;\n}\n\n.message.is-light .message-header {\n  background-color: whitesmoke;\n  color: #363636;\n}\n\n.message.is-light .message-body {\n  border-color: whitesmoke;\n  color: #505050;\n}\n\n.message.is-dark {\n  background-color: #fafafa;\n}\n\n.message.is-dark .message-header {\n  background-color: #363636;\n  color: whitesmoke;\n}\n\n.message.is-dark .message-body {\n  border-color: #363636;\n  color: #2a2a2a;\n}\n\n.message.is-primary {\n  background-color: #f5fffd;\n}\n\n.message.is-primary .message-header {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.message.is-primary .message-body {\n  border-color: #00d1b2;\n  color: #021310;\n}\n\n.message.is-info {\n  background-color: #f6f9fe;\n}\n\n.message.is-info .message-header {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.message.is-info .message-body {\n  border-color: #3273dc;\n  color: #22509a;\n}\n\n.message.is-success {\n  background-color: #f6fef9;\n}\n\n.message.is-success .message-header {\n  background-color: #23d160;\n  color: #fff;\n}\n\n.message.is-success .message-body {\n  border-color: #23d160;\n  color: #0e301a;\n}\n\n.message.is-warning {\n  background-color: #fffdf5;\n}\n\n.message.is-warning .message-header {\n  background-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.message.is-warning .message-body {\n  border-color: #ffdd57;\n  color: #3b3108;\n}\n\n.message.is-danger {\n  background-color: #fff5f7;\n}\n\n.message.is-danger .message-header {\n  background-color: #ff3860;\n  color: #fff;\n}\n\n.message.is-danger .message-body {\n  border-color: #ff3860;\n  color: #cd0930;\n}\n\n.message-header {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  background-color: #4a4a4a;\n  border-radius: 3px 3px 0 0;\n  color: #fff;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-pack: justify;\n      -ms-flex-pack: justify;\n          justify-content: space-between;\n  line-height: 1.25;\n  padding: 0.5em 0.75em;\n  position: relative;\n}\n\n.message-header a,\n.message-header strong {\n  color: inherit;\n}\n\n.message-header a {\n  text-decoration: underline;\n}\n\n.message-header .delete {\n  -webkit-box-flex: 0;\n      -ms-flex-positive: 0;\n          flex-grow: 0;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  margin-left: 0.75em;\n}\n\n.message-header + .message-body {\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n  border-top: none;\n}\n\n.message-body {\n  border: 1px solid #dbdbdb;\n  border-radius: 3px;\n  color: #4a4a4a;\n  padding: 1em 1.25em;\n}\n\n.message-body a,\n.message-body strong {\n  color: inherit;\n}\n\n.message-body a {\n  text-decoration: underline;\n}\n\n.message-body code,\n.message-body pre {\n  background: white;\n}\n\n.message-body pre code {\n  background: transparent;\n}\n\n.modal-background {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  background-color: rgba(10, 10, 10, 0.86);\n}\n\n.modal-content,\n.modal-card {\n  margin: 0 20px;\n  max-height: calc(100vh - 160px);\n  overflow: auto;\n  position: relative;\n  width: 100%;\n}\n\n@media screen and (min-width: 769px), print {\n  .modal-content,\n  .modal-card {\n    margin: 0 auto;\n    max-height: calc(100vh - 40px);\n    width: 640px;\n  }\n}\n\n.modal-close {\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  background-color: rgba(10, 10, 10, 0.2);\n  border: none;\n  border-radius: 290486px;\n  cursor: pointer;\n  display: inline-block;\n  -webkit-box-flex: 0;\n      -ms-flex-positive: 0;\n          flex-grow: 0;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  font-size: 1rem;\n  height: 20px;\n  max-height: 20px;\n  max-width: 20px;\n  min-height: 20px;\n  min-width: 20px;\n  outline: none;\n  position: relative;\n  vertical-align: top;\n  width: 20px;\n  background: none;\n  height: 40px;\n  position: fixed;\n  right: 20px;\n  top: 20px;\n  width: 40px;\n}\n\n.modal-close:before, .modal-close:after {\n  background-color: white;\n  content: \"\";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  -webkit-transform: translateX(-50%) translateY(-50%) rotate(45deg);\n          transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  -webkit-transform-origin: center center;\n          transform-origin: center center;\n}\n\n.modal-close:before {\n  height: 2px;\n  width: 50%;\n}\n\n.modal-close:after {\n  height: 50%;\n  width: 2px;\n}\n\n.modal-close:hover, .modal-close:focus {\n  background-color: rgba(10, 10, 10, 0.3);\n}\n\n.modal-close:active {\n  background-color: rgba(10, 10, 10, 0.4);\n}\n\n.modal-close.is-small {\n  height: 16px;\n  max-height: 16px;\n  max-width: 16px;\n  min-height: 16px;\n  min-width: 16px;\n  width: 16px;\n}\n\n.modal-close.is-medium {\n  height: 24px;\n  max-height: 24px;\n  max-width: 24px;\n  min-height: 24px;\n  min-width: 24px;\n  width: 24px;\n}\n\n.modal-close.is-large {\n  height: 32px;\n  max-height: 32px;\n  max-width: 32px;\n  min-height: 32px;\n  min-width: 32px;\n  width: 32px;\n}\n\n.modal-card {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n      -ms-flex-direction: column;\n          flex-direction: column;\n  max-height: calc(100vh - 40px);\n  overflow: hidden;\n}\n\n.modal-card-head,\n.modal-card-foot {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  background-color: whitesmoke;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n  padding: 20px;\n  position: relative;\n}\n\n.modal-card-head {\n  border-bottom: 1px solid #dbdbdb;\n  border-top-left-radius: 5px;\n  border-top-right-radius: 5px;\n}\n\n.modal-card-title {\n  color: #363636;\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  font-size: 1.5rem;\n  line-height: 1;\n}\n\n.modal-card-foot {\n  border-bottom-left-radius: 5px;\n  border-bottom-right-radius: 5px;\n  border-top: 1px solid #dbdbdb;\n}\n\n.modal-card-foot .button:not(:last-child) {\n  margin-right: 10px;\n}\n\n.modal-card-body {\n  -webkit-overflow-scrolling: touch;\n  background-color: white;\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 1;\n      flex-shrink: 1;\n  overflow: auto;\n  padding: 20px;\n}\n\n.modal {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  display: none;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  overflow: hidden;\n  position: fixed;\n  z-index: 20;\n}\n\n.modal.is-active {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n}\n\n.nav-toggle {\n  cursor: pointer;\n  display: block;\n  height: 3.25rem;\n  position: relative;\n  width: 3.25rem;\n}\n\n.nav-toggle span {\n  background-color: #4a4a4a;\n  display: block;\n  height: 1px;\n  left: 50%;\n  margin-left: -7px;\n  position: absolute;\n  top: 50%;\n  -webkit-transition: none 86ms ease-out;\n  transition: none 86ms ease-out;\n  -webkit-transition-property: background, left, opacity, -webkit-transform;\n  transition-property: background, left, opacity, -webkit-transform;\n  transition-property: background, left, opacity, transform;\n  transition-property: background, left, opacity, transform, -webkit-transform;\n  width: 15px;\n}\n\n.nav-toggle span:nth-child(1) {\n  margin-top: -6px;\n}\n\n.nav-toggle span:nth-child(2) {\n  margin-top: -1px;\n}\n\n.nav-toggle span:nth-child(3) {\n  margin-top: 4px;\n}\n\n.nav-toggle:hover {\n  background-color: whitesmoke;\n}\n\n.nav-toggle.is-active span {\n  background-color: #00d1b2;\n}\n\n.nav-toggle.is-active span:nth-child(1) {\n  margin-left: -5px;\n  -webkit-transform: rotate(45deg);\n          transform: rotate(45deg);\n  -webkit-transform-origin: left top;\n          transform-origin: left top;\n}\n\n.nav-toggle.is-active span:nth-child(2) {\n  opacity: 0;\n}\n\n.nav-toggle.is-active span:nth-child(3) {\n  margin-left: -5px;\n  -webkit-transform: rotate(-45deg);\n          transform: rotate(-45deg);\n  -webkit-transform-origin: left bottom;\n          transform-origin: left bottom;\n}\n\n@media screen and (min-width: 769px), print {\n  .nav-toggle {\n    display: none;\n  }\n}\n\n.nav-item {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-flex: 0;\n      -ms-flex-positive: 0;\n          flex-grow: 0;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  font-size: 1rem;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  line-height: 1.5;\n  padding: 0.5rem 0.75rem;\n}\n\n.nav-item a {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n}\n\n.nav-item img {\n  max-height: 1.75rem;\n}\n\n.nav-item .tag:first-child:not(:last-child) {\n  margin-right: 0.5rem;\n}\n\n.nav-item .tag:last-child:not(:first-child) {\n  margin-left: 0.5rem;\n}\n\n@media screen and (max-width: 768px) {\n  .nav-item {\n    -webkit-box-pack: start;\n        -ms-flex-pack: start;\n            justify-content: flex-start;\n  }\n}\n\n.nav-item a:not(.button),\na.nav-item:not(.button) {\n  color: #7a7a7a;\n}\n\n.nav-item a:not(.button):hover,\na.nav-item:not(.button):hover {\n  color: #363636;\n}\n\n.nav-item a:not(.button).is-active,\na.nav-item:not(.button).is-active {\n  color: #363636;\n}\n\n.nav-item a:not(.button).is-tab,\na.nav-item:not(.button).is-tab {\n  border-bottom: 1px solid transparent;\n  border-top: 1px solid transparent;\n  padding-bottom: calc(0.75rem - 1px);\n  padding-left: 1rem;\n  padding-right: 1rem;\n  padding-top: calc(0.75rem - 1px);\n}\n\n.nav-item a:not(.button).is-tab:hover,\na.nav-item:not(.button).is-tab:hover {\n  border-bottom-color: #00d1b2;\n  border-top-color: transparent;\n}\n\n.nav-item a:not(.button).is-tab.is-active,\na.nav-item:not(.button).is-tab.is-active {\n  border-bottom: 3px solid #00d1b2;\n  color: #00d1b2;\n  padding-bottom: calc(0.75rem - 3px);\n}\n\n@media screen and (min-width: 1000px) {\n  .nav-item a:not(.button).is-brand,\n  a.nav-item:not(.button).is-brand {\n    padding-left: 0;\n  }\n}\n\n.nav-left,\n.nav-right {\n  -webkit-overflow-scrolling: touch;\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  max-width: 100%;\n  overflow: auto;\n}\n\n@media screen and (min-width: 1192px) {\n  .nav-left,\n  .nav-right {\n    -ms-flex-preferred-size: 0;\n        flex-basis: 0;\n  }\n}\n\n.nav-left {\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n  white-space: nowrap;\n}\n\n.nav-right {\n  -webkit-box-pack: end;\n      -ms-flex-pack: end;\n          justify-content: flex-end;\n}\n\n.nav-center {\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-flex: 0;\n      -ms-flex-positive: 0;\n          flex-grow: 0;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  margin-left: auto;\n  margin-right: auto;\n}\n\n@media screen and (max-width: 768px) {\n  .nav-menu.nav-right {\n    background-color: white;\n    -webkit-box-shadow: 0 4px 7px rgba(10, 10, 10, 0.1);\n            box-shadow: 0 4px 7px rgba(10, 10, 10, 0.1);\n    left: 0;\n    display: none;\n    right: 0;\n    top: 100%;\n    position: absolute;\n  }\n  .nav-menu.nav-right .nav-item {\n    border-top: 1px solid rgba(219, 219, 219, 0.5);\n    padding: 0.75rem;\n  }\n  .nav-menu.nav-right.is-active {\n    display: block;\n  }\n}\n\n.nav {\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  background-color: white;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  height: 3.25rem;\n  position: relative;\n  text-align: center;\n  z-index: 10;\n}\n\n.nav > .container {\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  min-height: 3.25rem;\n  width: 100%;\n}\n\n.nav.has-shadow {\n  -webkit-box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1);\n          box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1);\n}\n\n.navbar {\n  background-color: white;\n  min-height: 3.25rem;\n  position: relative;\n}\n\n.navbar-brand {\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  height: 3.25rem;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n}\n\n.navbar-burger {\n  cursor: pointer;\n  display: block;\n  height: 3.25rem;\n  position: relative;\n  width: 3.25rem;\n  margin-left: auto;\n}\n\n.navbar-burger span {\n  background-color: #4a4a4a;\n  display: block;\n  height: 1px;\n  left: 50%;\n  margin-left: -7px;\n  position: absolute;\n  top: 50%;\n  -webkit-transition: none 86ms ease-out;\n  transition: none 86ms ease-out;\n  -webkit-transition-property: background, left, opacity, -webkit-transform;\n  transition-property: background, left, opacity, -webkit-transform;\n  transition-property: background, left, opacity, transform;\n  transition-property: background, left, opacity, transform, -webkit-transform;\n  width: 15px;\n}\n\n.navbar-burger span:nth-child(1) {\n  margin-top: -6px;\n}\n\n.navbar-burger span:nth-child(2) {\n  margin-top: -1px;\n}\n\n.navbar-burger span:nth-child(3) {\n  margin-top: 4px;\n}\n\n.navbar-burger:hover {\n  background-color: whitesmoke;\n}\n\n.navbar-burger.is-active span {\n  background-color: #00d1b2;\n}\n\n.navbar-burger.is-active span:nth-child(1) {\n  margin-left: -5px;\n  -webkit-transform: rotate(45deg);\n          transform: rotate(45deg);\n  -webkit-transform-origin: left top;\n          transform-origin: left top;\n}\n\n.navbar-burger.is-active span:nth-child(2) {\n  opacity: 0;\n}\n\n.navbar-burger.is-active span:nth-child(3) {\n  margin-left: -5px;\n  -webkit-transform: rotate(-45deg);\n          transform: rotate(-45deg);\n  -webkit-transform-origin: left bottom;\n          transform-origin: left bottom;\n}\n\n.navbar-menu {\n  display: none;\n}\n\n.navbar-item,\n.navbar-link {\n  color: #4a4a4a;\n  display: block;\n  line-height: 1.5;\n  padding: 0.5rem 1rem;\n  position: relative;\n}\n\na.navbar-item:hover, a.navbar-item.is-active,\n.navbar-link:hover,\n.navbar-link.is-active {\n  background-color: whitesmoke;\n  color: #0a0a0a;\n}\n\n.navbar-item {\n  -webkit-box-flex: 0;\n      -ms-flex-positive: 0;\n          flex-grow: 0;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n}\n\n.navbar-item img {\n  max-height: 1.75rem;\n}\n\n.navbar-item.has-dropdown {\n  padding: 0;\n}\n\n.navbar-content {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 1;\n      flex-shrink: 1;\n}\n\n.navbar-link {\n  padding-right: 2.5em;\n}\n\n.navbar-dropdown {\n  font-size: 0.875rem;\n  padding-bottom: 0.5rem;\n  padding-top: 0.5rem;\n}\n\n.navbar-dropdown .navbar-item {\n  padding-left: 1.5rem;\n  padding-right: 1.5rem;\n}\n\n.navbar-divider {\n  background-color: #dbdbdb;\n  border: none;\n  display: none;\n  height: 1px;\n  margin: 0.5rem 0;\n}\n\n@media screen and (max-width: 999px) {\n  .navbar-brand .navbar-item {\n    -webkit-box-align: center;\n        -ms-flex-align: center;\n            align-items: center;\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n  .navbar-menu {\n    -webkit-box-shadow: 0 8px 16px rgba(10, 10, 10, 0.1);\n            box-shadow: 0 8px 16px rgba(10, 10, 10, 0.1);\n    padding: 0.5rem 0;\n  }\n  .navbar-menu.is-active {\n    display: block;\n  }\n}\n\n@media screen and (min-width: 1000px) {\n  .navbar,\n  .navbar-menu,\n  .navbar-start,\n  .navbar-end {\n    -webkit-box-align: stretch;\n        -ms-flex-align: stretch;\n            align-items: stretch;\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n  .navbar {\n    height: 3.25rem;\n  }\n  .navbar.is-transparent a.navbar-item:hover, .navbar.is-transparent a.navbar-item.is-active,\n  .navbar.is-transparent .navbar-link:hover,\n  .navbar.is-transparent .navbar-link.is-active {\n    background-color: transparent;\n  }\n  .navbar.is-transparent .navbar-item.has-dropdown.is-active .navbar-link, .navbar.is-transparent .navbar-item.has-dropdown.is-hoverable:hover .navbar-link {\n    background-color: transparent;\n  }\n  .navbar.is-transparent .navbar-dropdown a.navbar-item:hover {\n    background-color: whitesmoke;\n    color: #0a0a0a;\n  }\n  .navbar.is-transparent .navbar-dropdown a.navbar-item.is-active {\n    background-color: whitesmoke;\n    color: #00d1b2;\n  }\n  .navbar-burger {\n    display: none;\n  }\n  .navbar-item,\n  .navbar-link {\n    -webkit-box-align: center;\n        -ms-flex-align: center;\n            align-items: center;\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n  .navbar-item.has-dropdown {\n    -webkit-box-align: stretch;\n        -ms-flex-align: stretch;\n            align-items: stretch;\n  }\n  .navbar-item.is-active .navbar-dropdown, .navbar-item.is-hoverable:hover .navbar-dropdown {\n    display: block;\n  }\n  .navbar-item.is-active .navbar-dropdown.is-boxed, .navbar-item.is-hoverable:hover .navbar-dropdown.is-boxed {\n    opacity: 1;\n    pointer-events: auto;\n    -webkit-transform: translateY(0);\n            transform: translateY(0);\n  }\n  .navbar-link::after {\n    border: 1px solid #00d1b2;\n    border-right: 0;\n    border-top: 0;\n    content: \" \";\n    display: block;\n    height: 0.5em;\n    pointer-events: none;\n    position: absolute;\n    -webkit-transform: rotate(-45deg);\n            transform: rotate(-45deg);\n    width: 0.5em;\n    margin-top: -0.375em;\n    right: 1.125em;\n    top: 50%;\n  }\n  .navbar-menu {\n    -webkit-box-flex: 1;\n        -ms-flex-positive: 1;\n            flex-grow: 1;\n    -ms-flex-negative: 0;\n        flex-shrink: 0;\n  }\n  .navbar-start {\n    -webkit-box-pack: start;\n        -ms-flex-pack: start;\n            justify-content: flex-start;\n    margin-right: auto;\n  }\n  .navbar-end {\n    -webkit-box-pack: end;\n        -ms-flex-pack: end;\n            justify-content: flex-end;\n    margin-left: auto;\n  }\n  .navbar-dropdown {\n    background-color: white;\n    border-bottom-left-radius: 5px;\n    border-bottom-right-radius: 5px;\n    border-top: 1px solid #dbdbdb;\n    -webkit-box-shadow: 0 8px 8px rgba(10, 10, 10, 0.1);\n            box-shadow: 0 8px 8px rgba(10, 10, 10, 0.1);\n    display: none;\n    font-size: 0.875rem;\n    left: 0;\n    min-width: 100%;\n    position: absolute;\n    top: 100%;\n    z-index: 20;\n  }\n  .navbar-dropdown .navbar-item {\n    padding: 0.375rem 1rem;\n    white-space: nowrap;\n  }\n  .navbar-dropdown a.navbar-item {\n    padding-right: 3rem;\n  }\n  .navbar-dropdown a.navbar-item:hover {\n    background-color: whitesmoke;\n    color: #0a0a0a;\n  }\n  .navbar-dropdown a.navbar-item.is-active {\n    background-color: whitesmoke;\n    color: #00d1b2;\n  }\n  .navbar-dropdown.is-boxed {\n    border-radius: 5px;\n    border-top: none;\n    -webkit-box-shadow: 0 8px 8px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);\n            box-shadow: 0 8px 8px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);\n    display: block;\n    opacity: 0;\n    pointer-events: none;\n    top: calc(100% + (-4px));\n    -webkit-transform: translateY(-5px);\n            transform: translateY(-5px);\n    -webkit-transition-duration: 86ms;\n            transition-duration: 86ms;\n    -webkit-transition-property: opacity, -webkit-transform;\n    transition-property: opacity, -webkit-transform;\n    transition-property: opacity, transform;\n    transition-property: opacity, transform, -webkit-transform;\n  }\n  .navbar-divider {\n    display: block;\n  }\n  .container > .navbar {\n    margin-left: -1rem;\n    margin-right: -1rem;\n  }\n  a.navbar-item.is-active,\n  .navbar-link.is-active {\n    color: #0a0a0a;\n  }\n  a.navbar-item.is-active:not(:hover),\n  .navbar-link.is-active:not(:hover) {\n    background-color: transparent;\n  }\n  .navbar-item.has-dropdown:hover .navbar-link, .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: whitesmoke;\n  }\n}\n\n.pagination {\n  font-size: 1rem;\n  margin: -0.25rem;\n}\n\n.pagination.is-small {\n  font-size: 0.75rem;\n}\n\n.pagination.is-medium {\n  font-size: 1.25rem;\n}\n\n.pagination.is-large {\n  font-size: 1.5rem;\n}\n\n.pagination,\n.pagination-list {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  text-align: center;\n}\n\n.pagination-previous,\n.pagination-next,\n.pagination-link,\n.pagination-ellipsis {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  border: 1px solid transparent;\n  border-radius: 3px;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n  font-size: 1rem;\n  height: 2.25em;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n  line-height: 1.5;\n  padding-bottom: calc(0.375em - 1px);\n  padding-left: calc(0.625em - 1px);\n  padding-right: calc(0.625em - 1px);\n  padding-top: calc(0.375em - 1px);\n  position: relative;\n  vertical-align: top;\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  font-size: 1em;\n  padding-left: 0.5em;\n  padding-right: 0.5em;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  margin: 0.25rem;\n  text-align: center;\n}\n\n.pagination-previous:focus, .pagination-previous.is-focused, .pagination-previous:active, .pagination-previous.is-active,\n.pagination-next:focus,\n.pagination-next.is-focused,\n.pagination-next:active,\n.pagination-next.is-active,\n.pagination-link:focus,\n.pagination-link.is-focused,\n.pagination-link:active,\n.pagination-link.is-active,\n.pagination-ellipsis:focus,\n.pagination-ellipsis.is-focused,\n.pagination-ellipsis:active,\n.pagination-ellipsis.is-active {\n  outline: none;\n}\n\n.pagination-previous[disabled],\n.pagination-next[disabled],\n.pagination-link[disabled],\n.pagination-ellipsis[disabled] {\n  cursor: not-allowed;\n}\n\n.pagination-previous,\n.pagination-next,\n.pagination-link {\n  border-color: #dbdbdb;\n  min-width: 2.25em;\n}\n\n.pagination-previous:hover,\n.pagination-next:hover,\n.pagination-link:hover {\n  border-color: #b5b5b5;\n  color: #363636;\n}\n\n.pagination-previous:focus,\n.pagination-next:focus,\n.pagination-link:focus {\n  border-color: #00d1b2;\n}\n\n.pagination-previous:active,\n.pagination-next:active,\n.pagination-link:active {\n  -webkit-box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n          box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n}\n\n.pagination-previous[disabled],\n.pagination-next[disabled],\n.pagination-link[disabled] {\n  background-color: #dbdbdb;\n  border-color: #dbdbdb;\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  color: #7a7a7a;\n  opacity: 0.5;\n}\n\n.pagination-previous,\n.pagination-next {\n  padding-left: 0.75em;\n  padding-right: 0.75em;\n  white-space: nowrap;\n}\n\n.pagination-link.is-current {\n  background-color: #00d1b2;\n  border-color: #00d1b2;\n  color: #fff;\n}\n\n.pagination-ellipsis {\n  color: #b5b5b5;\n  pointer-events: none;\n}\n\n.pagination-list {\n  -ms-flex-wrap: wrap;\n      flex-wrap: wrap;\n}\n\n@media screen and (max-width: 768px) {\n  .pagination {\n    -ms-flex-wrap: wrap;\n        flex-wrap: wrap;\n  }\n  .pagination-previous,\n  .pagination-next {\n    -webkit-box-flex: 1;\n        -ms-flex-positive: 1;\n            flex-grow: 1;\n    -ms-flex-negative: 1;\n        flex-shrink: 1;\n  }\n  .pagination-list li {\n    -webkit-box-flex: 1;\n        -ms-flex-positive: 1;\n            flex-grow: 1;\n    -ms-flex-negative: 1;\n        flex-shrink: 1;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .pagination-list {\n    -webkit-box-flex: 1;\n        -ms-flex-positive: 1;\n            flex-grow: 1;\n    -ms-flex-negative: 1;\n        flex-shrink: 1;\n    -webkit-box-pack: start;\n        -ms-flex-pack: start;\n            justify-content: flex-start;\n    -webkit-box-ordinal-group: 2;\n        -ms-flex-order: 1;\n            order: 1;\n  }\n  .pagination-previous {\n    -webkit-box-ordinal-group: 3;\n        -ms-flex-order: 2;\n            order: 2;\n  }\n  .pagination-next {\n    -webkit-box-ordinal-group: 4;\n        -ms-flex-order: 3;\n            order: 3;\n  }\n  .pagination {\n    -webkit-box-pack: justify;\n        -ms-flex-pack: justify;\n            justify-content: space-between;\n  }\n  .pagination.is-centered .pagination-previous {\n    -webkit-box-ordinal-group: 2;\n        -ms-flex-order: 1;\n            order: 1;\n  }\n  .pagination.is-centered .pagination-list {\n    -webkit-box-pack: center;\n        -ms-flex-pack: center;\n            justify-content: center;\n    -webkit-box-ordinal-group: 3;\n        -ms-flex-order: 2;\n            order: 2;\n  }\n  .pagination.is-centered .pagination-next {\n    -webkit-box-ordinal-group: 4;\n        -ms-flex-order: 3;\n            order: 3;\n  }\n  .pagination.is-right .pagination-previous {\n    -webkit-box-ordinal-group: 2;\n        -ms-flex-order: 1;\n            order: 1;\n  }\n  .pagination.is-right .pagination-next {\n    -webkit-box-ordinal-group: 3;\n        -ms-flex-order: 2;\n            order: 2;\n  }\n  .pagination.is-right .pagination-list {\n    -webkit-box-pack: end;\n        -ms-flex-pack: end;\n            justify-content: flex-end;\n    -webkit-box-ordinal-group: 4;\n        -ms-flex-order: 3;\n            order: 3;\n  }\n}\n\n.panel {\n  font-size: 1rem;\n}\n\n.panel:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.panel-heading,\n.panel-tabs,\n.panel-block {\n  border-bottom: 1px solid #dbdbdb;\n  border-left: 1px solid #dbdbdb;\n  border-right: 1px solid #dbdbdb;\n}\n\n.panel-heading:first-child,\n.panel-tabs:first-child,\n.panel-block:first-child {\n  border-top: 1px solid #dbdbdb;\n}\n\n.panel-heading {\n  background-color: whitesmoke;\n  border-radius: 3px 3px 0 0;\n  color: #363636;\n  font-size: 1.25em;\n  font-weight: 300;\n  line-height: 1.25;\n  padding: 0.5em 0.75em;\n}\n\n.panel-tabs {\n  -webkit-box-align: end;\n      -ms-flex-align: end;\n          align-items: flex-end;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  font-size: 0.875em;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n}\n\n.panel-tabs a {\n  border-bottom: 1px solid #dbdbdb;\n  margin-bottom: -1px;\n  padding: 0.5em;\n}\n\n.panel-tabs a.is-active {\n  border-bottom-color: #4a4a4a;\n  color: #363636;\n}\n\n.panel-list a {\n  color: #4a4a4a;\n}\n\n.panel-list a:hover {\n  color: #00d1b2;\n}\n\n.panel-block {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  color: #363636;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n  padding: 0.5em 0.75em;\n}\n\n.panel-block input[type=\"checkbox\"] {\n  margin-right: 0.75em;\n}\n\n.panel-block > .control {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 1;\n      flex-shrink: 1;\n  width: 100%;\n}\n\n.panel-block.is-wrapped {\n  -ms-flex-wrap: wrap;\n      flex-wrap: wrap;\n}\n\n.panel-block.is-active {\n  border-left-color: #00d1b2;\n  color: #363636;\n}\n\n.panel-block.is-active .panel-icon {\n  color: #00d1b2;\n}\n\na.panel-block,\nlabel.panel-block {\n  cursor: pointer;\n}\n\na.panel-block:hover,\nlabel.panel-block:hover {\n  background-color: whitesmoke;\n}\n\n.panel-icon {\n  display: inline-block;\n  font-size: 14px;\n  height: 1em;\n  line-height: 1em;\n  text-align: center;\n  vertical-align: top;\n  width: 1em;\n  color: #7a7a7a;\n  margin-right: 0.75em;\n}\n\n.panel-icon .fa {\n  font-size: inherit;\n  line-height: inherit;\n}\n\n.tabs {\n  -webkit-overflow-scrolling: touch;\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  font-size: 1rem;\n  -webkit-box-pack: justify;\n      -ms-flex-pack: justify;\n          justify-content: space-between;\n  overflow: hidden;\n  overflow-x: auto;\n  white-space: nowrap;\n}\n\n.tabs:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.tabs a {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  border-bottom: 1px solid #dbdbdb;\n  color: #4a4a4a;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  margin-bottom: -1px;\n  padding: 0.5em 1em;\n  vertical-align: top;\n}\n\n.tabs a:hover {\n  border-bottom-color: #363636;\n  color: #363636;\n}\n\n.tabs li {\n  display: block;\n}\n\n.tabs li.is-active a {\n  border-bottom-color: #00d1b2;\n  color: #00d1b2;\n}\n\n.tabs ul {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  border-bottom: 1px solid #dbdbdb;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  -webkit-box-pack: start;\n      -ms-flex-pack: start;\n          justify-content: flex-start;\n}\n\n.tabs ul.is-left {\n  padding-right: 0.75em;\n}\n\n.tabs ul.is-center {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n  padding-left: 0.75em;\n  padding-right: 0.75em;\n}\n\n.tabs ul.is-right {\n  -webkit-box-pack: end;\n      -ms-flex-pack: end;\n          justify-content: flex-end;\n  padding-left: 0.75em;\n}\n\n.tabs .icon:first-child {\n  margin-right: 0.5em;\n}\n\n.tabs .icon:last-child {\n  margin-left: 0.5em;\n}\n\n.tabs.is-centered ul {\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n}\n\n.tabs.is-right ul {\n  -webkit-box-pack: end;\n      -ms-flex-pack: end;\n          justify-content: flex-end;\n}\n\n.tabs.is-boxed a {\n  border: 1px solid transparent;\n  border-radius: 3px 3px 0 0;\n}\n\n.tabs.is-boxed a:hover {\n  background-color: whitesmoke;\n  border-bottom-color: #dbdbdb;\n}\n\n.tabs.is-boxed li.is-active a {\n  background-color: white;\n  border-color: #dbdbdb;\n  border-bottom-color: transparent !important;\n}\n\n.tabs.is-fullwidth li {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n}\n\n.tabs.is-toggle a {\n  border: 1px solid #dbdbdb;\n  margin-bottom: 0;\n  position: relative;\n}\n\n.tabs.is-toggle a:hover {\n  background-color: whitesmoke;\n  border-color: #b5b5b5;\n  z-index: 2;\n}\n\n.tabs.is-toggle li + li {\n  margin-left: -1px;\n}\n\n.tabs.is-toggle li:first-child a {\n  border-radius: 3px 0 0 3px;\n}\n\n.tabs.is-toggle li:last-child a {\n  border-radius: 0 3px 3px 0;\n}\n\n.tabs.is-toggle li.is-active a {\n  background-color: #00d1b2;\n  border-color: #00d1b2;\n  color: #fff;\n  z-index: 1;\n}\n\n.tabs.is-toggle ul {\n  border-bottom: none;\n}\n\n.tabs.is-small {\n  font-size: 0.75rem;\n}\n\n.tabs.is-medium {\n  font-size: 1.25rem;\n}\n\n.tabs.is-large {\n  font-size: 1.5rem;\n}\n\n.column {\n  display: block;\n  -ms-flex-preferred-size: 0;\n      flex-basis: 0;\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 1;\n      flex-shrink: 1;\n  padding: 0.75rem;\n}\n\n.columns.is-mobile > .column.is-narrow {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n}\n\n.columns.is-mobile > .column.is-full {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 100%;\n}\n\n.columns.is-mobile > .column.is-three-quarters {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 75%;\n}\n\n.columns.is-mobile > .column.is-two-thirds {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 66.6666%;\n}\n\n.columns.is-mobile > .column.is-half {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 50%;\n}\n\n.columns.is-mobile > .column.is-one-third {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 33.3333%;\n}\n\n.columns.is-mobile > .column.is-one-quarter {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 25%;\n}\n\n.columns.is-mobile > .column.is-offset-three-quarters {\n  margin-left: 75%;\n}\n\n.columns.is-mobile > .column.is-offset-two-thirds {\n  margin-left: 66.6666%;\n}\n\n.columns.is-mobile > .column.is-offset-half {\n  margin-left: 50%;\n}\n\n.columns.is-mobile > .column.is-offset-one-third {\n  margin-left: 33.3333%;\n}\n\n.columns.is-mobile > .column.is-offset-one-quarter {\n  margin-left: 25%;\n}\n\n.columns.is-mobile > .column.is-1 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 8.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-1 {\n  margin-left: 8.33333%;\n}\n\n.columns.is-mobile > .column.is-2 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 16.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-2 {\n  margin-left: 16.66667%;\n}\n\n.columns.is-mobile > .column.is-3 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 25%;\n}\n\n.columns.is-mobile > .column.is-offset-3 {\n  margin-left: 25%;\n}\n\n.columns.is-mobile > .column.is-4 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 33.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-4 {\n  margin-left: 33.33333%;\n}\n\n.columns.is-mobile > .column.is-5 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 41.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-5 {\n  margin-left: 41.66667%;\n}\n\n.columns.is-mobile > .column.is-6 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 50%;\n}\n\n.columns.is-mobile > .column.is-offset-6 {\n  margin-left: 50%;\n}\n\n.columns.is-mobile > .column.is-7 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 58.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-7 {\n  margin-left: 58.33333%;\n}\n\n.columns.is-mobile > .column.is-8 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 66.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-8 {\n  margin-left: 66.66667%;\n}\n\n.columns.is-mobile > .column.is-9 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 75%;\n}\n\n.columns.is-mobile > .column.is-offset-9 {\n  margin-left: 75%;\n}\n\n.columns.is-mobile > .column.is-10 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 83.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-10 {\n  margin-left: 83.33333%;\n}\n\n.columns.is-mobile > .column.is-11 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 91.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-11 {\n  margin-left: 91.66667%;\n}\n\n.columns.is-mobile > .column.is-12 {\n  -webkit-box-flex: 0;\n      -ms-flex: none;\n          flex: none;\n  width: 100%;\n}\n\n.columns.is-mobile > .column.is-offset-12 {\n  margin-left: 100%;\n}\n\n@media screen and (max-width: 768px) {\n  .column.is-narrow-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n  }\n  .column.is-full-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-three-quarters-mobile {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-mobile {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-mobile {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-mobile {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-mobile {\n    margin-left: 25%;\n  }\n  .column.is-1-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-mobile {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-mobile {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-mobile {\n    margin-left: 25%;\n  }\n  .column.is-4-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-mobile {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-mobile {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-mobile {\n    margin-left: 50%;\n  }\n  .column.is-7-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-mobile {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-mobile {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-mobile {\n    margin-left: 75%;\n  }\n  .column.is-10-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-mobile {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-mobile {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-mobile {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-mobile {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .column.is-narrow, .column.is-narrow-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n  }\n  .column.is-full, .column.is-full-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters, .column.is-three-quarters-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds, .column.is-two-thirds-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half, .column.is-half-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-one-third, .column.is-one-third-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter, .column.is-one-quarter-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-three-quarters, .column.is-offset-three-quarters-tablet {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds, .column.is-offset-two-thirds-tablet {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half, .column.is-offset-half-tablet {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third, .column.is-offset-one-third-tablet {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter, .column.is-offset-one-quarter-tablet {\n    margin-left: 25%;\n  }\n  .column.is-1, .column.is-1-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1, .column.is-offset-1-tablet {\n    margin-left: 8.33333%;\n  }\n  .column.is-2, .column.is-2-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2, .column.is-offset-2-tablet {\n    margin-left: 16.66667%;\n  }\n  .column.is-3, .column.is-3-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3, .column.is-offset-3-tablet {\n    margin-left: 25%;\n  }\n  .column.is-4, .column.is-4-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4, .column.is-offset-4-tablet {\n    margin-left: 33.33333%;\n  }\n  .column.is-5, .column.is-5-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5, .column.is-offset-5-tablet {\n    margin-left: 41.66667%;\n  }\n  .column.is-6, .column.is-6-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6, .column.is-offset-6-tablet {\n    margin-left: 50%;\n  }\n  .column.is-7, .column.is-7-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7, .column.is-offset-7-tablet {\n    margin-left: 58.33333%;\n  }\n  .column.is-8, .column.is-8-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8, .column.is-offset-8-tablet {\n    margin-left: 66.66667%;\n  }\n  .column.is-9, .column.is-9-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9, .column.is-offset-9-tablet {\n    margin-left: 75%;\n  }\n  .column.is-10, .column.is-10-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10, .column.is-offset-10-tablet {\n    margin-left: 83.33333%;\n  }\n  .column.is-11, .column.is-11-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11, .column.is-offset-11-tablet {\n    margin-left: 91.66667%;\n  }\n  .column.is-12, .column.is-12-tablet {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12, .column.is-offset-12-tablet {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (max-width: 999px) {\n  .column.is-narrow-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n  }\n  .column.is-full-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-three-quarters-touch {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-touch {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-touch {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-touch {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-touch {\n    margin-left: 25%;\n  }\n  .column.is-1-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-touch {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-touch {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-touch {\n    margin-left: 25%;\n  }\n  .column.is-4-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-touch {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-touch {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-touch {\n    margin-left: 50%;\n  }\n  .column.is-7-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-touch {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-touch {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-touch {\n    margin-left: 75%;\n  }\n  .column.is-10-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-touch {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-touch {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-touch {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-touch {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 1000px) {\n  .column.is-narrow-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n  }\n  .column.is-full-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-three-quarters-desktop {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-desktop {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-desktop {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-desktop {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-desktop {\n    margin-left: 25%;\n  }\n  .column.is-1-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-desktop {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-desktop {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-desktop {\n    margin-left: 25%;\n  }\n  .column.is-4-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-desktop {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-desktop {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-desktop {\n    margin-left: 50%;\n  }\n  .column.is-7-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-desktop {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-desktop {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-desktop {\n    margin-left: 75%;\n  }\n  .column.is-10-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-desktop {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-desktop {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-desktop {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-desktop {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 1192px) {\n  .column.is-narrow-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n  }\n  .column.is-full-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-three-quarters-widescreen {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-widescreen {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-widescreen {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-widescreen {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-widescreen {\n    margin-left: 25%;\n  }\n  .column.is-1-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-widescreen {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-widescreen {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-widescreen {\n    margin-left: 25%;\n  }\n  .column.is-4-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-widescreen {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-widescreen {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-widescreen {\n    margin-left: 50%;\n  }\n  .column.is-7-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-widescreen {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-widescreen {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-widescreen {\n    margin-left: 75%;\n  }\n  .column.is-10-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-widescreen {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-widescreen {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-widescreen {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-widescreen {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 1384px) {\n  .column.is-narrow-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n  }\n  .column.is-full-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-three-quarters-fullhd {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-fullhd {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-fullhd {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-fullhd {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-fullhd {\n    margin-left: 25%;\n  }\n  .column.is-1-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-fullhd {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-fullhd {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-fullhd {\n    margin-left: 25%;\n  }\n  .column.is-4-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-fullhd {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-fullhd {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-fullhd {\n    margin-left: 50%;\n  }\n  .column.is-7-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-fullhd {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-fullhd {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-fullhd {\n    margin-left: 75%;\n  }\n  .column.is-10-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-fullhd {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-fullhd {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-fullhd {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-fullhd {\n    margin-left: 100%;\n  }\n}\n\n.columns {\n  margin-left: -0.75rem;\n  margin-right: -0.75rem;\n  margin-top: -0.75rem;\n}\n\n.columns:last-child {\n  margin-bottom: -0.75rem;\n}\n\n.columns:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.columns.is-centered {\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n}\n\n.columns.is-gapless {\n  margin-left: 0;\n  margin-right: 0;\n  margin-top: 0;\n}\n\n.columns.is-gapless:last-child {\n  margin-bottom: 0;\n}\n\n.columns.is-gapless:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.columns.is-gapless > .column {\n  margin: 0;\n  padding: 0;\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-grid {\n    -ms-flex-wrap: wrap;\n        flex-wrap: wrap;\n  }\n  .columns.is-grid > .column {\n    max-width: 33.3333%;\n    padding: 0.75rem;\n    width: 33.3333%;\n  }\n  .columns.is-grid > .column + .column {\n    margin-left: 0;\n  }\n}\n\n.columns.is-mobile {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n}\n\n.columns.is-multiline {\n  -ms-flex-wrap: wrap;\n      flex-wrap: wrap;\n}\n\n.columns.is-vcentered {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n}\n\n@media screen and (min-width: 769px), print {\n  .columns:not(.is-desktop) {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n}\n\n@media screen and (min-width: 1000px) {\n  .columns.is-desktop {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n}\n\n.tile {\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  display: block;\n  -ms-flex-preferred-size: 0;\n      flex-basis: 0;\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 1;\n      flex-shrink: 1;\n  min-height: -webkit-min-content;\n  min-height: -moz-min-content;\n  min-height: min-content;\n}\n\n.tile.is-ancestor {\n  margin-left: -0.75rem;\n  margin-right: -0.75rem;\n  margin-top: -0.75rem;\n}\n\n.tile.is-ancestor:last-child {\n  margin-bottom: -0.75rem;\n}\n\n.tile.is-ancestor:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.tile.is-child {\n  margin: 0 !important;\n}\n\n.tile.is-parent {\n  padding: 0.75rem;\n}\n\n.tile.is-vertical {\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n      -ms-flex-direction: column;\n          flex-direction: column;\n}\n\n.tile.is-vertical > .tile.is-child:not(:last-child) {\n  margin-bottom: 1.5rem !important;\n}\n\n@media screen and (min-width: 769px), print {\n  .tile:not(.is-child) {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n  .tile.is-1 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 8.33333%;\n  }\n  .tile.is-2 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 16.66667%;\n  }\n  .tile.is-3 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 25%;\n  }\n  .tile.is-4 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 33.33333%;\n  }\n  .tile.is-5 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 41.66667%;\n  }\n  .tile.is-6 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 50%;\n  }\n  .tile.is-7 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 58.33333%;\n  }\n  .tile.is-8 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 66.66667%;\n  }\n  .tile.is-9 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 75%;\n  }\n  .tile.is-10 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 83.33333%;\n  }\n  .tile.is-11 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 91.66667%;\n  }\n  .tile.is-12 {\n    -webkit-box-flex: 0;\n        -ms-flex: none;\n            flex: none;\n    width: 100%;\n  }\n}\n\n.hero-video {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  overflow: hidden;\n}\n\n.hero-video video {\n  left: 50%;\n  min-height: 100%;\n  min-width: 100%;\n  position: absolute;\n  top: 50%;\n  -webkit-transform: translate3d(-50%, -50%, 0);\n          transform: translate3d(-50%, -50%, 0);\n}\n\n.hero-video.is-transparent {\n  opacity: 0.3;\n}\n\n@media screen and (max-width: 768px) {\n  .hero-video {\n    display: none;\n  }\n}\n\n.hero-buttons {\n  margin-top: 1.5rem;\n}\n\n@media screen and (max-width: 768px) {\n  .hero-buttons .button {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n  }\n  .hero-buttons .button:not(:last-child) {\n    margin-bottom: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .hero-buttons {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n    -webkit-box-pack: center;\n        -ms-flex-pack: center;\n            justify-content: center;\n  }\n  .hero-buttons .button:not(:last-child) {\n    margin-right: 1.5rem;\n  }\n}\n\n.hero-head,\n.hero-foot {\n  -webkit-box-flex: 0;\n      -ms-flex-positive: 0;\n          flex-grow: 0;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n}\n\n.hero-body {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 0;\n      flex-shrink: 0;\n  padding: 3rem 1.5rem;\n}\n\n.hero {\n  -webkit-box-align: stretch;\n      -ms-flex-align: stretch;\n          align-items: stretch;\n  background-color: white;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n      -ms-flex-direction: column;\n          flex-direction: column;\n  -webkit-box-pack: justify;\n      -ms-flex-pack: justify;\n          justify-content: space-between;\n}\n\n.hero .nav {\n  background: none;\n  -webkit-box-shadow: 0 1px 0 rgba(219, 219, 219, 0.3);\n          box-shadow: 0 1px 0 rgba(219, 219, 219, 0.3);\n}\n\n.hero .tabs ul {\n  border-bottom: none;\n}\n\n.hero.is-white {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.hero.is-white a:not(.button),\n.hero.is-white strong {\n  color: inherit;\n}\n\n.hero.is-white .title {\n  color: #0a0a0a;\n}\n\n.hero.is-white .subtitle {\n  color: rgba(10, 10, 10, 0.9);\n}\n\n.hero.is-white .subtitle a:not(.button),\n.hero.is-white .subtitle strong {\n  color: #0a0a0a;\n}\n\n.hero.is-white .nav {\n  -webkit-box-shadow: 0 1px 0 rgba(10, 10, 10, 0.2);\n          box-shadow: 0 1px 0 rgba(10, 10, 10, 0.2);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-white .nav-menu {\n    background-color: white;\n  }\n}\n\n.hero.is-white a.nav-item,\n.hero.is-white .nav-item a:not(.button) {\n  color: rgba(10, 10, 10, 0.7);\n}\n\n.hero.is-white a.nav-item:hover, .hero.is-white a.nav-item.is-active,\n.hero.is-white .nav-item a:not(.button):hover,\n.hero.is-white .nav-item a:not(.button).is-active {\n  color: #0a0a0a;\n}\n\n.hero.is-white .tabs a {\n  color: #0a0a0a;\n  opacity: 0.9;\n}\n\n.hero.is-white .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-white .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-white .tabs.is-boxed a, .hero.is-white .tabs.is-toggle a {\n  color: #0a0a0a;\n}\n\n.hero.is-white .tabs.is-boxed a:hover, .hero.is-white .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-white .tabs.is-boxed li.is-active a, .hero.is-white .tabs.is-boxed li.is-active a:hover, .hero.is-white .tabs.is-toggle li.is-active a, .hero.is-white .tabs.is-toggle li.is-active a:hover {\n  background-color: #0a0a0a;\n  border-color: #0a0a0a;\n  color: white;\n}\n\n.hero.is-white.is-bold {\n  background-image: linear-gradient(141deg, #e6e6e6 0%, white 71%, white 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-white.is-bold .nav-menu {\n    background-image: linear-gradient(141deg, #e6e6e6 0%, white 71%, white 100%);\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-white .nav-toggle span {\n    background-color: #0a0a0a;\n  }\n  .hero.is-white .nav-toggle:hover {\n    background-color: rgba(10, 10, 10, 0.1);\n  }\n  .hero.is-white .nav-toggle.is-active span {\n    background-color: #0a0a0a;\n  }\n  .hero.is-white .nav-menu .nav-item {\n    border-top-color: rgba(10, 10, 10, 0.2);\n  }\n}\n\n.hero.is-black {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.hero.is-black a:not(.button),\n.hero.is-black strong {\n  color: inherit;\n}\n\n.hero.is-black .title {\n  color: white;\n}\n\n.hero.is-black .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-black .subtitle a:not(.button),\n.hero.is-black .subtitle strong {\n  color: white;\n}\n\n.hero.is-black .nav {\n  -webkit-box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);\n          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-black .nav-menu {\n    background-color: #0a0a0a;\n  }\n}\n\n.hero.is-black a.nav-item,\n.hero.is-black .nav-item a:not(.button) {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-black a.nav-item:hover, .hero.is-black a.nav-item.is-active,\n.hero.is-black .nav-item a:not(.button):hover,\n.hero.is-black .nav-item a:not(.button).is-active {\n  color: white;\n}\n\n.hero.is-black .tabs a {\n  color: white;\n  opacity: 0.9;\n}\n\n.hero.is-black .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-black .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-black .tabs.is-boxed a, .hero.is-black .tabs.is-toggle a {\n  color: white;\n}\n\n.hero.is-black .tabs.is-boxed a:hover, .hero.is-black .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-black .tabs.is-boxed li.is-active a, .hero.is-black .tabs.is-boxed li.is-active a:hover, .hero.is-black .tabs.is-toggle li.is-active a, .hero.is-black .tabs.is-toggle li.is-active a:hover {\n  background-color: white;\n  border-color: white;\n  color: #0a0a0a;\n}\n\n.hero.is-black.is-bold {\n  background-image: linear-gradient(141deg, black 0%, #0a0a0a 71%, #181616 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-black.is-bold .nav-menu {\n    background-image: linear-gradient(141deg, black 0%, #0a0a0a 71%, #181616 100%);\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-black .nav-toggle span {\n    background-color: white;\n  }\n  .hero.is-black .nav-toggle:hover {\n    background-color: rgba(10, 10, 10, 0.1);\n  }\n  .hero.is-black .nav-toggle.is-active span {\n    background-color: white;\n  }\n  .hero.is-black .nav-menu .nav-item {\n    border-top-color: rgba(255, 255, 255, 0.2);\n  }\n}\n\n.hero.is-light {\n  background-color: whitesmoke;\n  color: #363636;\n}\n\n.hero.is-light a:not(.button),\n.hero.is-light strong {\n  color: inherit;\n}\n\n.hero.is-light .title {\n  color: #363636;\n}\n\n.hero.is-light .subtitle {\n  color: rgba(54, 54, 54, 0.9);\n}\n\n.hero.is-light .subtitle a:not(.button),\n.hero.is-light .subtitle strong {\n  color: #363636;\n}\n\n.hero.is-light .nav {\n  -webkit-box-shadow: 0 1px 0 rgba(54, 54, 54, 0.2);\n          box-shadow: 0 1px 0 rgba(54, 54, 54, 0.2);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-light .nav-menu {\n    background-color: whitesmoke;\n  }\n}\n\n.hero.is-light a.nav-item,\n.hero.is-light .nav-item a:not(.button) {\n  color: rgba(54, 54, 54, 0.7);\n}\n\n.hero.is-light a.nav-item:hover, .hero.is-light a.nav-item.is-active,\n.hero.is-light .nav-item a:not(.button):hover,\n.hero.is-light .nav-item a:not(.button).is-active {\n  color: #363636;\n}\n\n.hero.is-light .tabs a {\n  color: #363636;\n  opacity: 0.9;\n}\n\n.hero.is-light .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-light .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-light .tabs.is-boxed a, .hero.is-light .tabs.is-toggle a {\n  color: #363636;\n}\n\n.hero.is-light .tabs.is-boxed a:hover, .hero.is-light .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-light .tabs.is-boxed li.is-active a, .hero.is-light .tabs.is-boxed li.is-active a:hover, .hero.is-light .tabs.is-toggle li.is-active a, .hero.is-light .tabs.is-toggle li.is-active a:hover {\n  background-color: #363636;\n  border-color: #363636;\n  color: whitesmoke;\n}\n\n.hero.is-light.is-bold {\n  background-image: linear-gradient(141deg, #dfd8d9 0%, whitesmoke 71%, white 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-light.is-bold .nav-menu {\n    background-image: linear-gradient(141deg, #dfd8d9 0%, whitesmoke 71%, white 100%);\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-light .nav-toggle span {\n    background-color: #363636;\n  }\n  .hero.is-light .nav-toggle:hover {\n    background-color: rgba(10, 10, 10, 0.1);\n  }\n  .hero.is-light .nav-toggle.is-active span {\n    background-color: #363636;\n  }\n  .hero.is-light .nav-menu .nav-item {\n    border-top-color: rgba(54, 54, 54, 0.2);\n  }\n}\n\n.hero.is-dark {\n  background-color: #363636;\n  color: whitesmoke;\n}\n\n.hero.is-dark a:not(.button),\n.hero.is-dark strong {\n  color: inherit;\n}\n\n.hero.is-dark .title {\n  color: whitesmoke;\n}\n\n.hero.is-dark .subtitle {\n  color: rgba(245, 245, 245, 0.9);\n}\n\n.hero.is-dark .subtitle a:not(.button),\n.hero.is-dark .subtitle strong {\n  color: whitesmoke;\n}\n\n.hero.is-dark .nav {\n  -webkit-box-shadow: 0 1px 0 rgba(245, 245, 245, 0.2);\n          box-shadow: 0 1px 0 rgba(245, 245, 245, 0.2);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-dark .nav-menu {\n    background-color: #363636;\n  }\n}\n\n.hero.is-dark a.nav-item,\n.hero.is-dark .nav-item a:not(.button) {\n  color: rgba(245, 245, 245, 0.7);\n}\n\n.hero.is-dark a.nav-item:hover, .hero.is-dark a.nav-item.is-active,\n.hero.is-dark .nav-item a:not(.button):hover,\n.hero.is-dark .nav-item a:not(.button).is-active {\n  color: whitesmoke;\n}\n\n.hero.is-dark .tabs a {\n  color: whitesmoke;\n  opacity: 0.9;\n}\n\n.hero.is-dark .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-dark .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-dark .tabs.is-boxed a, .hero.is-dark .tabs.is-toggle a {\n  color: whitesmoke;\n}\n\n.hero.is-dark .tabs.is-boxed a:hover, .hero.is-dark .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-dark .tabs.is-boxed li.is-active a, .hero.is-dark .tabs.is-boxed li.is-active a:hover, .hero.is-dark .tabs.is-toggle li.is-active a, .hero.is-dark .tabs.is-toggle li.is-active a:hover {\n  background-color: whitesmoke;\n  border-color: whitesmoke;\n  color: #363636;\n}\n\n.hero.is-dark.is-bold {\n  background-image: linear-gradient(141deg, #1f191a 0%, #363636 71%, #46403f 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-dark.is-bold .nav-menu {\n    background-image: linear-gradient(141deg, #1f191a 0%, #363636 71%, #46403f 100%);\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-dark .nav-toggle span {\n    background-color: whitesmoke;\n  }\n  .hero.is-dark .nav-toggle:hover {\n    background-color: rgba(10, 10, 10, 0.1);\n  }\n  .hero.is-dark .nav-toggle.is-active span {\n    background-color: whitesmoke;\n  }\n  .hero.is-dark .nav-menu .nav-item {\n    border-top-color: rgba(245, 245, 245, 0.2);\n  }\n}\n\n.hero.is-primary {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.hero.is-primary a:not(.button),\n.hero.is-primary strong {\n  color: inherit;\n}\n\n.hero.is-primary .title {\n  color: #fff;\n}\n\n.hero.is-primary .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-primary .subtitle a:not(.button),\n.hero.is-primary .subtitle strong {\n  color: #fff;\n}\n\n.hero.is-primary .nav {\n  -webkit-box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);\n          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-primary .nav-menu {\n    background-color: #00d1b2;\n  }\n}\n\n.hero.is-primary a.nav-item,\n.hero.is-primary .nav-item a:not(.button) {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-primary a.nav-item:hover, .hero.is-primary a.nav-item.is-active,\n.hero.is-primary .nav-item a:not(.button):hover,\n.hero.is-primary .nav-item a:not(.button).is-active {\n  color: #fff;\n}\n\n.hero.is-primary .tabs a {\n  color: #fff;\n  opacity: 0.9;\n}\n\n.hero.is-primary .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-primary .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-primary .tabs.is-boxed a, .hero.is-primary .tabs.is-toggle a {\n  color: #fff;\n}\n\n.hero.is-primary .tabs.is-boxed a:hover, .hero.is-primary .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-primary .tabs.is-boxed li.is-active a, .hero.is-primary .tabs.is-boxed li.is-active a:hover, .hero.is-primary .tabs.is-toggle li.is-active a, .hero.is-primary .tabs.is-toggle li.is-active a:hover {\n  background-color: #fff;\n  border-color: #fff;\n  color: #00d1b2;\n}\n\n.hero.is-primary.is-bold {\n  background-image: linear-gradient(141deg, #009e6c 0%, #00d1b2 71%, #00e7eb 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-primary.is-bold .nav-menu {\n    background-image: linear-gradient(141deg, #009e6c 0%, #00d1b2 71%, #00e7eb 100%);\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-primary .nav-toggle span {\n    background-color: #fff;\n  }\n  .hero.is-primary .nav-toggle:hover {\n    background-color: rgba(10, 10, 10, 0.1);\n  }\n  .hero.is-primary .nav-toggle.is-active span {\n    background-color: #fff;\n  }\n  .hero.is-primary .nav-menu .nav-item {\n    border-top-color: rgba(255, 255, 255, 0.2);\n  }\n}\n\n.hero.is-info {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.hero.is-info a:not(.button),\n.hero.is-info strong {\n  color: inherit;\n}\n\n.hero.is-info .title {\n  color: #fff;\n}\n\n.hero.is-info .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-info .subtitle a:not(.button),\n.hero.is-info .subtitle strong {\n  color: #fff;\n}\n\n.hero.is-info .nav {\n  -webkit-box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);\n          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-info .nav-menu {\n    background-color: #3273dc;\n  }\n}\n\n.hero.is-info a.nav-item,\n.hero.is-info .nav-item a:not(.button) {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-info a.nav-item:hover, .hero.is-info a.nav-item.is-active,\n.hero.is-info .nav-item a:not(.button):hover,\n.hero.is-info .nav-item a:not(.button).is-active {\n  color: #fff;\n}\n\n.hero.is-info .tabs a {\n  color: #fff;\n  opacity: 0.9;\n}\n\n.hero.is-info .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-info .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-info .tabs.is-boxed a, .hero.is-info .tabs.is-toggle a {\n  color: #fff;\n}\n\n.hero.is-info .tabs.is-boxed a:hover, .hero.is-info .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-info .tabs.is-boxed li.is-active a, .hero.is-info .tabs.is-boxed li.is-active a:hover, .hero.is-info .tabs.is-toggle li.is-active a, .hero.is-info .tabs.is-toggle li.is-active a:hover {\n  background-color: #fff;\n  border-color: #fff;\n  color: #3273dc;\n}\n\n.hero.is-info.is-bold {\n  background-image: linear-gradient(141deg, #1577c6 0%, #3273dc 71%, #4366e5 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-info.is-bold .nav-menu {\n    background-image: linear-gradient(141deg, #1577c6 0%, #3273dc 71%, #4366e5 100%);\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-info .nav-toggle span {\n    background-color: #fff;\n  }\n  .hero.is-info .nav-toggle:hover {\n    background-color: rgba(10, 10, 10, 0.1);\n  }\n  .hero.is-info .nav-toggle.is-active span {\n    background-color: #fff;\n  }\n  .hero.is-info .nav-menu .nav-item {\n    border-top-color: rgba(255, 255, 255, 0.2);\n  }\n}\n\n.hero.is-success {\n  background-color: #23d160;\n  color: #fff;\n}\n\n.hero.is-success a:not(.button),\n.hero.is-success strong {\n  color: inherit;\n}\n\n.hero.is-success .title {\n  color: #fff;\n}\n\n.hero.is-success .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-success .subtitle a:not(.button),\n.hero.is-success .subtitle strong {\n  color: #fff;\n}\n\n.hero.is-success .nav {\n  -webkit-box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);\n          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-success .nav-menu {\n    background-color: #23d160;\n  }\n}\n\n.hero.is-success a.nav-item,\n.hero.is-success .nav-item a:not(.button) {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-success a.nav-item:hover, .hero.is-success a.nav-item.is-active,\n.hero.is-success .nav-item a:not(.button):hover,\n.hero.is-success .nav-item a:not(.button).is-active {\n  color: #fff;\n}\n\n.hero.is-success .tabs a {\n  color: #fff;\n  opacity: 0.9;\n}\n\n.hero.is-success .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-success .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-success .tabs.is-boxed a, .hero.is-success .tabs.is-toggle a {\n  color: #fff;\n}\n\n.hero.is-success .tabs.is-boxed a:hover, .hero.is-success .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-success .tabs.is-boxed li.is-active a, .hero.is-success .tabs.is-boxed li.is-active a:hover, .hero.is-success .tabs.is-toggle li.is-active a, .hero.is-success .tabs.is-toggle li.is-active a:hover {\n  background-color: #fff;\n  border-color: #fff;\n  color: #23d160;\n}\n\n.hero.is-success.is-bold {\n  background-image: linear-gradient(141deg, #12af2f 0%, #23d160 71%, #2ce28a 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-success.is-bold .nav-menu {\n    background-image: linear-gradient(141deg, #12af2f 0%, #23d160 71%, #2ce28a 100%);\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-success .nav-toggle span {\n    background-color: #fff;\n  }\n  .hero.is-success .nav-toggle:hover {\n    background-color: rgba(10, 10, 10, 0.1);\n  }\n  .hero.is-success .nav-toggle.is-active span {\n    background-color: #fff;\n  }\n  .hero.is-success .nav-menu .nav-item {\n    border-top-color: rgba(255, 255, 255, 0.2);\n  }\n}\n\n.hero.is-warning {\n  background-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning a:not(.button),\n.hero.is-warning strong {\n  color: inherit;\n}\n\n.hero.is-warning .title {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning .subtitle {\n  color: rgba(0, 0, 0, 0.9);\n}\n\n.hero.is-warning .subtitle a:not(.button),\n.hero.is-warning .subtitle strong {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning .nav {\n  -webkit-box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);\n          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-warning .nav-menu {\n    background-color: #ffdd57;\n  }\n}\n\n.hero.is-warning a.nav-item,\n.hero.is-warning .nav-item a:not(.button) {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning a.nav-item:hover, .hero.is-warning a.nav-item.is-active,\n.hero.is-warning .nav-item a:not(.button):hover,\n.hero.is-warning .nav-item a:not(.button).is-active {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning .tabs a {\n  color: rgba(0, 0, 0, 0.7);\n  opacity: 0.9;\n}\n\n.hero.is-warning .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-warning .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-warning .tabs.is-boxed a, .hero.is-warning .tabs.is-toggle a {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning .tabs.is-boxed a:hover, .hero.is-warning .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-warning .tabs.is-boxed li.is-active a, .hero.is-warning .tabs.is-boxed li.is-active a:hover, .hero.is-warning .tabs.is-toggle li.is-active a, .hero.is-warning .tabs.is-toggle li.is-active a:hover {\n  background-color: rgba(0, 0, 0, 0.7);\n  border-color: rgba(0, 0, 0, 0.7);\n  color: #ffdd57;\n}\n\n.hero.is-warning.is-bold {\n  background-image: linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-warning.is-bold .nav-menu {\n    background-image: linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%);\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-warning .nav-toggle span {\n    background-color: rgba(0, 0, 0, 0.7);\n  }\n  .hero.is-warning .nav-toggle:hover {\n    background-color: rgba(10, 10, 10, 0.1);\n  }\n  .hero.is-warning .nav-toggle.is-active span {\n    background-color: rgba(0, 0, 0, 0.7);\n  }\n  .hero.is-warning .nav-menu .nav-item {\n    border-top-color: rgba(0, 0, 0, 0.2);\n  }\n}\n\n.hero.is-danger {\n  background-color: #ff3860;\n  color: #fff;\n}\n\n.hero.is-danger a:not(.button),\n.hero.is-danger strong {\n  color: inherit;\n}\n\n.hero.is-danger .title {\n  color: #fff;\n}\n\n.hero.is-danger .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-danger .subtitle a:not(.button),\n.hero.is-danger .subtitle strong {\n  color: #fff;\n}\n\n.hero.is-danger .nav {\n  -webkit-box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);\n          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-danger .nav-menu {\n    background-color: #ff3860;\n  }\n}\n\n.hero.is-danger a.nav-item,\n.hero.is-danger .nav-item a:not(.button) {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-danger a.nav-item:hover, .hero.is-danger a.nav-item.is-active,\n.hero.is-danger .nav-item a:not(.button):hover,\n.hero.is-danger .nav-item a:not(.button).is-active {\n  color: #fff;\n}\n\n.hero.is-danger .tabs a {\n  color: #fff;\n  opacity: 0.9;\n}\n\n.hero.is-danger .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-danger .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-danger .tabs.is-boxed a, .hero.is-danger .tabs.is-toggle a {\n  color: #fff;\n}\n\n.hero.is-danger .tabs.is-boxed a:hover, .hero.is-danger .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-danger .tabs.is-boxed li.is-active a, .hero.is-danger .tabs.is-boxed li.is-active a:hover, .hero.is-danger .tabs.is-toggle li.is-active a, .hero.is-danger .tabs.is-toggle li.is-active a:hover {\n  background-color: #fff;\n  border-color: #fff;\n  color: #ff3860;\n}\n\n.hero.is-danger.is-bold {\n  background-image: linear-gradient(141deg, #ff0561 0%, #ff3860 71%, #ff5257 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-danger.is-bold .nav-menu {\n    background-image: linear-gradient(141deg, #ff0561 0%, #ff3860 71%, #ff5257 100%);\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-danger .nav-toggle span {\n    background-color: #fff;\n  }\n  .hero.is-danger .nav-toggle:hover {\n    background-color: rgba(10, 10, 10, 0.1);\n  }\n  .hero.is-danger .nav-toggle.is-active span {\n    background-color: #fff;\n  }\n  .hero.is-danger .nav-menu .nav-item {\n    border-top-color: rgba(255, 255, 255, 0.2);\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .hero.is-medium .hero-body {\n    padding-bottom: 9rem;\n    padding-top: 9rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .hero.is-large .hero-body {\n    padding-bottom: 18rem;\n    padding-top: 18rem;\n  }\n}\n\n.hero.is-halfheight .hero-body, .hero.is-fullheight .hero-body {\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n}\n\n.hero.is-halfheight .hero-body > .container, .hero.is-fullheight .hero-body > .container {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  -ms-flex-negative: 1;\n      flex-shrink: 1;\n}\n\n.hero.is-halfheight {\n  min-height: 50vh;\n}\n\n.hero.is-fullheight {\n  min-height: 100vh;\n}\n\n.section {\n  background-color: white;\n  padding: 3rem 1.5rem;\n}\n\n@media screen and (min-width: 1000px) {\n  .section.is-medium {\n    padding: 9rem 1.5rem;\n  }\n  .section.is-large {\n    padding: 18rem 1.5rem;\n  }\n}\n\n.footer {\n  background-color: whitesmoke;\n  padding: 3rem 1.5rem 6rem;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2J1bG1hLnNhc3MiLCIuLi9zYXNzL3V0aWxpdGllcy9hbmltYXRpb25zLnNhc3MiLCJidWxtYS5jc3MiLCIuLi9zYXNzL2Jhc2UvbWluaXJlc2V0LnNhc3MiLCIuLi9zYXNzL2Jhc2UvZ2VuZXJpYy5zYXNzIiwiLi4vc2Fzcy91dGlsaXRpZXMvaW5pdGlhbC12YXJpYWJsZXMuc2FzcyIsIi4uL3Nhc3MvdXRpbGl0aWVzL21peGlucy5zYXNzIiwiLi4vc2Fzcy9iYXNlL2hlbHBlcnMuc2FzcyIsIi4uL3Nhc3MvZWxlbWVudHMvYm94LnNhc3MiLCIuLi9zYXNzL2VsZW1lbnRzL2J1dHRvbi5zYXNzIiwiLi4vc2Fzcy91dGlsaXRpZXMvY29udHJvbHMuc2FzcyIsIi4uL3Nhc3MvdXRpbGl0aWVzL2Z1bmN0aW9ucy5zYXNzIiwiLi4vc2Fzcy9lbGVtZW50cy9jb250ZW50LnNhc3MiLCIuLi9zYXNzL2VsZW1lbnRzL2Zvcm0uc2FzcyIsIi4uL3Nhc3MvZWxlbWVudHMvaWNvbi5zYXNzIiwiLi4vc2Fzcy9lbGVtZW50cy9pbWFnZS5zYXNzIiwiLi4vc2Fzcy9lbGVtZW50cy9ub3RpZmljYXRpb24uc2FzcyIsIi4uL3Nhc3MvZWxlbWVudHMvcHJvZ3Jlc3Muc2FzcyIsIi4uL3Nhc3MvZWxlbWVudHMvdGFibGUuc2FzcyIsIi4uL3Nhc3MvZWxlbWVudHMvdGFnLnNhc3MiLCIuLi9zYXNzL2VsZW1lbnRzL3RpdGxlLnNhc3MiLCIuLi9zYXNzL2VsZW1lbnRzL290aGVyLnNhc3MiLCIuLi9zYXNzL2NvbXBvbmVudHMvYnJlYWRjcnVtYi5zYXNzIiwiLi4vc2Fzcy9jb21wb25lbnRzL2NhcmQuc2FzcyIsIi4uL3Nhc3MvY29tcG9uZW50cy9sZXZlbC5zYXNzIiwiLi4vc2Fzcy9jb21wb25lbnRzL21lZGlhLnNhc3MiLCIuLi9zYXNzL2NvbXBvbmVudHMvbWVudS5zYXNzIiwiLi4vc2Fzcy9jb21wb25lbnRzL21lc3NhZ2Uuc2FzcyIsIi4uL3Nhc3MvY29tcG9uZW50cy9tb2RhbC5zYXNzIiwiLi4vc2Fzcy9jb21wb25lbnRzL25hdi5zYXNzIiwiLi4vc2Fzcy9jb21wb25lbnRzL25hdmJhci5zYXNzIiwiLi4vc2Fzcy9jb21wb25lbnRzL3BhZ2luYXRpb24uc2FzcyIsIi4uL3Nhc3MvY29tcG9uZW50cy9wYW5lbC5zYXNzIiwiLi4vc2Fzcy9jb21wb25lbnRzL3RhYnMuc2FzcyIsIi4uL3Nhc3MvZ3JpZC9jb2x1bW5zLnNhc3MiLCIuLi9zYXNzL2dyaWQvdGlsZXMuc2FzcyIsIi4uL3Nhc3MvbGF5b3V0L2hlcm8uc2FzcyIsIi4uL3Nhc3MvbGF5b3V0L3NlY3Rpb24uc2FzcyIsIi4uL3Nhc3MvbGF5b3V0L2Zvb3Rlci5zYXNzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDhEQUE4RDtBQ0E5RDtFQUNFO0lBQ0UsZ0NBQXVCO1lBQXZCLHdCQUF1QjtHQ0V4QjtFREREO0lBQ0Usa0NBQXlCO1lBQXpCLDBCQUF5QjtHQ0cxQjtDQUNGO0FEUkQ7RUFDRTtJQUNFLGdDQUF1QjtZQUF2Qix3QkFBdUI7R0NFeEI7RURERDtJQUNFLGtDQUF5QjtZQUF6QiwwQkFBeUI7R0NHMUI7Q0FDRjs7QUNSRCwyRUFBMkU7QUFFM0U7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBdUJFLFVBQVM7RUFDVCxXQUFVO0NBQUk7O0FBR2hCOzs7Ozs7RUFNRSxnQkFBZTtFQUNmLG9CQUFtQjtDQUFJOztBQUd6QjtFQUNFLGlCQUFnQjtDQUFJOztBQUd0Qjs7OztFQUlFLFVBQVM7Q0FBSTs7QUFHZjtFQUNFLCtCQUFzQjtVQUF0Qix1QkFBc0I7Q0FBSTs7QUFFNUI7RUFDRSw0QkFBbUI7VUFBbkIsb0JBQW1CO0NBR1E7O0FBSjdCO0VBSUksNEJBQW1CO1VBQW5CLG9CQUFtQjtDQUFJOztBQUczQjs7Ozs7RUFLRSxnQkFBZTtDQUFJOztBQUdyQjtFQUNFLFVBQVM7Q0FBSTs7QUFHZjtFQUNFLDBCQUF5QjtFQUN6QixrQkFBaUI7Q0FBSTs7QUFFdkI7O0VBRUUsV0FBVTtFQUNWLGlCQUFnQjtD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QjtNQUEzQixxQkFBMkI7VUFBM0IsNEJBQTJCO0VBQzNCLGlCQUFnQjtFQUNoQixvQ0FmNEM7RUFnQjVDLGtDQWY4QztFQWdCOUMsbUNBaEI4QztFQWlCOUMsaUNBbEI0QztFQW1CNUMsbUJBQWtCO0VBQ2xCLG9CQUFtQjtFR0FuQix3QlJUNkI7RVFVN0Isc0JSZDRCO0VRZTVCLGVSbkI0QjtFUXVDNUIsMERSM0MyQjtVUTJDM0Isa0RSM0MyQjtFUTRDM0IsZ0JBQWU7RUFDZixZQUFXO0NBcUJROztBSDNDbkI7Ozs7O0VBSUUsY0FBYTtDQUFJOztBQUNuQjs7RUFDRSxvQkFBbUI7Q0FBSTs7QUdMekI7OztFQUVFLHNCUm5CMEI7Q1FtQlU7O0FBQ3RDOzs7OztFQUlFLHNCUmQ4QjtDUWNNOztBQUN0Qzs7RUFDRSw2QlJ2QjBCO0VRd0IxQix5QlJ4QjBCO0VReUIxQix5QkFBZ0I7VUFBaEIsaUJBQWdCO0VBQ2hCLGVSOUIwQjtDUWdDSzs7QVBrSS9COztFT2xJRSw2QlJsQ3dCO0NDcUtiOztBQURiOztFT2xJRSw2QlJsQ3dCO0NDcUtiOztBQURiOztFT2xJRSw2QlJsQ3dCO0NDcUtiOztBQURiOztFT2xJRSw2QlJsQ3dCO0NDcUtiOztBT2pJakI7O0VBT0ksd0JBQXVCO0NBQUk7O0FBUC9COztFQVlNLG9CUnhDeUI7Q1F3Q0Y7O0FBWjdCOztFQVlNLHNCUnBEdUI7Q1FvREE7O0FBWjdCOztFQVlNLHlCUjFDd0I7Q1EwQ0Q7O0FBWjdCOztFQVlNLHNCUmhEd0I7Q1FnREQ7O0FBWjdCOztFQVlNLHNCUm5DNEI7Q1FtQ0w7O0FBWjdCOztFQVlNLHNCUmxDNEI7Q1FrQ0w7O0FBWjdCOztFQVlNLHNCUnBDNEI7Q1FvQ0w7O0FBWjdCOztFQVlNLHNCUnJDNEI7Q1FxQ0w7O0FBWjdCOztFQVlNLHNCUmhDNEI7Q1FnQ0w7O0FBWjdCOztFSFBFLG1CTDJCZ0I7RUsxQmhCLG1CTEFjO0NRcUJhOztBQWY3Qjs7RUhKRSxtQkxKYztDUXlCYzs7QUFqQjlCOztFSEZFLGtCTFBhO0NRNEJjOztBQW5CN0I7O0VBc0JJLGVBQWM7RUFDZCxZQUFXO0NBQUk7O0FBdkJuQjs7RUF5QkksZ0JBQWU7RUFDZixZQUFXO0NBQUk7O0FBRW5CO0VBQ0UsZUFBYztFQUNkLGtCQUFpQjtFQUNqQixnQkFBZTtFQUNmLGtCQUFpQjtFQUNqQixnQkFBZTtFQUNmLGlCQUFnQjtFQUNoQixpQkFBZ0I7Q0FBSTs7QUFFdEI7O0VBRUUsZ0JBQWU7RUFDZixzQkFBcUI7RUFDckIsa0JBQWlCO0VBQ2pCLG1CQUFrQjtDQU9TOztBQVo3Qjs7RUFPSSxnQkFBZTtDQUFJOztBQVB2Qjs7RUFTSSxlUmxGMEI7Q1FrRko7O0FBVDFCOztFQVdJLGVSbEYwQjtFUW1GMUIsb0JBQW1CO0NBQUk7O0FBRTNCO0VBRUksbUJBQWtCO0NBQUk7O0FBRTFCO0VBQ0Usc0JBQXFCO0VBQ3JCLGVBQWM7RUFDZCxnQkFBZTtFQUNmLG1CQUFrQjtFQUNsQixvQkFBbUI7Q0EwRGM7O0FBL0RuQztFUGhHRSwwQkRrQmdDO0VDakJoQyxnQkFBZTtFQUNmLGNBQWE7RUFDYixhQUFZO0VBQ1osZUFBYztFQUNkLGNBQWE7RUFDYixxQkFBb0I7RUFDcEIsbUJBQWtCO0VBQ2xCLGtDQUF5QjtVQUF6QiwwQkFBeUI7RUFDekIsYUFBWTtFTytGVixxQkFBb0I7RUFDcEIsZUFBYztFQUNkLFNBQVE7RUFDUixXQUFVO0NBQUk7O0FBWGxCO0VIMUZFLHNCQUFxQjtFQUNyQix5QkFBd0I7RUFDeEIsMEJBQW1CO01BQW5CLHVCQUFtQjtVQUFuQixvQkFBbUI7RUFDbkIsOEJBQTZCO0VBQzdCLG1CTG9EVTtFS25EVix5QkFBZ0I7VUFBaEIsaUJBQWdCO0VBQ2hCLDRCQUFvQjtFQUFwQiw0QkFBb0I7RUFBcEIscUJBQW9CO0VBQ3BCLGdCTHFCVztFS3BCWCxlQUFjO0VBQ2Qsd0JBQTJCO01BQTNCLHFCQUEyQjtVQUEzQiw0QkFBMkI7RUFDM0IsaUJBQWdCO0VBQ2hCLG9DQWY0QztFQWdCNUMsa0NBZjhDO0VBZ0I5QyxtQ0FoQjhDO0VBaUI5QyxpQ0FsQjRDO0VBbUI1QyxtQkFBa0I7RUFDbEIsb0JBQW1CO0VHQW5CLHdCUlQ2QjtFUVU3QixzQlJkNEI7RVFlNUIsZVJuQjRCO0VReUcxQixnQkFBZTtFQUNmLGVBQWM7RUFDZCxlQUFjO0VBQ2QsZ0JBQWU7RUFDZixjQUFhO0VBQ2IscUJBQW9CO0NBTXVCOztBQXpCL0M7RUhwRUksY0FBYTtDQUFJOztBR29FckI7RUhsRUksb0JBQW1CO0NBQUk7O0FHa0UzQjtFQXJFSSxzQlJuQjBCO0NRbUJVOztBQXFFeEM7RUFoRUksc0JSZDhCO0NRY007O0FBZ0V4QztFQTlESSw2QlJ2QjBCO0VRd0IxQix5QlJ4QjBCO0VReUIxQix5QkFBZ0I7VUFBaEIsaUJBQWdCO0VBQ2hCLGVSOUIwQjtDUWdDSzs7QUF5RG5DO0VBekRNLDZCUmxDd0I7Q0NxS2I7O0FPMUVqQjtFQXpETSw2QlJsQ3dCO0NDcUtiOztBTzFFakI7RUF6RE0sNkJSbEN3QjtDQ3FLYjs7QU8xRWpCO0VBekRNLDZCUmxDd0I7Q0NxS2I7O0FPMUVqQjtFQXFCTSxzQlI3R3dCO0NRNkdZOztBQXJCMUM7RUF1Qk0sY0FBYTtDQUFJOztBQXZCdkI7RUF5Qk0seUJSOUd3QjtDUThHZTs7QUF6QjdDO0VBNkJNLHNCUnhId0I7Q1F3SEs7O0FBN0JuQztFQWtDTSxvQlJySHlCO0NRcUhGOztBQWxDN0I7RUFrQ00sc0JSakl1QjtDUWlJQTs7QUFsQzdCO0VBa0NNLHlCUnZId0I7Q1F1SEQ7O0FBbEM3QjtFQWtDTSxzQlI3SHdCO0NRNkhEOztBQWxDN0I7RUFrQ00sc0JSaEg0QjtDUWdITDs7QUFsQzdCO0VBa0NNLHNCUi9HNEI7Q1ErR0w7O0FBbEM3QjtFQWtDTSxzQlJqSDRCO0NRaUhMOztBQWxDN0I7RUFrQ00sc0JSbEg0QjtDUWtITDs7QUFsQzdCO0VBa0NNLHNCUjdHNEI7Q1E2R0w7O0FBbEM3QjtFSDlERSxtQkwyQmdCO0VLMUJoQixtQkxBYztDUWtHYTs7QUFyQzdCO0VIM0RFLG1CTEpjO0NRc0djOztBQXZDOUI7RUh6REUsa0JMUGE7Q1F5R2M7O0FBekM3QjtFQTZDTSxzQlJ0SXdCO0NRc0lROztBQTdD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LHdCL0JsRHlCO0UrQm1EekIsZS9CL0R1QjtDK0I4SGtDOztBQWpGL0Q7O0VBcUJRLGVBQWM7Q0FBSTs7QUFyQjFCO0VBdUJRLGUvQnBFcUI7QytCb0VFOztBQXZCL0I7RUF5QlEsNkIvQnRFcUI7QytCeUVNOztBQTVCbkM7O0VBNEJVLGUvQnpFbUI7QytCeUVJOztBQTVCakM7RUE4QlEsa0QvQjNFcUI7VStCMkVyQiwwQy9CM0VxQjtDK0IyRTBCOztBOUJrSHJEO0U4QmhKRjtJQWlDVSx3Qi9CbEVxQjtHK0JrRVE7Q2xDaWpNdEM7O0FrQ2xsTUQ7O0VBb0NRLDZCL0JqRnFCO0MrQm9GTTs7QUF2Q25DOzs7RUF1Q1UsZS9CcEZtQjtDK0JvRkk7O0FBdkNqQztFQTBDVSxlL0J2Rm1CO0UrQndGbkIsYUFBWTtDQUVNOztBQTdDNUI7RUE2Q1ksV0FBVTtDQUFJOztBQTdDMUI7RUFnRFksV0FBVTtDQUFJOztBQWhEMUI7RUFvRFksZS9CakdpQjtDK0JtR3lCOztBQXREdEQ7RUFzRGMsd0MvQm5HZTtDK0JtR3VCOztBQXREcEQ7RUEwRGMsMEIvQnZHZTtFK0J3R2Ysc0IvQnhHZTtFK0J5R2YsYS9CN0ZpQjtDK0I2RkQ7O0FBNUQ5QjtFQWlFUSw2RUFBeUc7Q0FHVzs7QTlCNEUxSDtFOEJoSkY7SUFvRVksNkVBQXlHO0dBQUc7Q2xDOGpNdkg7O0FJbC9MQztFOEJoSkY7SUF5RVksMEIvQnRIaUI7RytCc0hpQjtFQXpFOUM7SUEyRVksd0MvQnhIaUI7RytCd0hxQjtFQTNFbEQ7SUE4RWMsMEIvQjNIZTtHK0IySG1CO0VBOUVoRDtJQWlGWSx3Qy9COUhpQjtHK0I4SDRCO0NsQ2drTXhEOztBa0NqcE1EO0VBaUJNLDBCL0I5RHVCO0UrQitEdkIsYS9CbkR5QjtDK0JrSGdDOztBQWpGL0Q7O0VBcUJRLGVBQWM7Q0FBSTs7QUFyQjFCO0VBdUJRLGEvQnhEdUI7QytCd0RBOztBQXZCL0I7RUF5QlEsZ0MvQjFEdUI7QytCNkRJOztBQTVCbkM7O0VBNEJVLGEvQjdEcUI7QytCNkRFOztBQTVCakM7RUE4QlEscUQvQi9EdUI7VStCK0R2Qiw2Qy9CL0R1QjtDK0IrRHdCOztBOUJrSHJEO0U4QmhKRjtJQWlDVSwwQi9COUVtQjtHK0I4RVU7Q2xDaXBNdEM7O0FrQ2xyTUQ7O0VBb0NRLGdDL0JyRXVCO0MrQndFSTs7QUF2Q25DOzs7RUF1Q1UsYS9CeEVxQjtDK0J3RUU7O0FBdkNqQztFQTBDVSxhL0IzRXFCO0UrQjRFckIsYUFBWTtDQUVNOztBQTdDNUI7RUE2Q1ksV0FBVTtDQUFJOztBQTdDMUI7RUFnRFksV0FBVTtDQUFJOztBQWhEMUI7RUFvRFksYS9CckZtQjtDK0J1RnVCOztBQXREdEQ7RUFzRGMsd0MvQm5HZTtDK0JtR3VCOztBQXREcEQ7RUEwRGMsd0IvQjNGaUI7RStCNEZqQixvQi9CNUZpQjtFK0I2RmpCLGUvQnpHZTtDK0J5R0M7O0FBNUQ5QjtFQWlFUSwrRUFBeUc7Q0FHVzs7QTlCNEUxSDtFOEJoSkY7SUFvRVksK0VBQXlHO0dBQUc7Q2xDOHBNdkg7O0FJbGxNQztFOEJoSkY7SUF5RVksd0IvQjFHbUI7RytCMEdlO0VBekU5QztJQTJFWSx3Qy9CeEhpQjtHK0J3SHFCO0VBM0VsRDtJQThFYyx3Qi9CL0dpQjtHK0IrR2lCO0VBOUVoRDtJQWlGWSwyQy9CbEhtQjtHK0JrSDBCO0NsQ2dxTXhEOztBa0Nqdk1EO0VBaUJNLDZCL0JwRHdCO0UrQnFEeEIsZS9CM0R3QjtDK0IwSGlDOztBQWpGL0Q7O0VBcUJRLGVBQWM7Q0FBSTs7QUFyQjFCO0VBdUJRLGUvQmhFc0I7QytCZ0VDOztBQXZCL0I7RUF5QlEsNkIvQmxFc0I7QytCcUVLOztBQTVCbkM7O0VBNEJVLGUvQnJFb0I7QytCcUVHOztBQTVCakM7RUE4QlEsa0QvQnZFc0I7VStCdUV0QiwwQy9CdkVzQjtDK0J1RXlCOztBOUJrSHJEO0U4QmhKRjtJQWlDVSw2Qi9CcEVvQjtHK0JvRVM7Q2xDaXZNdEM7O0FrQ2x4TUQ7O0VBb0NRLDZCL0I3RXNCO0MrQmdGSzs7QUF2Q25DOzs7RUF1Q1UsZS9CaEZvQjtDK0JnRkc7O0FBdkNqQztFQTBDVSxlL0JuRm9CO0UrQm9GcEIsYUFBWTtDQUVNOztBQTdDNUI7RUE2Q1ksV0FBVTtDQUFJOztBQTdDMUI7RUFnRFksV0FBVTtDQUFJOztBQWhEMUI7RUFvRFksZS9CN0ZrQjtDK0IrRndCOztBQXREdEQ7RUFzRGMsd0MvQm5HZTtDK0JtR3VCOztBQXREcEQ7RUEwRGMsMEIvQm5HZ0I7RStCb0doQixzQi9CcEdnQjtFK0JxR2hCLGtCL0IvRmdCO0MrQitGQTs7QUE1RDlCO0VBaUVRLGtGQUF5RztDQUdXOztBOUI0RTFIO0U4QmhKRjtJQW9FWSxrRkFBeUc7R0FBRztDbEM4dk12SDs7QUlsck1DO0U4QmhKRjtJQXlFWSwwQi9CbEhrQjtHK0JrSGdCO0VBekU5QztJQTJFWSx3Qy9CeEhpQjtHK0J3SHFCO0VBM0VsRDtJQThFYywwQi9CdkhnQjtHK0J1SGtCO0VBOUVoRDtJQWlGWSx3Qy9CMUhrQjtHK0IwSDJCO0NsQ2d3TXhEOztBa0NqMU1EO0VBaUJNLDBCL0IxRHdCO0UrQjJEeEIsa0IvQnJEd0I7QytCb0hpQzs7QUFqRi9EOztFQXFCUSxlQUFjO0NBQUk7O0FBckIxQjtFQXVCUSxrQi9CMURzQjtDK0IwREM7O0FBdkIvQjtFQXlCUSxnQy9CNURzQjtDK0IrREs7O0FBNUJuQzs7RUE0QlUsa0IvQi9Eb0I7QytCK0RHOztBQTVCakM7RUE4QlEscUQvQmpFc0I7VStCaUV0Qiw2Qy9CakVzQjtDK0JpRXlCOztBOUJrSHJEO0U4QmhKRjtJQWlDVSwwQi9CMUVvQjtHK0IwRVM7Q2xDaTFNdEM7O0FrQ2wzTUQ7O0VBb0NRLGdDL0J2RXNCO0MrQjBFSzs7QUF2Q25DOzs7RUF1Q1Usa0IvQjFFb0I7QytCMEVHOztBQXZDakM7RUEwQ1Usa0IvQjdFb0I7RStCOEVwQixhQUFZO0NBRU07O0FBN0M1QjtFQTZDWSxXQUFVO0NBQUk7O0FBN0MxQjtFQWdEWSxXQUFVO0NBQUk7O0FBaEQxQjtFQW9EWSxrQi9CdkZrQjtDK0J5RndCOztBQXREdEQ7RUFzRGMsd0MvQm5HZTtDK0JtR3VCOztBQXREcEQ7RUEwRGMsNkIvQjdGZ0I7RStCOEZoQix5Qi9COUZnQjtFK0IrRmhCLGUvQnJHZ0I7QytCcUdBOztBQTVEOUI7RUFpRVEsaUZBQXlHO0NBR1c7O0E5QjRFMUg7RThCaEpGO0lBb0VZLGlGQUF5RztHQUFHO0NsQzgxTXZIOztBSWx4TUM7RThCaEpGO0lBeUVZLDZCL0I1R2tCO0crQjRHZ0I7RUF6RTlDO0lBMkVZLHdDL0J4SGlCO0crQndIcUI7RUEzRWxEO0lBOEVjLDZCL0JqSGdCO0crQmlIa0I7RUE5RWhEO0lBaUZZLDJDL0JwSGtCO0crQm9IMkI7Q2xDZzJNeEQ7O0FrQ2o3TUQ7RUFpQk0sMEIvQjdDNEI7RStCOEM1QixZekJ0Q1U7Q3lCcUcrQzs7QUFqRi9EOztFQXFCUSxlQUFjO0NBQUk7O0FBckIxQjtFQXVCUSxZekIzQ1E7Q3lCMkNlOztBQXZCL0I7RUF5QlEsZ0N6QjdDUTtDeUJnRG1COztBQTVCbkM7O0VBNEJVLFl6QmhETTtDeUJnRGlCOztBQTVCakM7RUE4QlEscUR6QmxEUTtVeUJrRFIsNkN6QmxEUTtDeUJrRHVDOztBOUJrSHJEO0U4QmhKRjtJQWlDVSwwQi9CN0R3QjtHK0I2REs7Q2xDaTdNdEM7O0FrQ2w5TUQ7O0VBb0NRLGdDekJ4RFE7Q3lCMkRtQjs7QUF2Q25DOzs7RUF1Q1UsWXpCM0RNO0N5QjJEaUI7O0FBdkNqQztFQTBDVSxZekI5RE07RXlCK0ROLGFBQVk7Q0FFTTs7QUE3QzVCO0VBNkNZLFdBQVU7Q0FBSTs7QUE3QzFCO0VBZ0RZLFdBQVU7Q0FBSTs7QUFoRDFCO0VBb0RZLFl6QnhFSTtDeUIwRXNDOztBQXREdEQ7RUFzRGMsd0MvQm5HZTtDK0JtR3VCOztBQXREcEQ7RUEwRGMsdUJ6QjlFRTtFeUIrRUYsbUJ6Qi9FRTtFeUJnRkYsZS9CeEZvQjtDK0J3Rko7O0FBNUQ5QjtFQWlFUSxpRkFBeUc7Q0FHVzs7QTlCNEUxSDtFOEJoSkY7SUFvRVksaUZBQXlHO0dBQUc7Q2xDODdNdkg7O0FJbDNNQztFOEJoSkY7SUF5RVksdUJ6QjdGSTtHeUI2RjhCO0VBekU5QztJQTJFWSx3Qy9CeEhpQjtHK0J3SHFCO0VBM0VsRDtJQThFYyx1QnpCbEdFO0d5QmtHZ0M7RUE5RWhEO0lBaUZZLDJDekJyR0k7R3lCcUd5QztDbENnOE14RDs7QWtDamhORDtFQWlCTSwwQi9CNUM0QjtFK0I2QzVCLFl6QnRDVTtDeUJxRytDOztBQWpGL0Q7O0VBcUJRLGVBQWM7Q0FBSTs7QUFyQjFCO0VBdUJRLFl6QjNDUTtDeUIyQ2U7O0FBdkIvQjtFQXlCUSxnQ3pCN0NRO0N5QmdEbUI7O0FBNUJuQzs7RUE0QlUsWXpCaERNO0N5QmdEaUI7O0FBNUJqQztFQThCUSxxRHpCbERRO1V5QmtEUiw2Q3pCbERRO0N5QmtEdUM7O0E5QmtIckQ7RThCaEpGO0lBaUNVLDBCL0I1RHdCO0crQjRESztDbENpaE50Qzs7QWtDbGpORDs7RUFvQ1EsZ0N6QnhEUTtDeUIyRG1COztBQXZDbkM7OztFQXVDVSxZekIzRE07Q3lCMkRpQjs7QUF2Q2pDO0VBMENVLFl6QjlETTtFeUIrRE4sYUFBWTtDQUVNOztBQTdDNUI7RUE2Q1ksV0FBVTtDQUFJOztBQTdDMUI7RUFnRFksV0FBVTtDQUFJOztBQWhEMUI7RUFvRFksWXpCeEVJO0N5QjBFc0M7O0FBdER0RDtFQXNEYyx3Qy9CbkdlO0MrQm1HdUI7O0FBdERwRDtFQTBEYyx1QnpCOUVFO0V5QitFRixtQnpCL0VFO0V5QmdGRixlL0J2Rm9CO0MrQnVGSjs7QUE1RDlCO0VBaUVRLGlGQUF5RztDQUdXOztBOUI0RTFIO0U4QmhKRjtJQW9FWSxpRkFBeUc7R0FBRztDbEM4aE52SDs7QUlsOU1DO0U4QmhKRjtJQXlFWSx1QnpCN0ZJO0d5QjZGOEI7RUF6RTlDO0lBMkVZLHdDL0J4SGlCO0crQndIcUI7RUEzRWxEO0lBOEVjLHVCekJsR0U7R3lCa0dnQztFQTlFaEQ7SUFpRlksMkN6QnJHSTtHeUJxR3lDO0NsQ2dpTnhEOztBa0Nqbk5EO0VBaUJNLDBCL0I5QzRCO0UrQitDNUIsWXpCdENVO0N5QnFHK0M7O0FBakYvRDs7RUFxQlEsZUFBYztDQUFJOztBQXJCMUI7RUF1QlEsWXpCM0NRO0N5QjJDZTs7QUF2Qi9CO0VBeUJRLGdDekI3Q1E7Q3lCZ0RtQjs7QUE1Qm5DOztFQTRCVSxZekJoRE07Q3lCZ0RpQjs7QUE1QmpDO0VBOEJRLHFEekJsRFE7VXlCa0RSLDZDekJsRFE7Q3lCa0R1Qzs7QTlCa0hyRDtFOEJoSkY7SUFpQ1UsMEIvQjlEd0I7RytCOERLO0NsQ2luTnRDOztBa0NscE5EOztFQW9DUSxnQ3pCeERRO0N5QjJEbUI7O0FBdkNuQzs7O0VBdUNVLFl6QjNETTtDeUIyRGlCOztBQXZDakM7RUEwQ1UsWXpCOURNO0V5QitETixhQUFZO0NBRU07O0FBN0M1QjtFQTZDWSxXQUFVO0NBQUk7O0FBN0MxQjtFQWdEWSxXQUFVO0NBQUk7O0FBaEQxQjtFQW9EWSxZekJ4RUk7Q3lCMEVzQzs7QUF0RHREO0VBc0RjLHdDL0JuR2U7QytCbUd1Qjs7QUF0RHBEO0VBMERjLHVCekI5RUU7RXlCK0VGLG1CekIvRUU7RXlCZ0ZGLGUvQnpGb0I7QytCeUZKOztBQTVEOUI7RUFpRVEsaUZBQXlHO0NBR1c7O0E5QjRFMUg7RThCaEpGO0lBb0VZLGlGQUF5RztHQUFHO0NsQzhuTnZIOztBSWxqTkM7RThCaEpGO0lBeUVZLHVCekI3Rkk7R3lCNkY4QjtFQXpFOUM7SUEyRVksd0MvQnhIaUI7RytCd0hxQjtFQTNFbEQ7SUE4RWMsdUJ6QmxHRTtHeUJrR2dDO0VBOUVoRDtJQWlGWSwyQ3pCckdJO0d5QnFHeUM7Q2xDZ29OeEQ7O0FrQ2p0TkQ7RUFpQk0sMEIvQi9DNEI7RStCZ0Q1QiwwQnpCeENlO0N5QnVHMEM7O0FBakYvRDs7RUFxQlEsZUFBYztDQUFJOztBQXJCMUI7RUF1QlEsMEJ6QjdDYTtDeUI2Q1U7O0FBdkIvQjtFQXlCUSwwQnpCL0NhO0N5QmtEYzs7QUE1Qm5DOztFQTRCVSwwQnpCbERXO0N5QmtEWTs7QUE1QmpDO0VBOEJRLCtDekJwRGE7VXlCb0RiLHVDekJwRGE7Q3lCb0RrQzs7QTlCa0hyRDtFOEJoSkY7SUFpQ1UsMEIvQi9Ed0I7RytCK0RLO0NsQ2l0TnRDOztBa0Nsdk5EOztFQW9DUSwwQnpCMURhO0N5QjZEYzs7QUF2Q25DOzs7RUF1Q1Us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 */", ""]);

// exports


/***/ }),
/* 35 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function() {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		var result = [];
		for(var i = 0; i < this.length; i++) {
			var item = this[i];
			if(item[2]) {
				result.push("@media " + item[2] + "{" + item[1] + "}");
			} else {
				result.push(item[1]);
			}
		}
		return result.join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			memo[selector] = fn.call(this, selector);
		}

		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(37);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 37 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),
/* 38 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue_router__ = __webpack_require__(4);


var routes = [{

  path: '/',

  component: __webpack_require__(39)

}, {

  path: '/about',

  component: __webpack_require__(42)

}];

/* harmony default export */ __webpack_exports__["a"] = (new __WEBPACK_IMPORTED_MODULE_0_vue_router__["a" /* default */]({

  routes: routes,

  linkActiveClass: 'is-active'

}));

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

var Component = __webpack_require__(11)(
  /* script */
  __webpack_require__(40),
  /* template */
  __webpack_require__(41),
  /* scopeId */
  null,
  /* cssModules */
  null
)
Component.options.__file = "C:\\Users\\Alex Raymond\\Projects\\srsbizniz\\resources\\assets\\js\\views\\Home.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key !== "__esModule"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] Home.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-4e57d181", Component.options)
  } else {
    hotAPI.reload("data-v-4e57d181", Component.options)
  }
})()}

module.exports = Component.exports


/***/ }),
/* 40 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    mounted: function mounted() {
        console.log('Component mounted.');
    }
});

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _vm._m(0)
},staticRenderFns: [function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', {
    staticClass: "container"
  }, [_c('div', {
    staticClass: "columns"
  }, [_c('div', {
    staticClass: "column"
  }, [_c('div', {
    staticClass: "message"
  }, [_c('div', {
    staticClass: "message-header"
  }, [_vm._v("Home Page")]), _vm._v(" "), _c('div', {
    staticClass: "message-body"
  }, [_vm._v("\n                    I'm an example component!\n                ")])])])])])
}]}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-4e57d181", module.exports)
  }
}

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

var Component = __webpack_require__(11)(
  /* script */
  __webpack_require__(43),
  /* template */
  __webpack_require__(44),
  /* scopeId */
  null,
  /* cssModules */
  null
)
Component.options.__file = "C:\\Users\\Alex Raymond\\Projects\\srsbizniz\\resources\\assets\\js\\views\\About.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key !== "__esModule"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] About.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-9db0714a", Component.options)
  } else {
    hotAPI.reload("data-v-9db0714a", Component.options)
  }
})()}

module.exports = Component.exports


/***/ }),
/* 43 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    mounted: function mounted() {
        console.log('Component mounted.');
    }
});

/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _vm._m(0)
},staticRenderFns: [function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', {
    staticClass: "container"
  }, [_c('div', {
    staticClass: "columns"
  }, [_c('div', {
    staticClass: "column"
  }, [_c('div', {
    staticClass: "message"
  }, [_c('div', {
    staticClass: "message-header"
  }, [_vm._v("About Page")]), _vm._v(" "), _c('div', {
    staticClass: "message-body"
  }, [_vm._v("\n                    I'm an example component!\n                ")])])])])])
}]}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-9db0714a", module.exports)
  }
}

/***/ })
],[12]);