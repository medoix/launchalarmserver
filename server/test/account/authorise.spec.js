'use strict';

let co = require('co');

let token = require('../../app/token.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

describe('[authorise]', function() {
  beforeEach(wipeEntity);
  afterEach(wipeEntity);

  let accountNoRoles = {
    email: 'accountNoRoles@accountNoEmail.com',
  };
  let accountHasFooAndBarRoles = {
    email: 'accountNoRoles@accountNoEmail.com',
    roles: ['foo', 'bar'],
  };
  let accountHasFooAndBarAndAdminRoles = {
    email: 'accountNoRoles@accountNoEmail.com',
    roles: ['foo', 'bar', 'admin'],
  };

  it('should not allow unauthenticated', function() {
    return co(function *() {
      yield request
        .get('/v1/account/test/authorise/roles-any/admin')
        .send({})
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token missing',
        });
    });
  });

  it('should not allow authenticated, but unauthorised (no roles)', function() {
    return co(function * () {
      yield accounts.insert(accountNoRoles);
      let jwt = yield token.create({
        subject: accountNoRoles.email,
      });
      yield request
        .get('/v1/account/test/authorise/roles-any/admin')
        .set('authentication', jwt)
        .expect(401)
        .expect({
          err: 'Authorisation failure',
          msg: 'This account is unauthorised',
        });
    });
  });

  it('should not allow authenticated, but unauthorised (incorrect roles)', function() {
    return co(function * () {
      yield accounts.insert(accountHasFooAndBarRoles);
      let jwt = yield token.create({
        subject: accountHasFooAndBarRoles.email,
      });
      yield request
        .get('/v1/account/test/authorise/roles-any/admin')
        .set('authentication', jwt)
        .expect(401)
        .expect({
          err: 'Authorisation failure',
          msg: 'This account is unauthorised',
        });
    });
  });

  it('should allow authenticated, and authenticated with roles', function() {
    return co(function * () {
      yield accounts.insert(accountHasFooAndBarAndAdminRoles);
      let jwt = yield token.create({
        subject: accountHasFooAndBarAndAdminRoles.email,
      });
      yield request
        .get('/v1/account/test/authorise/roles-any/admin')
        .set('authentication', jwt)
        .expect(200)
        .expect({
          ok: true,
        });
    });
  });
});
