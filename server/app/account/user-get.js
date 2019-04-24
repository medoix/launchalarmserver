'use strict';

module.exports = userGet;

/**
 * Route handler that responds with the user object
 * associated with this account.
 *
 * @yield {null} returns to terminate
 */
function *userGet() {
  let account = this.state.account;
  let user = account.user || {};
  this.response.status = 200;
  this.response.body = {
    user,
  };
}
