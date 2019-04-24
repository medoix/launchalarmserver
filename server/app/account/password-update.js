'use strict';

let coBody = require('co-body');

let db = require('../database.js');
let auth = require('../auth.js');
let token = require('../token.js');
let config = require('../config.js');
let accountUtil = require('./account-util.js');

let accounts = db.getEntityTable('accounts');

module.exports = passwordUpdate;

/**
 * Route handler that changes the password.
 *
 * Accepts a JSON in the request body:
 * - id: account ID
 * - pw: account password  (current)
 * - newPw: account password  (new)
 *
 * Calls `auth.passWordChecker()` to verify if the input password,
 * and if it is correct, calls `auth.passwordHasher()` and updates
 * to the new password.
 *
 * @yield {null} returns to terminate
 */
function *passwordUpdate() {
  let input = yield coBody(this.request);
  let email = input.email;
  // let id = input.id;
  let pw = input.pw;
  let newPw = input.newPw;
  if (
    // typeof id !== 'string' ||
      typeof email !== 'string' ||
      typeof pw !== 'string' ||
      typeof newPw !== 'string') {
    this.response.body = {
      err: 'Update Password Failure',
      msg: 'Email, password, and new password must be specified',
    };
    this.response.status = 400;
    return;
  }
  if (pw === newPw) {
    this.response.body = {
      err: 'Update Password Failure',
      msg: 'Password and new password must be different',
    };
    this.response.status = 400;
    return;
  }
  if (newPw.length < config.account.password.minimumLength) {
    this.response.body = {
      err: 'Update Password Failure',
      msg: 'New password is too short',
    };
    this.response.status = 400;
    return;
  }

  let account = yield accounts.findOne({
    email,
    // id,
    'rego.status': 'complete',
  });

  if (!account ||
      !account.key ||
      !account.key.hash) {
    this.response.body = {
      err: 'Update Password Failure',
      msg: 'Incorrect email, or password',
    };
    this.response.status = 401;
    //TODO insert a random delay here before returning
    return;
  }

  let isPasswordCorrect = yield auth.passwordChecker(account.key, pw);

  if (!isPasswordCorrect) {
    this.response.body = {
      err: 'Update Password Failure',
      msg: 'Incorrect email, or password',
    };
    this.response.status = 401; // Unauthorised
    return;
  }

  // Password check out correctly, so we can update to the new passwword
  let hashResult = yield auth.passwordHasher({ pw });

  let value = {
    $set: {
      key: hashResult,
      'rego.passwordChangedDate': Date.now(),
    },
  };
  let updatedAccount = yield accounts.findAndModify({ email }, value, { upsert: false });
  // let updatedAccount = yield accounts.findAndModify({ id }, value, { upsert: false });
  if (!updatedAccount) {
    this.response.body = {
      err: 'Update Password Failure',
      msg: 'Unable to update',
    };
    this.response.status = 500;
    return;
  }

  this.status = 201;
}
