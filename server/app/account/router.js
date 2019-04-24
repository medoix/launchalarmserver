'use strict';

let koaRouter = require('koa-router');

/**
 * A koa router which groups all of the account related API endpoints together.
 *
 * @type {Function}
 */
let accountsRouter = koaRouter({
  prefix: '/v1/account',
});

let accounts = {
  authenticate: require('./authenticate.js'),
  authorise: require('./authorise.js'),

  signUp: require('./sign-up.js'),
  signUpConfirm: require('./sign-up-confirm.js'),
  logIn: require('./log-in.js'),
  passwordUpdate: require('./password-update.js'),

  rolesGet: require('./roles-get.js'),
  rolesUpdate: require('./roles-update.js'),

  paymentMake: require('./payment-make.js'),
  paymentCardGet: require('./payment-card-get.js'),

  userGet: require('./user-get.js'),
  userUpdate: require('./user-update.js'),
};

accountsRouter
  .post('signUp', '/signup',
    accounts.signUp)
  .post('signUpConfirm', '/signup/confirm',
    accounts.signUpConfirm)
  .post('login', '/login',
    accounts.logIn)
  .post('passwordUpdate', '/password',
    accounts.passwordUpdate)
  .get('rolesGet', '/roles',
    accounts.authenticate,
    accounts.rolesGet)
  .post('rolesUpdate', '/roles',
    accounts.authenticate,
    accounts.rolesUpdate)
  .get('userGet', '/user',
    accounts.authenticate,
    accounts.userGet)
  .post('userUpdate', '/user',
    accounts.authenticate,
    accounts.userUpdate)
  .get('paymentCardGet', '/payments/cards',
    accounts.authenticate,
    accounts.paymentCardGet)
  .post('paymentMake', '/payments',
    accounts.authenticate,
    accounts.paymentMake)
  ;

if (typeof global.describe === 'function') {
  // Additional route that is present only when test runner (mocha)
  // is running. This route is only needed for testing.
  (function() {
    accountsRouter
      .get('testAuthoriseAnyRole', '/test/authorise/roles-any/admin',
        accounts.authenticate,
        accounts.authorise.rolesAny(['admin']),
        okResponse);
    function * okResponse() {
      this.response.status = 200; this.response.body = { ok: true };
    }
  })();
}

module.exports = accountsRouter;
