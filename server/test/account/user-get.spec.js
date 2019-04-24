'use strict';

let co = require('co');

let token = require('../../app/token.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

describe('[user get]', function() {
  beforeEach(wipeEntity);
  afterEach(wipeEntity);

  let accountNoUser = {
    email: 'accountNoUser@accountNoEmail.com',
  };
  let accountHasUser = {
    email: 'accountHasUser@accountNoEmail.com',
    user: { foo: 'bar' },
  };

  it('should not allow user get without authentication', function() {
    return co(function *() {
      yield request
        .get('/v1/account/user')
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token missing',
        });
    });
  });

  it('should not allow user get with invalid authentication', function() {
    return co(function *() {
      yield request
        .get('/v1/account/user')
        .set('authentication', 'invalid authentication string')
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token invalid',
        });
    });
  });

  it('should allow user get with missing user', function() {
    return co(function *() {
      yield accounts.insert(accountNoUser);
      let jwt = yield token.create({
        subject: accountNoUser.email,
      });
      yield request
        .get('/v1/account/user')
        .set('authentication', jwt)
        .expect(200)
        .expect({
          user: {},
        });
    });
  });

  it('should allow user get with user', function() {
    return co(function *() {
      yield accounts.insert(accountHasUser);
      let jwt = yield token.create({
        subject: accountHasUser.email,
      });
      yield request
        .get('/v1/account/user')
        .set('authentication', jwt)
        .expect(200)
        .expect({
          user: accountHasUser.user,
        });
    });
  });
});
