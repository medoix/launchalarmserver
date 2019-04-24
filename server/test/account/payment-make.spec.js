'use strict';

let co = require('co');

let token = require('../../app/token.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  expect = accountsTestUtil.expect,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

let db = require('../../app/database.js');
let payments = db.getEntityTable('payments');

describe('[make payment]', function() {
  let accountNoStripe = {
    email: 'accountNoStripe@accountNoEmail.com',
  };

  describe('[invalid charge sequence]', function() {
    beforeEach(wipeEntity);
    afterEach(wipeEntity);

    it('should not allow make payment without authentication', function() {
      return co(function *() {
        yield request
          .post('/v1/account/payments')
          .send({})
          .expect(401)
          .expect({
            err: 'Authentication Failure',
            msg: 'Authentication token missing',
          });
      });
    });

    it('should not allow make payment with invalid authentication', function() {
      return co(function *() {
        yield request
          .post('/v1/account/payments')
          .set('authentication', 'invalid authentication string')
          .send({})
          .expect(401)
          .expect({
            err: 'Authentication Failure',
            msg: 'Authentication token invalid',
          });
      });
    });

    it('should not allow make payment missing charge object', function() {
      return co(function *() {
        yield accounts.insert(accountNoStripe);
        let jwt = yield token.create({
          subject: accountNoStripe.email,
        });
        yield request
          .post('/v1/account/payments')
          .set('authentication', jwt)
          .send({
            // missing charge
          })
          .expect(400)
          .expect({
            err: 'Make Payment Failure',
            msg: 'Invalid charge specified',
          });
      });
    });

    it('should not allow make payment with charge missing amount', function() {
      return co(function *() {
        yield accounts.insert(accountNoStripe);
        let jwt = yield token.create({
          subject: accountNoStripe.email,
        });
        yield request
          .post('/v1/account/payments')
          .set('authentication', jwt)
          .send({
            charge: {
              // missing amount
              currency: 'usd',
            },
          })
          .expect(400)
          .expect({
            err: 'Make Payment Failure',
            msg: 'Invalid charge specified',
          });
      });
    });

    it('should not allow make payment with charge missing currency', function() {
      return co(function *() {
        yield accounts.insert(accountNoStripe);
        let jwt = yield token.create({
          subject: accountNoStripe.email,
        });
        yield request
          .post('/v1/account/payments')
          .set('authentication', jwt)
          .send({
            charge: {
              amount: 100.00,
              // missing currency
            },
          })
          .expect(400)
          .expect({
            err: 'Make Payment Failure',
            msg: 'Invalid charge specified',
          });
      });
    });

    it('should not allow make payment without a card (and no default card on account)', function() {
      return co(function *() {
        yield accounts.insert(accountNoStripe);
        let jwt = yield token.create({
          subject: accountNoStripe.email,
        });
        yield request
          .post('/v1/account/payments')
          .set('authentication', jwt)
          .send({
            charge: {
              amount: 100.00,
              currency: 'usd',
            },
            // card missing
          })
          .expect(400)
          .expect({
            err: 'Make Payment Failure',
            msg: 'No card specified, and no default card present',
          });
      });
    });
  });

  describe('[valid charge sequence]', function() {
    this.timeout(30000);

    //NOTE that this describe block uses a shared state in the `jwt` variable
    // between the ultiple it blocks contained within it.
    // Keep this in mind if/ when testing in isolation

    before(wipeEntity);
    after(wipeEntity);

    let accountToCharge = {
      email: 'accountToCharge'+Date.now()+'@accountToEmail.com',
    };
    let jwt = undefined;

    let chargeInfo = {
      charge: {
        amount: 100,
        currency: 'usd',
      },
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2020,
        cvc: '999',
      },
    };
    let addedCard = undefined;

    it('should make payment with specified new card', function() {
      return co(function *() {
        yield accounts.insert(accountToCharge);
        jwt = yield token.create({
          subject: accountToCharge.email,
        });

        let response = yield request
          .post('/v1/account/payments')
          .set('authentication', jwt)
          .send(chargeInfo);
        // console.log(response.status, '/n', response.body);
        expect(response.status).to.equal(201);
        let payment = response.body.payment;
        expect(payment).to.be.an('object');
        expect(payment.card).to.be.an('object');
        expect(payment.card.object).to.equal('card');
        expect(payment.id).to.be.a('string');
        expect(payment.amount).to.equal(chargeInfo.charge.amount);
        expect(payment.currency).to.equal(chargeInfo.charge.currency);
        expect(payment.card.last4).to.equal(chargeInfo.card.number.slice(-4));
        addedCard = payment.card;

        // verify that the new payment has been added as an entity
        let savedPayment = yield payments.findOne({
          accountId: accountToCharge.email,
        });
        expect(savedPayment).to.be.an('object');
        expect(savedPayment.date).to.be.a('number');
        expect(savedPayment.charge).to.be.an('object');
        expect(savedPayment.charge).to.deep.equal(payment);
      });
    });

    it('should make payment with specified existing card', function() {
      return co(function *() {
        let response = yield request
          .post('/v1/account/payments')
          .set('authentication', jwt)
          .send({
            charge: {
              amount: 100.00,
              currency: 'usd',
            },
            card: addedCard.id,
          });
        // console.log(response.status, '/n', response.body);
        expect(response.status).to.equal(201);
        let payment = response.body.payment;
        expect(payment).to.be.an('object');
        expect(payment.card).to.be.an('object');
        expect(payment.card.object).to.equal('card');
        expect(payment.id).to.be.a('string');
        expect(payment.amount).to.equal(chargeInfo.charge.amount);
        expect(payment.currency).to.equal(chargeInfo.charge.currency);
        expect(payment.card.last4).to.equal(chargeInfo.card.number.slice(-4));

        // verify that the new payment has been added as an entity
        let savedPayment = yield payments.findOne({
          'charge.id': payment.id,
        });
        // console.log('savedPayment', savedPayment);
        expect(savedPayment).to.be.an('object');
        expect(savedPayment.date).to.be.a('number');
        expect(savedPayment.charge).to.be.an('object');
        expect(savedPayment.charge).to.deep.equal(payment);
      });
    });

    it('should make payment with default card', function() {
      return co(function *() {
        let response = yield request
          .post('/v1/account/payments')
          .set('authentication', jwt)
          .send({
            charge: chargeInfo.charge,
            // card missing, use default
          });
        // console.log(response.status, '/n', response.body);
        expect(response.status).to.equal(201);
        let payment = response.body.payment;
        expect(payment).to.be.an('object');
        expect(payment.card).to.be.an('object');
        expect(payment.card.object).to.equal('card');
        expect(payment.id).to.be.a('string');
        expect(payment.amount).to.equal(chargeInfo.charge.amount);
        expect(payment.currency).to.equal(chargeInfo.charge.currency);
        expect(payment.card.last4).to.equal(chargeInfo.card.number.slice(-4));

        // verify that the new payment has been added as an entity
        let savedPayment = yield payments.findOne({
          'charge.id': payment.id,
        });
        expect(savedPayment).to.be.an('object');
        expect(savedPayment.date).to.be.a('number');
        expect(savedPayment.charge).to.be.an('object');
        expect(savedPayment.charge).to.deep.equal(payment);
      });
    });
  });
});
