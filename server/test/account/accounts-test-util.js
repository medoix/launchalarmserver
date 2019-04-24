'use strict';

let co = require('co');
let supertestAsPromised = require('supertest-as-promised');
let chai = require('chai');

let server = require('../../app/server.js');
let db = require('../../app/database.js');

let supertest = supertestAsPromised(Promise);
let request = supertest.agent(server.listen());
let expect = chai.expect;
let accounts = db.getEntityTable('accounts');

module.exports = {
  supertest,
  request,
  expect,
  accounts,
  wipeEntity,
};

function wipeEntity() {
  return co(function *() {
    yield accounts.remove({});
  });
}
