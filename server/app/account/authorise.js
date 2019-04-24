'use strict';

let db = require('../database.js');
let auth = require('../auth.js');
let token = require('../token.js');
let config = require('../config.js');
let accountUtil = require('./account-util.js');

let accounts = db.getEntityTable('accounts');

module.exports = {
  withVerifier: authoriseWithVerifier,
  rolesAny: authoriseWithRolesAny,
};

/**
 * Returns an instance of the authorise middleware
 * which uses a custom authorisation verifier promise function
 * which you may specify.
 *
 * The authorise middleware **is not** exposed directly,
 * and thus you must use it via this function,
 * see `authoriseWithRolesAny` for reference implmentation.
 *
 * @param  {Function} authoriseVerifier Function that returns a
 *   promise which must reject an invalid authorisation attempt.
 *   See `verifyRolesAny` for an reference implementation
 *   of `authoriseVerifier`.
 * @return {Function} non-terminating koa middleware,
 *   see `authorise`
 */
function authoriseWithVerifier(authoriseVerifier) {
  /**
   * Designed with the assumption that this middleware is called
   * after authentication has been done
   * (and therefore `account` has been set on the request context state).
   *
   * It does not, after all, make sense to authorise without authenticating first.
   *
   * Makes the most sense to use this middleware immediately
   * proceeding the `authenticate` middleware, which does precisely this.
   *
   * @param {Function} next  The next function in the middleware chain
   * @yield {Function}  If authorisation suceeds yields next,
   *   otherwise returns and exits the middleware chain,
   *   setting an error status and body
   */
  return function * authorise(next) {
    try {
      // `account` must already be set on the request state
      let account = this.state.account;
      if (!account) {
        throw 'No account with the specified Email';
        // throw 'No account with the specified ID';
      }
      let ok = yield authoriseVerifier(account);
      this.state.account = account;
      yield next;
    }
    catch (ex) {
      this.response.status = 401;
      this.response.body = {
        err: 'Authorisation failure',
        msg: 'This account is unauthorised',
      };
      return;
    }
  };
}

/**
 * Authorises an account which has at least 1 of the specified roles
 *
 * @param  {Array<String>} roles A list of roles
 * @return {Function}  AN instance of the `authorise` middleware
 */
function authoriseWithRolesAny(roles) {
  if (!Array.isArray(roles)) {
    throw 'Roles must be an array';
  }
  for (let role of roles) {
    if (typeof role !== 'string' || role.length < 1) {
      throw 'Roles must be strings';
    }
  }
  return authoriseWithVerifier(verifyRolesAny);

  function verifyRolesAny(account) {
      return new Promise(function (resolve, reject) {
        let actualRoles = account.roles || [];
        for (let role of roles) {
          for (let actualRole of actualRoles) {
            if (role === actualRole) {
              return resolve(account);
            }
          }
        }
        return reject('No account with the required roles');
      });
    }
}
