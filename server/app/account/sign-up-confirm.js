'use strict';

let coBody = require('co-body');

let db = require('../database.js');
let auth = require('../auth.js');
let accountUtil = require('./account-util.js');

let accounts = db.getEntityTable('accounts');

module.exports = confirmSignUp;

/**
 * Route handler that completes an already initiated sign up.
 * After the initial sign up, the user would have received a confirmation code
 * by email, and it is with this that this route handler should be called
 *
 * Accepts a JSON in the request body:
 * - id: account ID
 * - pw: account password
 * - confirmCode: confirmation code received by email
 *
 * Responds after updating the account to a status of complete
 *
 * @yield {null} returns to terminate
 */
function *confirmSignUp() {
  let input = yield coBody(this.request);
  let email = input.email;
  // let id = input.id;
  // let pw = input.pw;
  let confirmCode = input.confirmCode;

  if (typeof email !== 'string' || typeof confirmCode !== 'string') {
  // if (typeof id !== 'string' || typeof confirmCode !== 'string') {
      // typeof confirmCode !== 'string' ||
      // typeof pw !== 'string') {
    this.response.body = {
      err: 'Sign Up Confirmation Failure',
      // msg: 'Username, password, and confirmCode must be specified',
      msg: 'Email and confirmCode must be specified',
      // msg: 'Username and confirmCode must be specified',
    };
    this.response.status = 400;
    return;
  }

  let pendingAccount = yield accounts.findOne({
    email,
    // id,
    'rego.status': 'pending',
    'rego.confirmCode': confirmCode,
  });

  if (!pendingAccount) {
    this.response.body = {
      err: 'Sign Up Confirmation Failure',
      msg: 'Email or confirmation code is invalid',
      // msg: 'ID or confirmation code is invalid',
    };
    this.response.status = 400;
    return;
  }

  if (!accountUtil.isRegoPendingDateValid(pendingAccount.rego.date)) {
    this.response.body = {
      err: 'Sign Up Confirmation Failure',
      msg: 'Confirmation code has expired',
    };
    this.response.status = 400;
    return;
  }

  // let isPasswordCorrect = yield auth.passwordChecker(pendingAccount.key, pw);
  //
  // if (!isPasswordCorrect) {
  //   this.response.body = {
  //     err: 'Sign Up Confirmation Failure',
  //     msg: 'Incorrect password',
  //   };
  //   this.response.status = 401; // Unauthorised
  //   return;
  // }

  // Confirmation is successful, so update the user's account
  let query = { email };
  // let query = { id };
  let value = {
    $set: {
      'rego.status': 'complete',
      'rego.date': Date.now(),
    },
    $unset: {
      'rego.confirmCode': 1,
    },
  };
  let options = {
    upsert: false,
  };
  let confirmedAccount = yield accounts.findAndModify(query, value, options);
  if (!confirmedAccount) {
    this.response.body = {
      err: 'Sign Up Confirmation Failure',
      msg: 'Unable to update',
    };
    this.response.status = 500;
    return;
  }

  //TODO send confirmation email

  this.response.body = {
    email,
    // id,
    email: confirmedAccount.email,
    msg: 'Account has been confirmed',
  };
  this.response.status = 200;
}
