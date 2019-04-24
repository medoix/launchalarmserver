'use strict';

let db = require('../database.js');

module.exports = paymentCardGet;

/**
 * Route handler that responds with the list of current credit cards
 * associated with this account.
 *
 * Does not return all of the data of course,
 * pares it down to just an ID, the last 4 digits,
 * and the cartd type.
 *
 * @yield {null} returns to terminate
 */
function * paymentCardGet() {
  let account = this.state.account;
  let stripeAccount = account.stripeAccount;
  if (!stripeAccount ||
      !stripeAccount.cards ||
      !stripeAccount.cards.data) {
    this.response.status = 200;
    this.response.body = {
      cards: [],
      defaultCard: null,
    };
    return;
  }

  let cards = stripeAccount.cards.data.map(function(card) {
    // only return the relevant information required for display
    return {
      id: card.id,
      last4: card.last4,
      cardType: card.brand,
    };
  });

  this.response.status = 200;
  this.response.body = {
    cards: cards,
    defaultCard: stripeAccount.default_card,
  };
  return;
}
