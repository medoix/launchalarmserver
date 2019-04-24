'use strict';

let co = require('co');

let auth = require('../../app/auth.js');
let token = require('../../app/token.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  expect = accountsTestUtil.expect,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

describe('[log in]', function() {
  beforeEach(wipeEntity);
  afterEach(wipeEntity);

  it('should not log in if input is invalid', function () {
    return co(function *() {
      yield request
        .post('/v1/account/login')
        .send({
          // Missing id and pw
        })
        .expect(400)
        .expect({
          err: 'Log In Failure',
          msg: 'Email and password must be specified',
        });
    });
  });

  it('should not log in if password is incorrect', function () {
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

      // Much later, the user wishes to log in, but uses a wrong password
      yield request
        .post('/v1/account/login')
        .send({
          // id: input1.id,
          email: input1.email,
          pw: pw+', but wrong',
        })
        .expect(401)
        .expect({
          err: 'Log In Failure',
          msg: 'Incorrect email, or password',
        });
    });
  });

  it('should not log in if account is not confirmed', function () {
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
        .post('/v1/account/login')
        .send({
          // id: input1.id,
          email: input1.email,
          pw,
        })
        .expect(401)
        .expect({
          err: 'Log In Failure',
          msg: 'Incorrect email, or password',
        });
    });
  });

  it('should log in if all valid', function() {
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
      let response = yield request
        .post('/v1/account/login')
        .send({
          // id: input1.id,
          email: input1.email,
          pw,
        })
        .expect(200);
      expect(response).to.have.property('body').to.be.an('object');
      expect(response.body).to.have.property('jwt')
        .to.be.a('string');
        //NOTE cannot check value of string directly,
        //instead decode it and check against expected values
      let decodedToken = yield token.verify(response.body.jwt, {});
      expect(decodedToken).to.be.an('object');
      // expect(decodedToken).to.have.property('subject')
      //   .to.be.a('string')
      //   .to.equal(input1.id);
      expect(decodedToken).to.have.property('subject')
        .to.be.a('string')
        .to.equal(input1.email);
      expect(decodedToken).to.have.property('expiry')
        .to.be.a('number')
        .to.be.at.least(Date.now());
    });
  });
});
