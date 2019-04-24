'use strict';

let fs = require('fs');
let path = require('path');
let cwd = process.cwd();
let domain = 'localhost';

let config = {
  database: `${domain}/dev-launchalarm`,
  server: {
    http: {
      port: 8080,
    },
    signUpConfirmUrl: `https://${domain}/?:email&:confirmationCode#confirm`,
  },
  static: {
    maxAge: 0,
  },
  public: {
    maxAge: 0,
  },
  account: {
    password: {
      minimumLength: 6,
    },
    email: {
      validate: function defaultValidateEmail(input) {
        // very loose validation
        return !!( /^\S+@\S+\.\S+$/ ).test(input);
      },
    },
    rego: {
      pendingExpiry: 24*60*60*1000,
    },
  },
  email: {
    from: `${domain} <support@localhost>`,
    use: 'nodemailer',
    nodemailer: {
      service: 'Mailjet',
      // host: 'in-v3.mailjet.com',
      // port: 465,
      // secure: true,
      // authMethod: 'yes',
      debug: true,
      auth: {
          user: 'b0489d97df0b0b3173e15fde4939e51f',
          pass: '53936ad601bdb178e4f1d13277b46c01',
      },
    },
  },
  auth: {
    confirmCode: {
      length: 32,
    },
    key: {
      alg: 'pbkdf2',
      iter: 1200,
      len: 128,
    },
  },
  token: {
    expiry: 24*60*60*1000,
    secret: 'Super-Secure-Secret',
    algorithm: 'HS256',
  },
  payments: {
    stripeApiKeyPrivate: 'sk_test_AkYF0RrbhXjOfGXZNNIH6Lhi',
    stripeApiKeyPublic: 'pk_test_TCHcxNz0CMhfjOSV4hyCx9Fa',
  },
};
module.exports = config;
