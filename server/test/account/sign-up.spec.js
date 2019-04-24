'use strict';

let co = require('co');

let config = require('../../app/config.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  expect = accountsTestUtil.expect,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

  function prefillOtherAccounts() {
    return co(function *() {
      yield wipeEntity();
      yield accounts.insert({
        id: 'prefill-1',
        email: 'prefill-1@test.com',
      });
      yield accounts.insert({
        id: 'prefill-2',
        email: 'prefill-2@test.com',
      });
    });
  }
describe('[sign up]', function() {

  [
    {
      prefill: false,
      title: '[from empty db]',
    },
    {
      prefill: true,
      title: '[from pre-filled db]',
    }
  ].forEach(function(describeInfo) {
    if (describeInfo.prefill) {
      beforeEach(prefillOtherAccounts);
    }
    else {
      beforeEach(wipeEntity);
    }
    afterEach(wipeEntity);

    describe(describeInfo.title, function() {
      it('should not create a new account when input is invalid', function() {
        return co(function *() {
          yield request
            .post('/v1/account/signup')
            .expect(400)
            .send({
              // missing id, pw, email
            })
            .expect({
              err: 'Sign Up Failure',
              msg: 'Email, and password must be specified',
            });
        });
      });

      it('should not create a new account when password is too short', function() {
        return co(function *() {
          yield request
            .post('/v1/account/signup')
            .send({
              // id: 'bguiz',
              pw: 'short',
              email: 'foo@bar.com',
            })
            .expect(400)
            .expect({
              err: 'Sign Up Failure',
              msg: 'Password is too short',
            });
        });
      });

      it('should not create a new account when email address is invalid', function() {
        return co(function *() {
          yield request
            .post('/v1/account/signup')
            .send({
              // id: 'bguiz',
              pw: 'long enough',
              email: '@bar.com.foo',
            })
            .expect(400)
            .expect({
              err: 'Sign Up Failure',
              msg: 'Email address is invalid',
            });
        });
      });

      it('should not create a new account when id/email already exists', function() {
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

          // User registers again, with same email address, but different id
          let input2 = {
            // id: 'bguiz1',
            pw: 'long enough',
            email: 'foo@bar.com',
          };
          yield request
            .post('/v1/account/signup')
            .send(input2)
            .expect(400)
            .expect({
              err: 'Sign Up Failure',
              msg: 'Email address already registered',
              // detail: [input2.id, input2.email],
              detail: [input2.email],
            });
            let existingAccounts = yield accounts.find({
              email: input1.email,
            });
            expect(existingAccounts).to.be.an('array');
            expect(existingAccounts.length).to.equal(1);
            expect(existingAccounts[0]).to.be.an('object');
            // expect(existingAccounts[0]).to.have.property('id')
            //   .to.equal(input1.id);
            expect(existingAccounts[0]).to.have.property('email')
              .to.equal(input1.email);
            expect(existingAccounts[0]).to.have.property('rego')
              .to.be.an('object')
              .to.eql(input1.rego);
        });
      });

      it('should create a new account when email already exists, but registration is stale', function() {
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

          // User registers again, with the same email address, but a different id
          // after the previous registration has gone stale
          let input2 = {
            // id: 'bguiz1',
            pw: 'long enough',
            email: 'foo@bar.com',
          };
          let beforeDate = Date.now();
          yield request
            .post('/v1/account/signup')
            .send(input2)
            .expect(201)
            .expect({
              // id: input2.id,
              email: input2.email,
              msg: 'Check email for confirmation code',
            });

          // Now check that database contents are correct
          let existingAccounts = yield accounts.find({
            email: input1.email,
          });

          expect(existingAccounts).to.be.an('array');
          expect(existingAccounts.length).to.equal(1);
          expect(existingAccounts[0]).to.be.an('object');
          // expect(existingAccounts[0]).to.have.property('id')
          //   .to.equal(input2.id);
          expect(existingAccounts[0]).to.have.property('email')
            .to.equal(input2.email);
          expect(existingAccounts[0]).to.have.property('rego')
            .to.be.an('object');
          expect(existingAccounts[0].rego)
            .to.have.property('status')
            .to.be.a('string')
            .to.equal('pending');
          expect(existingAccounts[0].rego)
            .to.have.property('confirmCode')
            .to.be.a('string')
            .to.have.length(config.auth.confirmCode.length);
          expect(existingAccounts[0].rego)
            .to.have.property('date')
            .to.be.a('number')
            .to.be.at.least(beforeDate);
        });
      });

      it('should create a new account when all is valid', function() {
        return co(function *() {
          let input = {
            // id: 'okaccountsTestBguiz',
            pw: 'long enough',
            email: 'foo@bar.com',
          };
          yield request
            .post('/v1/account/signup')
            .send(input)
            .expect(201)
            .expect({
              // id: input.id,
              email: input.email,
              msg: 'Check email for confirmation code',
            });

          // Now check that database contents are correct
          let newAccount = yield accounts.findOne({
            // id: input.id,
            email: input.email,
          });

          // expect(newAccount).to.have.property('id').to.equal(input.id);
          expect(newAccount).to.have.property('email').to.equal(input.email);
          expect(newAccount).to.have.property('key').to.be.an('object');
          //NOTE that length is (len*2), because these are serialised to strings as hexadecimal values
          expect(newAccount.key).to.have.property('salt').to.be.a('string').to.have.length(config.auth.key.len * 2);
          expect(newAccount.key).to.have.property('hash').to.be.a('string').to.have.length(config.auth.key.len * 2);
        });
      });
    });

  });

});
