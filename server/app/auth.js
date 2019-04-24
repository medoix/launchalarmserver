'use strict';

let crypto = require('crypto');

let config = require('./config.js');

module.exports = {
  passwordHasher,
  passwordChecker,
  generateConfirmationCode,
};

/**
 * Adds hash to a key, and removes its password
 *
 * @param  {Object}   key      The key
 * @param  {Function} callback Standard errback
 */
function passwordHasher(key) {
  return new Promise((resolve, reject) => {
    ensureKeyIsHashed(key, function onHashed(err, hashedKey) {
      setTimeout(function() {
        resolve(hashedKey);
      }, 10);
    });
  });
}

/**
 * Given an existing (fully populated) key,
 * check whether a given password matches this key.
 *
 * @param  {Object}   key      The key
 * @param  {string}   pw       A password
 * @param  {Function} callback Standard errback
 */
function passwordChecker(key, pw) {
  return new Promise((resolve, reject) => {
    if (!key.hash ||
        !key.salt ||
        !key.alg ||
        !key.iter ||
        !key.len) {
      reject('Key is missing hash, salt, alg, iter, or len');
      return;
    }
    let newKey = {
      pw,
      salt: key.salt,
      alg: key.alg,
      iter: key.iter,
      len: key.len,
    };
    ensureKeyIsHashed(newKey, function onHashed(err, hashedNewKey) {
      if (!!err) {
        reject(err);
        return;
      }
      let isMatch = (key.hash === hashedNewKey.hash);
      setTimeout(function() {
        resolve(isMatch);
        return;
      }, 10);
    });
  });
}

/**
 * Generates a confirmation code
 * Code is generated in a non-cryptographically secure manner
 *
 * @param  {Function} callback Standard errback
 */
function generateConfirmationCode() {
  return new Promise((resolve, reject) => {
    let len = config.auth.confirmCode.length;
    let out = '';
    do {
        out = out + Math.random().toString(36).slice(2);
    } while (out.length < len);
    out = out.substr(0, len);
    setTimeout(function() {
      resolve(out);
    }, 10);
  });
}

/**
 * Add salt to a key if it does not already have one
 * Salt is generated in a cryptographically secure manner
 *
 * @param  {Object}   key      The key, expected to have a `len` property
 * @param  {Function} callback Standard errback
 */
function ensureKeyIsSalted(key, callback) {
  if (key.salt) {
    callback(undefined, key);
    return;
  }
  crypto.randomBytes(key.len, function(err, saltyBuffer) {
    key.salt = saltyBuffer;
    callback(err, key);
    return;
  });
}

/**
 * Add hash to a key, based on its password, salt, algorithm, iterations, and length
 * Password is compulsory, everything else is optional -
 * supplied values will be used if provided,
 * and otherwise values will be generated for them.
 * The password will be removed from the key once the hash is added.
 *
 * @param  {Object}   key      The key - expected to have a compulsory `pw` property
 *     and optional `salt`, `alg`, `iter`, and `len` properties
 * @param  {Function} callback Standard errback
 */
function ensureKeyIsHashed(key, callback) {
  if (!key.pw) {
    callback('Password not present');
    return;
  }
  key.alg = key.alg || config.auth.key.alg;
  key.iter = key.iter || config.auth.key.iter;
  key.len = key.len || config.auth.key.len;
  ensureKeyIsSalted(key, function whenSalty(err, saltyKey) {
    if (typeof saltyKey.salt === 'string') {
      saltyKey.salt = new Buffer(saltyKey.salt, 'hex');
    }
    switch (key.alg) {
      case 'pbkdf2':
        crypto.pbkdf2(key.pw, key.salt, key.iter, key.len, function whenHashed(err, hash) {
          if (!!err) {
            callback(err);
            return;
          }
          key.hash = hash.toString('hex');
          key.salt = key.salt.toString('hex');
          key.pw = undefined;
          callback(undefined, key);
        });
        break;
      default:
        callback('Hash algorithm unsupported: '+key.alg);
        return;
    }
  });
}
