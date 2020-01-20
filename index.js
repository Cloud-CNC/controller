/**
 * @fileoverview Cloud CNC Controller
 */

//Imports
const config = require('./config.js');
const fs = require('fs');
const logger = require('./lib/logger.js');
const serial = require('./lib/serial.js');
const websocket = require('./lib/websocket.js');

//Allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

//Serial controller (Only for enabled machines)
const serialController = new serial(config.machines.filter(machine => machine.enabled), config.controller.serialDelay, logger);

//Websocket controller
const websocketController = new websocket(config.core.url, config.controller._id, fs.readFileSync(config.controller.key, 'utf8'), config.controller.websocketDelay, logger);

//Command event
websocketController.on('command', (data, response) =>
{
  //Send
  serialController.send(data.machine, data.command).then(res =>
  {
    //Response
    response(res);
  });
});

//Execute event
websocketController.on('execute', (data, success) =>
{
  //Add M28 + M29 (SD Card Commands)
  data.file = `M28\n${data.file}M29\n`;

  //Send
  serialController.send(data.machine, data.file).then(res =>
  {    
    //Response
    success(/echo:Now fresh file/.test(res));
  });
});