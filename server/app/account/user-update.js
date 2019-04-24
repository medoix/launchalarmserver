'use strict';

let coBody = require('co-body');

let db = require('../database.js');

let accounts = db.getEntityTable('accounts');

module.exports = userUpdate;

/**
 * Route handler that updates the user object
 * associated with this account.
 *
 * @yield {null} returns to terminate
 */
function * userUpdate() {
  let input = yield coBody(this.request);
  let user = input.user;
  let account = this.state.account;

  if (!user) {
    this.response.status = 400;
    this.response.body = {
      err: 'User Change Failure',
      msg: 'No user data specified',
    };
    return;
  }

  let email = account.email;
  // let id = account.id;
  let value = {
    $set: {
      user,
    },
  };
  let updatedAccount = yield accounts.findAndModify({ email }, value, { upsert: false });
  // let updatedAccount = yield accounts.findAndModify({ id }, value, { upsert: false });
  if (!updatedAccount) {
    this.response.body = {
      err: 'Update User Failure',
      msg: 'Unable to update',
    };
    this.response.status = 500;
    return;
  }
  else {
    this.response.status = 200;
    this.response.body = {
      user,
    };
  }
}
