'use strict';

let co = require('co');

let token = require('../../app/token.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  expect = accountsTestUtil.expect;

describe('[token]', function() {
  it('should create a JWT', function() {
    return co(function *() {
      let jwt = yield token.create({ subject: 'foo' });
      expect(jwt).to.be.a('string');
      expect(jwt).to.not.be.empty;
    });
  });

  it('should verify a JWT', function() {
    return co(function *() {
      let jwt = yield token.create({ subject: 'foo' });
      let result = yield token.verify(jwt);
      expect(result).to.be.an('object');
      expect(result.subject).to.equal('foo');
    });
  });
});
