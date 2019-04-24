'use strict';

let path = require('path');

let staticCache = require('koa-static');
let lodashDefaults = require('lodash.defaults');

// Specify `config.static` according to these specifications:
// https://github.com/koajs/static-cache
let config = require('./config.js');

let staticPath = path.join(process.cwd(), 'static');
let defaultOptions = {
  maxAge: 1*24*60*60,
};
let options = {};
let customOptions = config.static || {};
lodashDefaults(options, customOptions, defaultOptions);

/**
 * Middleware that serves up all static files
 *
 * @type {Function} terminating koa middleware
 */
let staticMiddleware = staticCache(staticPath, options);

module.exports = staticMiddleware;
