'use strict';

let fs = require('fs');
let path = require('path');
let cwd = process.cwd();
let domain = 'domain.com';
let config = {
  database: 'username:password@mongodb-host:mongodb-port',
  server: {
    http: {
      port: 80,
    },
    https: {
      port: 443,
      options: {
        key: fs
          .readFileSync(path.resolve(cwd, './certs/privkey.pem'), 'utf8')
          .toString(),
        cert: fs
          .readFileSync(path.resolve(cwd, './certs/fullchain.pem'), 'utf8')
          .toString(),
      },
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
    from: `${domain} <support@domain.com>`,
    use: 'nodemailer',
    nodemailer: {
      service: 'Mailjet',
      // host: 'in-v3.mailjet.com',
      // port: 465,
      // secure: true,
      // authMethod: 'yes',
      debug: true,
      auth: {
          user: 'mailjet-user-token',
          pass: 'mailjet-user-pass',
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
    stripeApiKeyPrivate: 'stripe-private-key',
    stripeApiKeyPublic: 'stripe-public-key',
  },
};
module.exports = config;
