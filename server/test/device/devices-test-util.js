'use strict';

let co = require('co');
let supertestAsPromised = require('supertest-as-promised');
let chai = require('chai');

let server = require('../../app/server.js');
let db = require('../../app/database.js');

let supertest = supertestAsPromised(Promise);
let request = supertest.agent(server.listen());
let expect = chai.expect;
let devices = db.getEntityTable('devices');
let accounts = db.getEntityTable('accounts');

module.exports = {
  supertest,
  request,
  expect,
  devices,
  wipeEntity,
};

function wipeEntity() {
  return co(function *() {
    yield devices.remove({});
    yield accounts.remove({});
  });
}
