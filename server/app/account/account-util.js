'use strict';

let config = require('../config.js');

module.exports = {
  isRegoPendingDateValid,
};

/**
 * Determine if a current registration has expired
 *
 * @param  {Number}  date the value of `Date.now()` to compare against
 * @return {Boolean} true when still valid
 */
function isRegoPendingDateValid(date) {
  return (Date.now() - date) <= config.account.rego.pendingExpiry;
}
