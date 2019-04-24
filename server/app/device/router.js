'use strict';

let koaRouter = require('koa-router');

/**
 * A koa router which groups all of the device related API endpoints together.
 *
 * @type {Function}
 */
let devicesRouter = koaRouter({
  prefix: '/v1/device',
});

let devices = {
  authenticate: require('../account/authenticate.js'),

  deviceCreate: require('./device-create.js'),
  deviceRemove: require('./device-remove.js'),
  devicesGet: require('./devices-get.js'),
};

devicesRouter
  .post('deviceCreate', '/deviceCreate',
    devices.authenticate,
    devices.deviceCreate)
  .post('deviceRemove', '/deviceRemove',
    devices.authenticate,
    devices.deviceRemove)
  .get('devicesGet', '/devices',
    // accounts.authenticate,
    devices.devicesGet)
  ;

module.exports = devicesRouter;
