'use strict';

let coBody = require('co-body');

let db = require('../database.js');
let config = require('../config.js');

let devices = db.getEntityTable('devices');

module.exports = removeDevice;

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
function *removeDevice() {
  let input = yield coBody(this.request);

  let account = this.state.account;
  let email = account.email;
  // let id = account.id;
  let type = input.type;
  let devId = input.deviceId;
  if (typeof devId !== 'string' || typeof type !== 'string') {
    this.response.body = {
      err: 'Device Remove Failure',
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

  // Check if there is not an existing device that has been registered
  let existingDevice = yield devices.findOne({
    $or: [
      { devId },
    ],
  });

  if (!existingDevice) {
    this.response.body = {
      err: 'Device Remove Failure',
      msg: 'Device ID not currently registered',
      detail: [devId],
    };
    this.response.status = 400;
    return;
  }

  // Check if the found device matches the user that is authenticated
  // if not deny request as could be an attack
  if (existingDevice.email != email || existingDevice.type != type) {
  // if (existingDevice.id != id || existingDevice.type != type) {
    this.response.body = {
      err: 'Device Remove Failure',
      msg: 'Device details do not match',
      detail: [devId],
    };
    this.response.status = 400;
    return;
  }

  let query = {
    devId,
  };
  yield devices.remove(query);

  this.response.body = {
    devId,
    msg: 'Device Removed',
  };
  this.response.status = 201;
}
