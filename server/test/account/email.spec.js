'use strict';

let co = require('co');

let email = require('../../app/email.js');
let
  accountsTestUtil = require('./accounts-test-util.js'),
  expect = accountsTestUtil.expect;

describe('[email]', function() {

  it('should not allow email when to is missing', function() {
    return co(function * () {
      let err;
      try {
        let msg = yield email.prepare({
          subject: 'hello',
          // to: 'foo@bar.com',
          from: 'baz@bar.com',
          text: 'hello there!',
        });
      }
      catch (ex) {
        err = ex;
      }
      expect(err).to.equal('Must provide a to');
    });
  });

  it('should allow email when from is missing (uses default from config)', function() {
    return co(function * () {
      let err;
      try {
        let msg = yield email.prepare({
          subject: 'hello',
          to: 'foo@bar.com',
          // from: 'baz@bar.com',
          text: 'hello there!',
        });
        expect(msg).to.be.an('object');
        expect(msg.from).to.be.a('string');
      }
      catch (ex) {
        err = ex;
      }
      expect(err).to.not.exist;
    });
  });

  it('should not allow email when subject is missing', function() {
    return co(function * () {
      let err;
      try {
        let msg = yield email.prepare({
          // subject: 'hello',
          to: 'foo@bar.com',
          from: 'baz@bar.com',
          text: 'hello there!',
        });
      }
      catch (ex) {
        err = ex;
      }
      expect(err).to.equal('Must provide a subject');
    });
  });

  it('should not allow email when text is missing (and no html specified)', function() {
    return co(function * () {
      let err;
      try {
        let msg = yield email.prepare({
          subject: 'hello',
          to: 'foo@bar.com',
          from: 'baz@bar.com',
          // text: 'hello there!',
        });
      }
      catch (ex) {
        err = ex;
      }
      expect(err).to.equal('Must provide text, or html that can be converted to text');
    });
  });

  it('should allow email when all fields present (text without html)', function() {
    return co(function * () {
      let err, msg;
      try {
        msg = yield email.prepare({
          subject: 'hello',
          to: 'foo@bar.com',
          from: 'baz@bar.com',
          text: 'hello there!',
        });
      }
      catch (ex) {
        err = ex;
      }
      expect(err).to.be.undefined;
      expect(msg).to.be.an('object');
    });
  });

  it('should allow email when all fields present (html without text)', function() {
    return co(function * () {
      let err, msg;
      try {
        msg = yield email.prepare({
          subject: 'hello',
          to: 'foo@bar.com',
          from: 'baz@bar.com',
          // text: 'hello there!',
          attachment: [
            {
              data:`<html>Foo <em>bar</b> <a href="http://localhost.com">baz</a>.</html>`,
              alternative: true,
            },
          ],
        });
      }
      catch (ex) {
        err = ex;
      }
      expect(err).to.not.exist;
      expect(msg).to.be.an('object');
      expect(msg.text).to.be.a('string');
      expect(msg.text).to.equal(`Foo bar baz [ http://localhost.com ] .`);
    });
  });

  it('should allow email when all fields present (html and text)', function() {
    return co(function * () {
      let err, msg;
      try {
        msg = yield email.prepare({
          subject: 'hello',
          to: 'foo@bar.com',
          from: 'baz@bar.com',
          text: 'hello there!',
          attachment: [
            {
              data:`<html>Foo <em>bar</b> <a href="http://localhost.com">baz</a>.</html>`,
              alternative: true,
            },
          ],
        });
      }
      catch (ex) {
        err = ex;
      }
      expect(err).to.not.exist;
      expect(msg).to.be.an('object');
      expect(msg.text).to.be.a('string');
      // text, when provided, should not be overridden by html
      expect(msg.text).to.equal('hello there!');
    });
  });

  it('should send email when all fields present', function() {
    this.timeout(10000);
    return co(function * () {
      let err, msg;
      try {
        msg = yield email.send({
          subject: 'email test',
          to: 'foo@bar.com',
          // from: 'baz@bar.com',
          // text: 'okaccounts test',
          html: `<html>Foo <em>bar</b> <a href="http://bguiz.com">baz</a>.</html>`,
          // attachment: [
          //   {
          //     data: `<html>Foo <em>bar</b> <a href="http://bguiz.com">baz</a>.</html>`,
          //     alternative: true,
          //   },
          // ]
        });
        // console.log('msg', msg);
      }
      catch (ex) {
        // console.log(ex, ex && ex.stack);
        err = ex;
      }
      expect(err).to.not.exist;
      expect(msg).to.be.an('object');
      expect(msg.accepted).to.be.an('array');
      expect(msg.accepted.length).to.equal(1);
      expect(msg.rejected).to.be.an('array');
      expect(msg.rejected.length).to.equal(0);
      // expect(msg.response).to.equal('250 Message received');
      expect(msg.response).to.contain('250');
      expect(msg.envelope).to.deep.equal({
        from: 'support@localhost',
        to: [ 'foo@bar.com' ],
      });
    });
  });
});
