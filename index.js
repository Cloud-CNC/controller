/**
 * @fileoverview Cloud CNC Controller
 */

//Imports
const config = require('config');
const fs = require('fs');
const logger = require('./lib/logger');
const serial = require('./lib/serial');
const socket = require('./lib/socket');

//Serial controller
const serialController = new serial(
  config.get('machines'),
  config.get('controller.reconnect.serial.delay'),
  config.get('controller.reconnect.serial.maximumAttempts'));

//Socket controller
const socketController = new socket(
  config.get('core.url'),
  config.get('controller._id'),
  fs.readFileSync(config.get('controller.key'), 'utf8'),
  config.get('controller.reconnect.socket.delay'),
  config.get('controller.reconnect.socket.maximumAttempts'),
  config.get('machines'));

//Core to controller
socketController.on('command', data =>
{
  //Send
  serialController.send(data.machine, data.payload);
});

socketController.on('execute', data =>
{
  //Add M28 + M29 (SD Card Commands)
  data.file = `M28\n${data.file}M29\n`;

  //Send
  serialController.send(data.machine, data.payload);
});

//Controller to core
serialController.on('data', data =>
{
  socketController.send(data._id, data.payload);
});

//Fail safe
socketController.on('disconnect', () =>
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