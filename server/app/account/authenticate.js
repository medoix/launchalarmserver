'use strict';

let db = require('../database.js');
let token = require('../token.js');

let accounts = db.getEntityTable('accounts');

module.exports = aunthenticate;

/**
 * Verifies that the request has a valid authentication JSON web token (JWT),
 * and if so, sets it as a property on the request (`request.state.jwt`)
 * Use as middleware on routes that require the user to be authenticated.
 *
 * Note that this only authenticates, but does not authorise -
 * meaning that we only verify that this is indeed a user who has logged it -
 * any user at all - and a further step for authorisation needs to be performed -
 * perhaps in a subsequently executed middleware -
 * to verify that the user does indeed have the right to perform that request
 *
 * @param {Function} next Used to pass control flow to the next middleware, if any
 * @yield {Function} When authentication is OK, yields next,
 *   otherwise returns without yielding, setting a 401 status and
 *   an appropraite error message in the body
 */
function * aunthenticate(next) {
  let inputToken = this.request.header.authentication;
  if (!inputToken) {
    this.response.status = 401;
    this.response.body = {
      err: 'Authentication Failure',
      msg: 'Authentication token missing',
    };
    return;
  }
  let parsedToken = undefined;
  try {
    parsedToken = yield token.verify(inputToken, {});
    this.state.jwt = parsedToken;
  }
  catch (ex) {
    // console.error('\n', inputToken, ex, ex.stack);
    this.response.status = 401;
    this.response.body = {
      err: 'Authentication Failure',
      msg: 'Authentication token invalid',
    };
    return;
  }
  try {
    let query = {
      email: parsedToken.subject, // JWT subject is the account Email
      // id: parsedToken.subject, // JWT subject is the account ID
    };
    let account = yield accounts.findOne(query);
    this.state.account = account;
    yield next;
  }
  catch (ex) {
    console.error('\n', inputToken, ex, ex.stack);
    this.response.status = 401;
    this.response.body = {
      err: 'Authentication Failure',
      msg: 'Authentication account invalid',
    };
    return;
  }
}
