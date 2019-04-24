'use strict';

let co = require('co');

let token = require('../../app/token.js');

let
  devicesTestUtil = require('./devices-test-util.js'),
  request = devicesTestUtil.request,
  expect = devicesTestUtil.expect,
  devices = devicesTestUtil.devices,
  wipeEntity = devicesTestUtil.wipeEntity,
  accountsTestUtil = require('../account/accounts-test-util.js'),
  accounts = accountsTestUtil.accounts;

describe('[create device]', function() {
  beforeEach(wipeEntity);
  afterEach(wipeEntity);

  let accountNoUser = {
    email: 'accountNoUser@accountNoEmail.com',
  };

  let accountNoDevice = {
    devId: '1234567890',
    type: 'test',
  };

  it('should not allow device creation without authentication', function() {
    return co(function *() {
      yield request
        .post('/v1/device/deviceCreate')
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token missing',
        });
    });
  });

  it('should not allow device create with invalid authentication', function() {
    return co(function *() {
      yield request
        .post('/v1/device/deviceCreate')
        .set('authentication', 'invalid authentication string')
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token invalid',
        });
    });
  });

  it('should not create a new device when input is invalid', function() {
    return co(function *() {
      yield accounts.insert(accountNoUser);
      yield devices.insert(accountNoDevice);
      let jwt = yield token.create({
        subject: accountNoUser.email,
      });
      yield request
        .post('/v1/device/deviceCreate')
        .set('authentication', jwt)
        .send({
          // missing deviceId
          // missing type
        })
        .expect(400)
        .expect({
          err: 'Device Create Failure',
          msg: 'Device Type and ID must be specified',
        });
    });
  });

  // it('should not create a new device when deviceId is too short', function() {
  //   return co(function *() {
  //     yield request
  //       .post('/v1/device/deviceCreate')
  //       .send({
  //         deviceId: '1',
  //       })
  //       .expect(400)
  //       .expect({
  //         err: 'Device Create Failure',
  //         msg: 'Device ID is too short',
  //       });
  //   });
  // });

  // it('should not create a new device when deviceId is invalid', function() {
  //   return co(function *() {
  //     yield request
  //       .post('/v1/device/deviceCreate')
  //       .send({
  //         id: '@#$',
  //       })
  //       .expect(400)
  //       .expect({
  //         err: 'Device Create Failure',
  //         msg: 'Device ID is invalid',
  //       });
  //   });
  // });

  it('should not create a new device when deviceId already exists', function() {
    return co(function *() {
      yield accounts.insert(accountNoUser);
      let jwt = yield token.create({
        subject: accountNoUser.email,
      });
      // Device registers for the first time
      let input1 = {
        devId: '1234567890',
        type: 'test',
        date: Date.now(),
      };
      yield devices.insert(input1);

      // Device registers again, with same deviceId
      let input2 = {
        deviceId: '1234567890',
        type: 'test',
      };
      yield request
        .post('/v1/device/deviceCreate')
        .set('authentication', jwt)
        .send(input2)
        .expect(400)
        .expect({
          err: 'Device Create Failure',
          msg: 'Device ID already registered',
          detail: [input2.deviceId],
        });
        let existingDevices = yield devices.find({
          devId: input1.devId,
        });
        expect(existingDevices).to.be.an('array');
        expect(existingDevices.length).to.equal(1);
        expect(existingDevices[0]).to.be.an('object');
        expect(existingDevices[0]).to.have.property('devId')
          .to.equal(input1.devId);
        expect(existingDevices[0]).to.have.property('date')
          .to.eql(input1.date);
    });
  });

  it('should create a new device when all is valid', function() {
    return co(function *() {
      yield accounts.insert(accountNoUser);
      let jwt = yield token.create({
        subject: accountNoUser.email,
      });
      let input = {
        deviceId: '1234567890',
        type: 'test',
      };
      yield request
        .post('/v1/device/deviceCreate')
        .set('authentication', jwt)
        .send(input)
        .expect(201)
        .expect({
          devId: input.deviceId,
          msg: 'Device Registered',
        });

      // Now check that database contents are correct
      let newDevice = yield devices.findOne({
        devId: input.deviceId,
      });

      expect(newDevice).to.have.property('devId').to.equal(input.deviceId);
    });
  });
});
