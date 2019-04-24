'use strict';

let coBody = require('co-body');

let db = require('../database.js');

let accounts = db.getEntityTable('accounts');

module.exports = rolesUpdate;

/**
 * Route handler that allows the roles on an account to be updated.
 *
 * Input can contain:
 * - removeAll: if set to true removes all current roles
 * - anything else: either 'add' or 'remove' to add or remove that role from current roles
 *
 * Responds with the roles after the changes have been made.
 *
 * @yield {null} returns to terminate
 */
function *rolesUpdate() {
  let input = yield coBody(this.request);
  let deltas = input.deltas;

  if (!deltas ||
      Object.keys(deltas).length < 1) {
    this.response.status = 400;
    this.response.body = {
      err: 'Role Change Failure',
      msg: 'No role changes specified',
    };
    return;
  }

  let account = this.state.account;
  if (deltas.removeAll === true) {
    account.roles = [];
  }
  else {
    let rolesHash = {};
    account.roles = account.roles || [];
    account.roles.forEach(function(role) {
        rolesHash[role] = true;
    });
    let roleVal;
    Object.keys(deltas).forEach(function(role) {
        roleVal = deltas[role];
        if (roleVal === 'add') {
            rolesHash[role] = true;
        }
        else if (roleVal === 'remove') {
            rolesHash[role] = false;
        }
    });
    account.roles = [];
    Object.keys(rolesHash).forEach(function(role) {
        if (rolesHash[role] === true) {
            account.roles.push(role);
        }
    });
  }

  let email = account.email;
  let query = { email };
  // let id = account.id;
  // let query = { id };
  let value = {
    $set: {
      roles: account.roles,
    },
  };
  let options = {
    upsert: false,
  };
  let updatedAccount = yield accounts.findAndModify(query, value, options);
  if (!updatedAccount) {
    this.response.body = {
      err: 'Update Roles Failure',
      msg: 'Unable to update',
    };
    this.response.status = 500;
    return;
  }
  else {
    this.response.status = 200;
    this.response.body = {
      roles: account.roles,
    };
  }
}
