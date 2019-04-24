'use strict';

let co = require('co');

let token = require('../../app/token.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  expect = accountsTestUtil.expect,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

describe('[roles update]', function() {
  beforeEach(wipeEntity);
  afterEach(wipeEntity);

  let userNoRoles = {
    email: 'userNoRoles@accountNoEmail.com',
  };
  let userHasRoles = {
    email: 'userHasRoles@accountNoEmail.com',
    roles: ['foo', 'admin'],
  };

  it('should not allow role change without authentication', function() {
    return co(function *() {
      yield request
        .post('/v1/account/roles')
        .send({})
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token missing',
        });
    });
  });

  it('should not allow role change with invalid authentication', function() {
    return co(function *() {
      yield request
        .post('/v1/account/roles')
        .set('authentication', 'invalid authentication string')
        .send({})
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token invalid',
        });
    });
  });

  it('should not allow role change with missing deltas', function() {
    return co(function *() {
      yield accounts.insert(userNoRoles);
      let jwt = yield token.create({
        subject: userNoRoles.email,
      });
      yield request
        .post('/v1/account/roles')
        .set('authentication', jwt)
        .send({
          // missing deltas
        })
        .expect(400)
        .expect({
          err: 'Role Change Failure',
          msg: 'No role changes specified',
        });
    });
  });

  it('should not allow role change with empty deltas', function() {
    return co(function *() {
      yield accounts.insert(userNoRoles);
      let jwt = yield token.create({
        subject: userNoRoles.email,
      });
      yield request
        .post('/v1/account/roles')
        .set('authentication', jwt)
        .send({
          deltas: {},
        })
        .expect(400)
        .expect({
          err: 'Role Change Failure',
          msg: 'No role changes specified',
        });
    });
  });

  it('should allow remove all roles', function() {
    return co(function *() {
      yield accounts.insert(userHasRoles);
      let jwt = yield token.create({
        subject: userHasRoles.email,
      });
      yield request
        .post('/v1/account/roles')
        .set('authentication', jwt)
        .send({
          deltas: {
            removeAll: true,
          },
        })
        .expect(200)
        .expect({
          roles: [],
        });
      let updatedAccount = yield accounts.findOne({ email: userHasRoles.email });
      expect(updatedAccount).to.be.an('object');
      expect(updatedAccount.roles).to.be.an('array');
      expect(updatedAccount.roles).to.be.empty;
    });
  });

  it('should allow remove all roles when no initial roles', function() {
    return co(function *() {
      yield accounts.insert(userNoRoles);
      let jwt = yield token.create({
        subject: userNoRoles.email,
      });
      yield request
        .post('/v1/account/roles')
        .set('authentication', jwt)
        .send({
          deltas: {
            removeAll: true,
          },
        })
        .expect(200)
        .expect({
          roles: [],
        });
      let updatedAccount = yield accounts.findOne({ email: userNoRoles.email });
      expect(updatedAccount).to.be.an('object');
      expect(updatedAccount.roles).to.be.an('array');
      expect(updatedAccount.roles).to.be.empty;
    });
  });

  it('should allow add and remove roles', function() {
    return co(function *() {
      yield accounts.insert(userHasRoles);
      let jwt = yield token.create({
        subject: userHasRoles.email,
      });
      yield request
        .post('/v1/account/roles')
        .set('authentication', jwt)
        .send({
          deltas: {
            bar: 'add',
            admin: 'remove',
          },
        })
        .expect(200)
        .expect({
          roles: ['foo', 'bar'],
        });
      let updatedAccount = yield accounts.findOne({ email: userHasRoles.email });
      expect(updatedAccount).to.be.an('object');
      expect(updatedAccount.roles).to.be.an('array');
      expect(updatedAccount.roles.length).to.equal(2);
      expect(updatedAccount.roles).to.deep.equal(['foo', 'bar']);
    });
  });

  it('should allow add and remove roles when no initial roles', function() {
    return co(function *() {
      yield accounts.insert(userNoRoles);
      let jwt = yield token.create({
        subject: userNoRoles.email,
      });
      yield request
        .post('/v1/account/roles')
        .set('authentication', jwt)
        .send({
          deltas: {
            bar: 'add',
            admin: 'remove',
          },
        })
        .expect(200)
        .expect({
          roles: ['bar'],
        });
      let updatedAccount = yield accounts.findOne({ email: userNoRoles.email });
      expect(updatedAccount).to.be.an('object');
      expect(updatedAccount.roles).to.be.an('array');
      expect(updatedAccount.roles.length).to.equal(1);
      expect(updatedAccount.roles).to.deep.equal(['bar']);
    });
  });
});
