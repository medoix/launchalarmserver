'use strict';

let emailjs = require('emailjs');
let nodemailer = require('nodemailer');

let config = require ('./config.js');

let emailServer;
let transportConfig;
switch (config.email.use) {
  case 'emailjs':
    transportConfig = config.email.emailjs;
    emailServer  = emailjs.server.connect(transportConfig);
    break;
  case 'nodemailer':
    transportConfig = config.email.nodemailer;
    emailServer = nodemailer.createTransport(transportConfig);
    break;
}
if (!emailServer) {
  throw 'Failed to instantiate email server';
}

/**
 * sample emailjs message format:
 *
```
let message = {
   text:    "i hope this works",
   from:    "you <username@outlook.com>",
   to:      "someone <someone@your-email.com>, another <another@your-email.com>",
   cc:      "else <else@your-email.com>",
   subject: "testing emailjs",
   attachment:
   [
      { data:"<html>i <i>hope</i> this works!</html>", alternative:true },
      { path:"path/to/file.zip", type:"application/zip", name:"renamed.zip" }
   ]
};
````
 *
 */

/**
 * sample nodemailer message format
 *
```
let message = {
    from: 'Fred Foo 👥 <foo@blurdybloop.com>', // sender address
    to: 'bar@blurdybloop.com, baz@blurdybloop.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world 🐴', // plaintext body
    html: '<b>Hello world 🐴</b>' // html body
};
```
 *
 */

module.exports = {
  send: sendEmail,
  prepare: prepareEmail,
  transport: transportEmail,
  textFromHtml: textFromHtmlEmail,
};

/**
 * Send email
 *
 * @param  {Object} info see `prepareEmail` before
 * @return {Promise} that an email has been sent successfully
 */
function sendEmail(info) {
  return prepareEmail(info)
    .then(transportEmail);
}

/**
 * Validate and prepare the email,
 * required before sending it to the transport.
 *
 * The input `info` is modified,
 * see `textFromHtmlEmail`.
 *
 *
 * @param  {Object} info Contains the following fields:
 *   - `from`
 *   - `to`
 *   - `text` optional if `html` is specified,
 *      or an `alterniative` attachement is
 *   - `html` optional
 *   - `attachements` optional
 * @return {[type]}      [description]
 */
function prepareEmail(info) {
  return new Promise((resolve, reject) => {
    info.from = info.from || config.email.from;
    if (!info.subject || info.subject.length < 1) {
      return reject('Must provide a subject');
    }
    if (!info.to || info.to.length < 1) {
      return reject('Must provide a to');
    }
    if (!info.from || info.from.length < 1) {
      return reject('Must provide a from');
    }
    if (!info.text || info.text.length < 1) {
      let text = textFromHtmlEmail(info);
      if (!text || text.length < 1) {
        return reject('Must provide text, or html that can be converted to text');
      }
      info.text = text;
    }
    return resolve(info);
  });
}

/**
 * Depending on `config.email`, uses either
 * `nodemailer`, or `emailjs`,
 * to actually send the email.
 *
 * @param  {Object} info See `prepareEmail`
 * @return {Priomise} that email was transported to
 *   the recipient's server successfully
 */
function transportEmail(info) {
  return new Promise((resolve, reject) => {
    switch (config.email.use) {
      case 'emailjs':
        emailServer.send(info, transportEmailCallback);
        break;
      case 'nodemailer':
        emailServer.sendMail(info, transportEmailCallback);
        break;
    }
    function transportEmailCallback(err, msg) {
      if (!!err) {
        return reject(err);
      }
      return resolve(msg);
    }
  });
}

/**
 * The input `info` is modified:
 *
 * - if `text` is not specified, it is derived from `html`
 * - if `html` is not specified, it is derived from `attachments`
 *
 * @param  {Object} info see `prepareEmail`
 * @return {Object} modified `info` object
 */
function textFromHtmlEmail(info) {
  // test whether a HTML email is provided
  let text;
  let html;
  if (typeof info.html == 'string' && info.html.length > 0) {
    html = info.html;
  }
  else if (Array.isArray(info.attachment)) {
    html = info.attachment
      .filter(
        (att) => ( typeof att.data === 'string' && att.alternative === true ))
      .reduce(
        (out, att) => ( out + att.data ),
        '');
  }
  if (typeof html === 'string' && html.length > 0) {
    // set text to HTML that has been stripped of its tags
    // With special treatment for `<a href />`
    text = html
      .replace( /<a[^<>]*href="([^<>]*)"[^<>]*>([^<>]*)<\/a>/gi , ' $2 [ $1 ] ' )
      .replace( /<p[^<>]*>/gi , '\n\n')
      .replace( /<br[^<>]*>/gi , '\n')
      .replace( /<\/?[^<>]*>/gi , '')
      .replace( /\ +/gi, ' ' );
  }
  return text;
}
