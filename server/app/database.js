'use strict';

const monkii = require('monkii');
const coMonk = require('co-monk');

const config = require('./config.js');

// let db = monkii(config.database.address + '/' + config.database.database);
let db = monkii(config.database);

db.on('timeout', () => {
  console.log('Mongo connection lost')
})

db.on('close', () => {
  console.log('Mongo connection closed')
})

db.on('reconnect', () => {
  console.log('Mongo reconnected')
})

db.on('error', () => {
  console.log('Mongo error')
})

let tables = {};

/**
 * Tables do not need to be created in order to be used.
 *
 * @param  {String} entityName The name of the entity table
 * @return {CoMonkTable} a MongoDb table that has been wrapped using `co-monk`
 */
function getEntityTable(entityName) {
  let entityTable = tables[entityName];
  if (!entityTable) {
    entityTable = coMonk(db.get(entityName));
    tables[entityName] = entityTable;
  }
  return entityTable;
}

module.exports = {
  db,
  getEntityTable,
};
