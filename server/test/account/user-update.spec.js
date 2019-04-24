'use strict';

let co = require('co');

let token = require('../../app/token.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  expect = accountsTestUtil.expect,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

describe('[user update]', function() {
  beforeEach(wipeEntity);
  afterEach(wipeEntity);

  let accountNoUser = {
    email: 'accountNoUser@accountNoEmail.com',
  };

  it('should not allow user update without authentication', function() {
    return co(function *() {
      yield request
        .post('/v1/account/user')
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token missing',
        });
    });
  });

  it('should not allow user update with invalid authentication', function() {
    return co(function *() {
      yield request
        .post('/v1/account/user')
        .set('authentication', 'invalid authentication string')
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token invalid',
        });
    });
  });

  it('should not allow user change with missing user', function() {
    return co(function *() {
      yield accounts.insert(accountNoUser);
      let jwt = yield token.create({
        subject: accountNoUser.email,
      });
      yield request
        .post('/v1/account/user')
        .set('authentication', jwt)
        .send({
          // missing user
        })
        .expect(400)
        .expect({
          err: 'User Change Failure',
          msg: 'No user data specified',
        });
    });
  });

  it('should allow user change', function() {
    return co(function *() {
      yield accounts.insert(accountNoUser);
      let jwt = yield token.create({
        subject: accountNoUser.email,
      });
      let user = {
        name: 'Foo Bar',
      };
      yield request
        .post('/v1/account/user')
        .set('authentication', jwt)
        .send({
          user,
        })
        .expect(200)
        .expect({
          user,
        });
      let updatedAccount = yield accounts.findOne({ email: accountNoUser.email });
      expect(updatedAccount).to.be.an('object');
      expect(updatedAccount.user).to.be.an('object');
      expect(updatedAccount.user).to.be.deep.equal(user);
    });
  });
});
