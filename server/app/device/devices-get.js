'use strict';

let db = require('../database.js');
let config = require('../config.js');

let devices = db.getEntityTable('devices');

module.exports = devicesGet;

/**
 * Route handler that responds with the list of current registered devices
 *
 * @yield {null} returns to terminate
 */
function *devicesGet() {
  // Check if there is not an existing device that has been registered
  let devicelist = yield devices.find({}, '-_id type devId');
  if (!Object.keys(devicelist).length) {
    this.response.body = {
      err: 'Devices Get Failure',
      msg: 'No devices currently registered',
    };
    this.response.status = 400;
    return;
  } else {
    this.response.body = {
      devicelist,
    };
    this.response.status = 200;
    return;
  };
}
