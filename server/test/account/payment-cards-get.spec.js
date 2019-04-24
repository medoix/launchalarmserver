'use strict';

let co = require('co');

let token = require('../../app/token.js');

let
  accountsTestUtil = require('./accounts-test-util.js'),
  request = accountsTestUtil.request,
  accounts = accountsTestUtil.accounts,
  wipeEntity = accountsTestUtil.wipeEntity;

describe('[get payment cards]', function() {
  beforeEach(wipeEntity);
  afterEach(wipeEntity);

  let accountNoStripe = {
    email: 'accountNoStripe@accountnoEmail.com',
  };
  let accountHasStripe = {
    email: 'accountHasStripe@accountHasEmail.com',
    stripeAccount: {
      default_card: 'someDefaultCardId',
      cards: {
          data: [
              { id: 'card1Id', last4: '4242', brand: 'Visa',
                someExtraneousProperty3: 'shouldBeCulled' },
              { id: 'card2Id', last4: '5656', brand: 'MasterCard',
                someExtraneousProperty4: 'shouldBeCulled' },
          ],
          someExtraneousProperty2: 'shouldBeCulled',
      },
      someExtraneousProperty1: 'shouldBeCulled',
    },
  };

  it('should not allow get payment cards without authentication', function() {
    return co(function *() {
      yield request
        .get('/v1/account/payments/cards')
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token missing',
        });
    });
  });

  it('should not allow get payment cards with invalid authentication', function() {
    return co(function *() {
      yield request
        .get('/v1/account/payments/cards')
        .set('authentication', 'invalid authentication string')
        .expect(401)
        .expect({
          err: 'Authentication Failure',
          msg: 'Authentication token invalid',
        });
    });
  });

  it('should get payment cards when user has no stripe account', function() {
    return co(function *() {
      yield accounts.insert(accountNoStripe);
      let jwt = yield token.create({
        subject: accountNoStripe.email,
      });
      yield request
        .get('/v1/account/payments/cards')
        .set('authentication', jwt)
        .expect(200)
        .expect({
          cards: [],
          defaultCard: null,
        });
    });
  });

  it('should get payment cards when user has no stripe account', function() {
    return co(function *() {
      yield accounts.insert(accountHasStripe);
      let jwt = yield token.create({
        subject: accountHasStripe.email,
      });
      yield request
        .get('/v1/account/payments/cards')
        .set('authentication', jwt)
        .expect(200)
        .expect({
          cards: [
            { id: 'card1Id', last4: '4242', cardType: 'Visa' },
            { id: 'card2Id', last4: '5656', cardType: 'MasterCard' },
          ],
          defaultCard: 'someDefaultCardId',
        });
    });
  });
});
