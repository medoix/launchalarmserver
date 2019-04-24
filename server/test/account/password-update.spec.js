'use strict';

let co = require('co');

let auth = require('../../app/auth.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  expect = accountsTestUtil.expect,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

describe('[password update]', function() {
  beforeEach(wipeEntity);
  afterEach(wipeEntity);

  it('should not update password if input is invalid', function () {
    return co(function *() {
      yield request
        .post('/v1/account/password')
        .send({
          // Missing id, pw, and newPw
        })
        .expect(400)
        .expect({
          err: 'Update Password Failure',
          msg: 'Email, password, and new password must be specified',
        });
    });
  });

  it('should not update password if current password is incorrect', function () {
    return co(function *() {
      // User has account is ready
      let pw = 'long enough';
      let key = yield auth.passwordHasher({
        pw,
      });
      let input1 = {
        // id: 'bguiz',
        email: 'foo@bar.com',
        key,
        rego: {
          status: 'complete',
          date: Date.now() - 30*24*60*60*1000,
        },
      };
      yield accounts.insert(input1);

      // User attempts to change password,
      // but inputs the current password incorrectly
      yield request
        .post('/v1/account/password')
        .send({
          // id: input1.id,
          email: input1.email,
          pw: pw+', but wrong',
          newPw: 'does not matter',
        })
        .expect(401)
        .expect({
          err: 'Update Password Failure',
          msg: 'Incorrect email, or password',
        });
    });
  });

  it('should not change password if new password is too short', function() {
    return co(function *() {
      // User has already registered, but failed to confirm his account
      let pw = 'long enough';
      let key = yield auth.passwordHasher({
        pw,
      });
      let input1 = {
        // id: 'bguiz',
        email: 'foo@bar.com',
        key,
        rego: {
          status: 'pending',
          confirmCode: 'asdf',
          date: Date.now() - 30*24*60*60*1000,
        },
      };
      yield accounts.insert(input1);

      // Much later, the user wishes to log in even though this account has expired
      yield request
        .post('/v1/account/password')
        .send({
          // id: input1.id,
          email: input1.email,
          pw,
          newPw: 's', //too short
        })
        .expect(400)
        .expect({
          err: 'Update Password Failure',
          msg: 'New password is too short',
        });
    });
  });

  it('should not change password if account is not confirmed', function () {
    return co(function *() {
      // User has already registered, but failed to confirm his account
      let pw = 'long enough';
      let key = yield auth.passwordHasher({
        pw,
      });
      let input1 = {
        // id: 'bguiz',
        email: 'foo@bar.com',
        key,
        rego: {
          status: 'pending',
          confirmCode: 'asdf',
          date: Date.now() - 30*24*60*60*1000,
        },
      };
      yield accounts.insert(input1);

      // Much later, the user wishes to log in even though this account has expired
      yield request
        .post('/v1/account/password')
        .send({
          // id: input1.id,
          email: input1.email,
          pw,
          newPw: 'does not matter',
        })
        .expect(401)
        .expect({
          err: 'Update Password Failure',
          msg: 'Incorrect email, or password',
        });
    });
  });

  it('should change password if all valid', function () {
    return co(function *() {
      // User has already registered and confirmed his account
      let pw = 'long enough';
      let key = yield auth.passwordHasher({
        pw,
      });
      let input1 = {
        // id: 'bguiz',
        email: 'foo@bar.com',
        key,
        rego: {
          status: 'complete',
          date: Date.now() - 30*24*60*60*1000,
        },
      };
      yield accounts.insert(input1);

      // Much later, the user wishes to log in
      let beforeDate = Date.now();
      let newPw = 'the new password';
      yield request
        .post('/v1/account/password')
        .send({
          // id: input1.id,
          email: input1.email,
          pw,
          newPw,
        })
        .expect(201);

      // Now check that database contents are correct
      let existingAccounts = yield accounts.find({
        // id: input1.id,
        email: input1.email,
      });
      expect(existingAccounts.length).to.equal(1);
      expect(existingAccounts[0]).to.be.an('object');
      // expect(existingAccounts[0]).to.have.property('id')
      //   .to.equal(input1.id);
      expect(existingAccounts[0]).to.have.property('email')
        .to.equal(input1.email);
      expect(existingAccounts[0]).to.have.property('rego')
        .to.be.an('object');
      expect(existingAccounts[0].rego)
        .to.have.property('status')
        .to.be.a('string')
        .to.equal('complete');
      expect(existingAccounts[0].rego)
        .to.have.property('passwordChangedDate')
        .to.be.a('number')
        .to.be.at.least(beforeDate);
      expect(existingAccounts[0]).to.have.property('key')
        .to.be.an('object');
    });
  });
});
