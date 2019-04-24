'use strict';

let koa = require('koa');
let cors = require('koa-cors');
let hbs = require('koa-handlebars');
let hbsHelpers = require('./layouts/helpers/hbs.helpers');

let pagesRouter = require('./pages/router.js');
let accountsRouter = require('./account/router.js');
let devicesRouter = require('./device/router.js');
let staticMiddleware = require('./static.js');
let config = require('./config.js');

let server = koa();

/**
 * A koa server instance, composed of routers and middleware
 */
server
  .use(cors({ origin: "*" }))

// Force HTTPS in production ENV
// if (process.env.NODE_ENV === 'production') {
//   server.use(enforceHttps());
// }

server
  .use(hbs(
      {
          layoutsDir: 'app/layouts',
          viewsDir: 'app/layouts/views',
          partialsDir: 'app/layouts/partials',
          defaultLayout: 'main',
          cache: config.public,
          helpers: hbsHelpers
      }
  ))
  .use(pagesRouter.routes())
  .use(pagesRouter.allowedMethods())
  .use(accountsRouter.routes())
  .use(accountsRouter.allowedMethods())
  .use(devicesRouter.routes())
  .use(devicesRouter.allowedMethods())
  .use(staticMiddleware)
  ;

module.exports = server;
