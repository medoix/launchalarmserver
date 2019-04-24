'use strict';

let coBody = require('co-body');

let db = require('../database.js');
let auth = require('../auth.js');
let emailer = require('../email.js');
let config = require('../config.js');
let accountUtil = require('./account-util.js');

let accounts = db.getEntityTable('accounts');

module.exports = signUp;

/**
 * Route handler that initiates the sign up.
 *
 * Accepts a JSON in the request body:
 * - id: account ID
 * - email: an email address to be associated with this account
 * - pw: account password
 *
 * Allows the sign up only if the specified ID and email address
 * do not already exist.
 *
 * Responds after sending a confirmation code to the email address proivided.
 *
 * @yield {null} returns to terminate
 */
function *signUp() {
  let input = yield coBody(this.request);

  //let id = input.id;
  let email = input.email;
  let pw = input.pw;
  if ( // typeof id !== 'string' ||
      typeof email !== 'string' ||
      typeof pw !== 'string') {
    this.response.body = {
      err: 'Sign Up Failure',
      msg: 'Email, and password must be specified',
    };
    this.response.status = 400;
    return;
  }
  if (pw.length < config.account.password.minimumLength) {
    this.response.body = {
      err: 'Sign Up Failure',
      msg: 'Password is too short',
    };
    this.response.status = 400;
    return;
  }
  if (!config.account.email.validate(email)) {
    this.response.body = {
      err: 'Sign Up Failure',
      msg: 'Email address is invalid',
    };
    this.response.status = 400;
    return;
  }

  // Check if there is an existing account that has been registered
  // which has not gone stale yet
  let existingUser = yield accounts.findOne({
    $or: [
      // { id },
      { email },
    ],
  });
  let alreadyRegistered = (
    !!existingUser &&
    !!existingUser.rego &&
    (
      (existingUser.rego.status !== 'pending') ||
      (
        existingUser.rego.status === 'pending' &&
        accountUtil.isRegoPendingDateValid(existingUser.rego.date)
        // (Date.now() - existingUser.rego.date) < config.account.rego.pendingExpiry
      )
    )
  );
  if (alreadyRegistered) {
    this.response.body = {
      err: 'Sign Up Failure',
      msg: 'Email address already registered',
      detail: [email],
    };
    this.response.status = 400;
    return;
  }

  let hashResult = yield auth.passwordHasher({ pw });
  let confirmationCode = yield auth.generateConfirmationCode();
  let value = {
    // id,
    email,
    key: hashResult,
    rego: {
      status: 'pending',
      confirmCode: confirmationCode,
      date: Date.now(),
    },
  };

  if (!!existingUser) {
    let query = {
      _id: existingUser._id,
    };
    let options = {
      'new': true,
    };
    yield accounts.findAndModify(query, value, options);
  }
  else {
    yield accounts.insert(value);
  }

  try {
    emailer.send({
      to: `${email} <${email}>`,
      // to: `${id} <${email}>`,
      subject: `Launch Alarm - Confirm Email`,
      html: `<html><p>Hi there rocketeer!
        <p>You're <em>almost</em> done.
        <p>Click here to <a href="${config.server.signUpConfirmUrl.replace(':email', email).replace(':confirmationCode', confirmationCode)}">
        confirm your account</a>.
        <p>Alternatively, you can enter the following details manually:
        <p>Email: ${email}
        <p>Code: ${confirmationCode}
        <p>at <a href="https://launchalarm.com/#confirm">Launch Alarm</a>
        <p>See you soon!
        <p></html>`,
      // attachment: [{
      //   data:`<html><p>Hi there!
      //   <p>You're <em>almost</em> done.
      //   <p>Click here to <a href="${config.server.signUpConfirmUrl.replace(':confirmationCode', confirmationCode)}">
      //   confirm your account</a>.
      //   <p>Alternatively, you can enter the following confirmation code manually: ${confirmationCode}
      //   <p>See you soon!
      //   <p></html>`,
      //   alternative:true,
      // }],
    });
  }
  catch (ex) {
    console.log(ex);
    this.response.status = 500;
    this.response.body = {
      err: 'Sign Up Failure',
      msg: 'Failed to send confirmation email',
    };
    return;
  }
  this.response.body = {
    // id,
    email,
    msg: 'Check email for confirmation code',
  };
  this.response.status = 201;
}
