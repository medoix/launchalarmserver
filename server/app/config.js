'use strict';

let lodashDefaults = require('lodash.defaults');

/**
 * Uses a default configuration,
 * modified with a custom configuration (if present)
 * found in `/.private/config.js`,
 * and if run via a test runner further modified
 * with a test config found in `/.private/test-config.js`
 */

let prodConfig = undefined;
let devConfig = undefined;

if (process.env.NODE_ENV === 'production') {
  try {
    prodConfig = require('../.config/production.js');
    console.log('### PROD CONFIG LOADED ###');
  }
  catch (ex) {
    console.log('Error reading Production config!');
    // console.log('Error reading Production config', ex);
    prodConfig = {};
  }
} else {
  try {
    devConfig = require('../.config/development.js');
    console.log('### DEV CONFIG LOADED ###');
  }
  catch (ex) {
    console.log('Error reading Development config!');
    // console.log('Error reading Development config', ex);
    devConfig = {};
  }
}

let testConfig = undefined;
if (typeof global.describe === 'function') {
  // Currently running tests, so override using test options where appropriate
  try {
    testConfig = require('../.config/test.js');
    console.log('### TEST CONFIG LOADED ###');
  }
  catch (ex) {
    console.log('Error reading Test config!');
    // console.log('Error reading Test config', ex);
    testConfig = {};
  }
}

let config = {};
lodashDefaults(config, testConfig, devConfig, prodConfig);

module.exports = config;
