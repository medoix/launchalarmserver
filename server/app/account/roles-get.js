'use strict';

module.exports = rolesGet;

/**
 * Route handler that responds with the list of current roles
 * that this account has.
 *
 * @yield {null} returns to terminate
 */
function *rolesGet() {
  let account = this.state.account;
  let roles = account.roles || [];
  this.response.status = 200;
  this.response.body = {
    roles,
  };
}
