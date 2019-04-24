'use strict';

let config = require('../config.js');
let stripe = require('stripe');
let stripeInstance = stripe(config.payments.stripeApiKeyPrivate);

module.exports = {
  customers: {
    create: customerCreate,
    createCard: customerCreateCard,
    update: customerUpdate,
  },
  charges: {
    create: chargeCreate,
  },
};

function customerCreate(customerDetails) {
  return new Promise(function (resolve, reject) {
    stripeInstance.customers.create(customerDetails, function(err, newCustomer) {
      if (!!err) {
        return reject(err);
      }
      return resolve(newCustomer);
    });
  });
}

function customerCreateCard(stripeId, cardDetails) {
  return new Promise(function (resolve, reject) {
    stripeInstance.customers.createCard(stripeId, cardDetails, function(err, newCard) {
      if (!!err) {
        return reject(err);
      }
      return resolve(newCard);
    });
  });
}

function customerUpdate(stripeId, customerDetails) {
  return new Promise(function (resolve, reject) {
    stripeInstance.customers.createCard(stripeId, customerDetails, function(err, updatedCustomer) {
      if (!!err) {
        return reject(err);
      }
      return resolve(updatedCustomer);
    });
  });
}

function chargeCreate(chargeObj) {
  return new Promise(function (resolve, reject) {
    stripeInstance.charges.create(chargeObj, function(err, newCharge) {
      if (!!err) {
        return reject(err);
      }
      return resolve(newCharge);
    });
  });
}
