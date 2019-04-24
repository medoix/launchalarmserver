'use strict';

let coBody = require('co-body');

let db = require('../database.js');
let stripe = require('./stripe-instance.js');

let accounts = db.getEntityTable('accounts');
let payments = db.getEntityTable('payments');

module.exports = paymentMake;

/**
 * Route handler that charges a user's credit card.
 *
 * This allows for different input configurations:
 * - amount: the number to charge the card
 * - currency: the currency of the charge
 * - card: this is optional, only if the user already has a default card
 *   otherwise a card must be specified. the specified card can either be the
 *   full card details from scratch (object),
 *   or it can just be the ID of a previously stored card (string)
 *
 * Responds with the carge that was made, if successful
 *
 * @yield {null} returns to terminate
 */
function * paymentMake() {
  let input = yield coBody(this.request);
  let account = this.state.account;
  let charge = input.charge;
  let card = input.card;

  if (!charge ||
    typeof charge.amount !== 'number' ||
    typeof charge.currency !== 'string') {
      this.response.status = 400;
      this.response.body = {
        err: 'Make Payment Failure',
        msg: 'Invalid charge specified',
      };
      return;
  }

  let stripeAccount = account.stripeAccount;
  let specifiedCard = undefined;
  if (!card && !!stripeAccount && !!stripeAccount.default_source) {
    // This account already has a stripe account with a default card,
    // and no card was specified
    specifiedCard = stripeAccount.default_source;
  }
  else if (!!stripeAccount && typeof card === 'string') {
    // This account already ha a stripe account,
    // but a card was specified
    specifiedCard = card;
  }
  else if (!!card &&
           (typeof card.id === 'string' ||
            typeof card.number === 'string')) {
    specifiedCard = card;
    if (!stripeAccount) {
      // This account has not previously been associated with a stripe account
      // We shall create a new account, and add the card at the same time
      try {
        let description = `${account.email}`;
        // let description = `${account.id} ${account.email}`;
        let source = {
          object: 'card',
        };
        Object.assign(source, specifiedCard);
        stripeAccount = yield stripe.customers.create({
          description,
          source,
        });
        // Assert that new card has indeed been associated with the account
        if (!stripeAccount.sources ||
          !Array.isArray(stripeAccount.sources.data) ||
          stripeAccount.sources.data.length < 1) {
          this.response.status = 500;
          this.response.body = {
            err: 'Make Payment Failure',
            msg: 'Payment profile create but card details are invalid',
          };
          return;
        }
        let newCard = stripeAccount.sources.data[0];
        specifiedCard = newCard.id;
      }
      catch (ex) {
        // TODO parse error to determine if the input was at fault
        console.log(ex, '\n', ex && ex.stack);
        this.response.status = 500;
        this.response.body = {
          err: 'Make Payment Failure',
          msg: 'Unable to create payment profile',
        };
        return;
      }
      try {
        account.stripeAccount = stripeAccount;
        let query = {
          email: account.email,
          // id: account.id,
        };
        let value = {
          $set: {
            stripeAccount,
          },
        };
        let options = {
          upsert: false,
        };
        let updatedAccount = yield accounts.findAndModify(query, value, options);
        // console.log('updatedAccount', updatedAccount);
      }
      catch (ex) {
        console.log(ex, '\n', ex && ex.stack);
        this.response.body = {
          err: 'Add Payment Card Failure',
          msg: 'Unable to update account payment details',
        };
        this.response.status = 500;
        return;
      }
    }
  }
  if (!specifiedCard) {
    this.response.status = 400;
    this.response.body = {
      err: 'Make Payment Failure',
      msg: 'No card specified, and no default card present',
    };
    return;
  }

  let chargeDetails = {
    customer: stripeAccount.id,
    amount: charge.amount,
    currency: charge.currency,
    description: charge.description, //optional,
    card: specifiedCard,
  };
  let newCharge;
  try {
    newCharge = yield stripe.charges.create(chargeDetails);
  }
  catch (ex) {
    console.log(ex, '\n', ex && ex.stack);
    this.response.status = 500;
    this.response.body = {
      err: 'Make Payment Failure',
      msg: 'Unable to process the specified payment',
    };
  }
  try {
    newCharge.card = newCharge.source;
    delete newCharge.source;
    let storedPayment = payments.insert({
      accountId: account.email,
      // accountId: account.id,
      date: Date.now(),
      charge: newCharge,
    });
    this.response.status = 201;
    this.response.body = {
      payment: newCharge,
    };
  }
  catch (ex) {
    console.log(ex, '\n', ex && ex.stack);
    this.response.status = 500;
    this.response.body = {
      err: 'Make payment failure',
      msg: 'Unable to store payment being made',
    };
  }
}
