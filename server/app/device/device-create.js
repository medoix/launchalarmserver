'use strict';

let coBody = require('co-body');

let db = require('../database.js');
let config = require('../config.js');

let devices = db.getEntityTable('devices');

module.exports = createDevice;

/**
 * Route handler that initiates the device creation.
 *
 * Accepts a JSON in the request body:
 * - deviceId: Device ID
 *
 * Allows the creation only if the specified Device ID
 * do not already exist.
 *
 *
 * @yield {null} returns to terminate
 */
function *createDevice() {
  let input = yield coBody(this.request);

  let account = this.state.account;
  let email = account.email;
  // let id = account.id;
  let type = input.type;
  let devId = input.deviceId;
  if (typeof devId !== 'string' || typeof type !== 'string') {
    this.response.body = {
      err: 'Device Create Failure',
      msg: 'Device Type and ID must be specified',
    };
    this.response.status = 400;
    return;
  }
  // if (deviceId.length < config.ios.deviceid.minimumLength) {
  //   this.response.body = {
  //     err: 'Device Create Failure',
  //     msg: 'Device ID is too short',
  //   };
  //   this.response.status = 400;
  //   return;
  // }
  // if (!config.account.deviceid.validate(deviceId)) {
  //   this.response.body = {
  //     err: 'Device Create Failure',
  //     msg: 'Device ID is invalid',
  //   };
  //   this.response.status = 400;
  //   return;
  // }

  // Check if there is an existing device that has been registered
  // which has not gone stale yet
  let existingDevice = yield devices.findOne({
    $or: [
      { devId },
    ],
  });
  if (existingDevice) {
    this.response.body = {
      err: 'Device Create Failure',
      msg: 'Device ID already registered',
      detail: [devId],
    };
    this.response.status = 400;
    return;
  }

  let query = {
    devId,
  };
  let value = {
    email,
    // id,
    type,
    devId,
    date: Date.now(),
  };
  let options = {
    upsert: true,
    'new': true,
  };
  yield devices.findAndModify(query, value, options);

  this.response.body = {
    devId,
    msg: 'Device Registered',
  };
  this.response.status = 201;
}
