/**
 * @fileoverview Cloud CNC Controller
 */

//Imports
const config = require('./config.js');
const logger = require('./lib/logger.js');
const package = require('./package.json');
const serial = require('./lib/serial.js');
const websocket = require('./lib/websocket.js');

//Allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

//Serial controller (Only for enabled machines)
const serialController = new serial(config.machines.filter(machine => machine.enabled), logger);

//Websocket controller
const websocketController = new websocket(config.core.url, config.crypto.key, config.meta.delay, logger);
websocketController.on('open', () =>
{
  websocketController.bind(config.meta._id, package.version);
});

//Connect websocket to serial controller
websocketController.on('command', data =>
{
  console.log(`Received command: ${data.command} destined to: ${data.machine}`);
  //serialController.send(data.machine, data.command);
});