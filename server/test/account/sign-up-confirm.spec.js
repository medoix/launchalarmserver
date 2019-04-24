'use strict';

let co = require('co');

let auth = require('../../app/auth.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  expect = accountsTestUtil.expect,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

describe('[sign up confirm]', function() {
  beforeEach(wipeEntity);
  afterEach(wipeEntity);

  it('should not confirm an account when input is invalid', function() {
    return co(function *() {
      yield request
        .post('/v1/account/signup/confirm')
        .send({
          // missing id, pw, confirmCode
        })
        .expect(400)
        .expect({
          err: 'Sign Up Confirmation Failure',
          msg: 'Email and confirmCode must be specified',
          // msg: 'Username, password, and confirmCode must be specified',
        });
    });
  });

  it('should not confirm an account when its confirmCode is incorrect', function() {
    return co(function *() {
      // User registers for the first time
      let input1 = {
        // id: 'bguiz',
        pw: 'long enough',
        email: 'foo@bar.com',
        rego: {
          status: 'pending',
          confirmCode: 'asdf',
          date: Date.now(),
        },
      };

      yield accounts.insert(input1);

      // User confirms shortly after registering, but puts in the wrong confirmCode
      yield request
        .post('/v1/account/signup/confirm')
        .send({
          // id: input1.id,
          email: input1.email,
          pw: input1.pw,
          confirmCode: 'a different code',
        })
        .expect(400)
        .expect({
          err: 'Sign Up Confirmation Failure',
          msg: 'Email or confirmation code is invalid',
        });
    });
  });

  it('should not confirm an account when its confirmCode has expired', function() {
    return co(function *() {
      // User registers for the first time a long time ago
      let input1 = {
        // id: 'bguiz',
        pw: 'long enough',
        email: 'foo@bar.com',
        rego: {
          status: 'pending',
          confirmCode: 'asdf',
          date: Date.now() - 30*24*60*60*1000,
        },
      };

      yield accounts.insert(input1);

      // User digs up old email much later, and attempts to confirm even though it is expired
      yield request
        .post('/v1/account/signup/confirm')
        .send({
          // id: input1.id,
          email: input1.email,
          pw: input1.pw,
          confirmCode: 'asdf',
        })
        .expect(400)
        .expect({
          err: 'Sign Up Confirmation Failure',
          msg: 'Confirmation code has expired',
        });
    });
  });

  it('should not confirm an account when the password is incorrect', function () {
    co(function *() {
      // User registers for the first time
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
          date: Date.now(),
        },
      };

      yield accounts.insert(input1);

      yield request
        .post('/v1/account/signup/confirm')
        .send({
          // id: input1.id,
          email: input1.email,
          pw: pw+', but wrong',
          confirmCode: input1.rego.confirmCode,
        })
        .expect(401)
        .expect({
          err: 'Sign Up Confirmation Failure',
          msg: 'Incorrect password',
        });
    });
  });

  it('should confirm an account when all is valid', function() {
    return co(function *() {
      // User registers for the first time
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
          date: Date.now(),
        },
      };

      let pendingAccount = yield accounts.insert(input1);

      // User confirms the account shortly after, with the correct confirmCode
      let beforeDate = Date.now();

      yield request
        .post('/v1/account/signup/confirm')
        .send({
          // id: input1.id,
          email: input1.email,
          pw,
          confirmCode: input1.rego.confirmCode,
        })
        .expect(200)
        .expect({
          // id: input1.id,
          email: input1.email,
          msg: 'Account has been confirmed',
        });
        let newAccount = yield accounts.findOne({
          // id: input1.id,
          email: input1.email,
        });
        expect(newAccount).to.have.property('rego').to.be.an('object');
        expect(newAccount.rego).to.have.property('status')
          .to.be.a('string')
          .to.equal('complete');
        expect(newAccount.rego).not.to.have.property('confirmCode');
        expect(newAccount.rego).to.have.property('date')
          .to.be.a('number')
          .to.be.at.least(beforeDate);
    });
  });
});
