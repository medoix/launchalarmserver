'use strict';

let co = require('co');

let token = require('../../app/token.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

describe('[roles get]', function() {
  beforeEach(wipeEntity);
  afterEach(wipeEntity);

  let accountNoRoles = {
    email: 'accountNoRoles@accountNoEmail.com',
  };
  let accountHasRoles = {
    email: 'accountHasRoles@accountNoEmail.com',
    roles: ['foo', 'admin'],
  };

  it('should not allow role get without authentication', function() {
    return co(function *() {
      yield request
        .get('/v1/account/roles')
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token missing',
        });
    });
  });

  it('should not allow role get with invalid authentication', function() {
    return co(function *() {
      yield request
        .get('/v1/account/roles')
        .set('authentication', 'invalid authentication string')
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token invalid',
        });
    });
  });

  it('should allow role get when account has no roles', function() {
    return co(function *() {
      yield accounts.insert(accountNoRoles);
      let jwt = yield token.create({
        subject: accountNoRoles.email,
      });
      yield request
        .get('/v1/account/roles')
        .set('authentication', jwt)
        .expect(200)
        .expect({
          roles: [],
        });
    });
  });

  it('should allow role get when account has some roles', function() {
    return co(function *() {
      yield accounts.insert(accountHasRoles);
      let jwt = yield token.create({
        subject: accountHasRoles.email,
      });
      yield request
        .get('/v1/account/roles')
        .set('authentication', jwt)
        .expect(200)
        .expect({
          roles: accountHasRoles.roles,
        });
    });
  });
});
