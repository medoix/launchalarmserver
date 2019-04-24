'use strict';

let koaRouter = require('koa-router');

/**
 * A koa router which groups all of the device related API endpoints together.
 *
 * @type {Function}
 */
let pagesRouter = koaRouter();

pagesRouter
  .get('/', function *() {
    yield this.render("home");
  })
  .get('/privacy', function *() {
    yield this.render("privacy");
  })
  ;

module.exports = pagesRouter;
