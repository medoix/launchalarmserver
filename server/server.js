'use strict';

let http = require('http');

let config = require('./app/config.js');
let server = require('./app/server.js');

/**
 * Imports the koa server and starts both a `HTTP` server
 * and a `HTTPS` server, each listening on their own respective ports
 *
 * If `config.server` does not specify `http` or `https`,
 * then those are skipped.
 */

let serverCallback = server.callback();
let httpServer;

try {
  if(!config.server.http.port){ config.server.http.port = 8080; };

  httpServer = http.createServer(serverCallback);
  httpServer
    .listen(config.server.http.port, function(err) {
      if (!!err) {
        console.error('HTTP server FAIL: ', err, (err && err.stack));
      }
      else {
        console.log(`HTTP server OK listening on port: ${config.server.http.port}`);
      }
    });
}
catch (ex) {
  console.error('Failed to start HTTP server\n', ex, (ex && ex.stack));
}

module.exports = {
  http: httpServer,
  callback: serverCallback,
};
