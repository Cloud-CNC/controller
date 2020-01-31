/**
 * @fileoverview Cloud CNC Controller
 */

//Imports
const config = require('./config.js');
const fs = require('fs');
const logger = require('./lib/logger.js');
const serial = require('./lib/serial.js');
const websocket = require('./lib/websocket.js');

//Serial controller
const serialController = new serial(config.machines, config.controller.serialDelay, config.controller.maximumSerialAttempts, logger);

//Websocket controller
const websocketController = new websocket(config.core.url, config.controller._id, fs.readFileSync(config.controller.key, 'utf8'), config.controller.websocketDelay, config.controller.maximumWebsocketAttempts, logger);

//Command
websocketController.on('command', (data, response) =>
{
  //Send
  serialController.send(data.machine, data.command).then(res =>
  {
    //Response
    response(res);
  });
});

//Execute
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

//Core disconnect
websocketController.on('disconnect', () =>
{
  if (config.controller.failsafe)
  {
    //Run failsafe command
    config.machines.forEach(machine =>
    {
      serialController.send(machine._id, machine.failsafe);
    });
  }
});

//Machine disconnect
/*serialController.on('disconnect', machine =>
{

});*/