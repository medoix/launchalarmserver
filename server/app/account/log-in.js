'use strict';

let coBody = require('co-body');

let db = require('../database.js');
let auth = require('../auth.js');
let token = require('../token.js');
let config = require('../config.js');
let accountUtil = require('./account-util.js');

let accounts = db.getEntityTable('accounts');

module.exports = logIn;

/**
 * Route handler that logs into an account
 *
 * Accepts a JSON in the request body:
 * - id: account ID
 * - pw: account password
 *
 * Attempts to find an account with the specified `id`,
 * and it must have a valid (`complete`) rego status.
 *
 * Calls `auth.passWordChecker` to verify if the input password,
 * when hashed+salted, matches the hash+salt stored for this user.
 * If it does, the user is allowed to log in,
 * and the token is returned in the response.
 *
 * @yield {null} returns to terminate
 */
function *logIn() {
  let input = yield coBody(this.request);
  let email = input.email;
  // let id = input.id;
  let pw = input.pw;
  if (
      typeof email !== 'string' ||
      // typeof id !== 'string' ||
      typeof pw !== 'string') {
    this.response.body = {
      err: 'Log In Failure',
      msg: 'Email and password must be specified',
    };
    this.response.status = 400;
    return;
  }

  let query = {
    email,
    // id,
    'rego.status': 'complete',
  };
  let account = yield accounts.findOne(query);

  if (!account ||
      !account.key ||
      !account.key.hash) {
    this.response.body = {
      err: 'Log In Failure',
      msg: 'Incorrect email, or password',
    };
    this.response.status = 401;
    //TODO insert a random delay here before returning
    return;
  }

  let isPasswordCorrect = yield auth.passwordChecker(account.key, pw);

  if (!isPasswordCorrect) {
    this.response.body = {
      err: 'Log In Failure',
      msg: 'Incorrect email, or password',
    };
    this.response.status = 401; // Unauthorised
    return;
  }

  // User has successfully authenticated
  let jwt = yield token.create({
    expires: config.token.expiry,
    // subject: id,
    subject: email,
  });
  this.response.body = {
    jwt,
    email: account.email,
  };
  this.response.status = 200;
}
