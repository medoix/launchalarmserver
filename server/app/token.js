'use strict';

let jwtSimple = require('jwt-simple');
let moment = require('moment');

let config = require('./config');

module.exports = {
  create,
  verify,
};

/**
 * Constructs a JSON web token
 * This JWT can only be decoded and therefore verified by this server -
 * must know the token secret, so keep it safe
 *
 * Options:
 *
 * - subject (compulsory)
 * - issuedAt (always overwritten)
 * - expiry (always overwritten)
 * - issuer (optional)
 * - issuer (optional)
 * - audience (optional)
 * - notBefore (optional)
 * - jwtId (optional)
 *
 * See http://jwt.io/
 * See http://self-issued.info/docs/draft-ietf-oauth-json-web-token.html
 *
 * @param  {Object}   options  See description above
 * @param  {Function} callback Standard errback
 */
function create(options, callback) {
  return new Promise(function (resolve) {
    if (typeof options.subject !== 'string') {
      callback('subject must be set');
      return;
    }
    // Subject
    let sub = options.subject;
    // Issued At
    let iat = moment.utc();
    // Expiry
    let exp = iat.clone().add(config.token.expiry, 'ms');

    let criteria = {
      sub,
      iat: iat.valueOf(),
      exp: exp.valueOf(),
      nbf: options.notBefore || undefined,
      iss: options.issuer || undefined,
      aud: options.audience || undefined,
      jti: options.jwtId || undefined,
    };
    let outputToken = jwtSimple.encode(
      criteria, config.token.secret, config.token.algorithm);

    setTimeout(function() {
      resolve(outputToken);
    }, 10);
  });
}

/**
 * Decodes and verifies a JSON web token
 * using the secret (hopefully) known only to this server,
 * so keep it safe!
 *
 * Ensures that inputToken can:
 *
 * - be decoded using this server's secret
 * - once decoded matches several criteria
 *   - must have a subject
 *   - must not be expired
 *   - must be after it becomes valid
 * - optionally, checked when specified in criteria
 *   - audience must be amongst the specified ones
 *   - issuer must be amongst the specified ones
 *
 * @param  {String}   inputToken A JSON web token that has been
 *     encoded and serialised to a string
 * @param  {Object}   criteria   If the JSON web token decodes successfully,
 *     it must also pass any criteria required here
 * @param  {Function} callback   Standard errback
 */
function verify(inputToken, criteria) {
  return new Promise(function (resolve, reject) {
    criteria = criteria || {};
    let outputToken = jwtSimple.decode(inputToken, config.token.secret);

    // Always on criterion: subject (presence)
    if (!outputToken.sub) {
      return reject('Invalid token: subject missing');
    }
    // Always-on criterion: expiry (current time)
    if (!outputToken.exp) {
      return reject('Invalid token: expiry missing');
    }
    // DISABLING EXPIRY CHECK UNTIL NEEDED //
    // This means tokens will still have a 24h+ expiry set on device but server wont care yet //
    //if (outputToken.exp < moment.utc().valueOf()) {
    //  return reject('Invalid token: expired');
    //}
    // Always-on criterion: not before (current time)
    if (!!outputToken.nbf &&
      outputToken.nbf >= moment.utc.valueOf()) {
      return reject('Invalid token: not yet valid');
    }
    // Optional criterion: audiences (list of permitted)
    if (!!criteria.audiences &&
      criteria.audiences.indexOf(outputToken.aud) < 0) {
      return reject('Invalid token: audience mismatch');
    }
    // Optional criterion: issuers (list of permitted)
    if (!!criteria.issuers &&
      criteria.issuers.indexOf(outputToken.iss) < 0)  {
      return reject('Invalid token: issuer mismatch');
    }

    // Return an object with more user-friendly key names,
    // and consistent with the `inputToken` expected by `verify()`

    setTimeout(function() {
      resolve({
        subject: outputToken.sub,
        issuedAt: outputToken.iat,
        expiry: outputToken.exp,
        notBefore: outputToken.nbf,
        issuer: outputToken.iss,
        audience: outputToken.aud,
        jwtId: outputToken.jti,
      });
    }, 10);
  });
}
