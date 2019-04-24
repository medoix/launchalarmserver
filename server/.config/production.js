'use strict';

let fs = require('fs');
let path = require('path');
let cwd = process.cwd();
let domain = 'launchalarm.com';

let config = {
  database: process.env.MONGODB_URI,
  server: {
    http: {
      port: process.env.PORT,
    },
    signUpConfirmUrl: `https://${domain}/?:email&:confirmationCode#confirm`,
  },
  static: {
    maxAge: 86400000,
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
    from: `${domain} <noreply@launchalarm.com>`,
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
    // expiry: 24*60*60*1000, // 86,400,000
    expiry: 100, // 100 ms since epoc
    secret: 'G&lkpNJ0w2kku*#PQs7Gm0Ln',
    algorithm: 'HS256',
  },
  payments: {
    stripeApiKeyPrivate: 'sk_live_B5QAfdiL4HrdeK9g7nCStUxa',
    stripeApiKeyPublic: 'pk_live_Hfip8KP3e7DV1PaOORd9LO2B',
  },
};
module.exports = config;
