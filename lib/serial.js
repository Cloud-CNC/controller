/**
 * @fileoverview Serial Controller
 */

//Imports
const {EventEmitter} = require('events');
const ipcBinding = require('./ipcBinding');
const logger = require('./logger');
const mockBinding = require('@serialport/binding-mock');
const serialport = require('serialport');

//Serialport bindings
switch (process.env.NODE_ENV)
{
  //Use IPC bindings for E2E tests
  case 'e2e': {
    serialport.Binding = ipcBinding;
    break;
  }

  //Use mock bindings for development and unit tests
  case 'development':
  case 'unit': {
    serialport.Binding = mockBinding;
    mockBinding.createPort('FAKE-PATH', {echo: true});
    break;
  }
}


/**
 * @class Serial Controller
 */
module.exports = class Serial extends EventEmitter
{
  /**
   * @param {Array<Object>} machines Array of machines
   * @param {Number} delay Auto-reconnect delay (MS)
   * @param {Number} maximumAttempts Maximum number of attempts to reconnect to machine
   */
  constructor(machines, delay, maximumAttempts)
  {
    //Instantiate event emitter
    super();

    //Array for storing machines
    this.machines = [];

    //Connect to each machine
    machines.forEach((machine, index) =>
    {
      //Attempt counter
      let attempts = 0;

      //Connect
      let port = new serialport(machine.path, {baudRate: machine.baudRate});

      //Event handlers
      const onOpen = () =>
      {
        attempts = 0;

        //Log
        logger.info(`Successfully connected to serial machine at ${machine.path} aka ${machine._id}`);

        //Re-emit event
        this.emit('open');
      };

      const onClose = () =>
      {
        //Log
        logger.info(`Disconnected from machine at ${machine.path} aka ${machine._id}`);

        //Re-emit event
        this.emit('close');

        //Reconnect
        reconnect();
      };

      const onData = payload =>
      {
        //Log
        logger.info(`Received data from ${machine.path} aka ${machine._id}`);

        //Re-emit event
        this.emit('data', {
          _id: machine._id,
          payload: payload.toString()
        });
      };

      const onError = error =>
      {
        //Log
        logger.error(`${error} occurred at ${machine.path} aka ${machine._id}`);

        //Only re-emit event if there are listeners
        if (this.listeners('error').length > 0)
        {
          this.emit('error', error);
        }

        //If error is due to a missing machine, retry
        if (/File not found/.test(error.message))
        {
          reconnect();
        }
        else
        {
          //Remove machine
          this.machines = this.machines.splice(index, 1);
        }
      };

      //Register events
      const registerEvents = () =>
      {
        port.once('open', onOpen);
        port.once('close', onClose);
        port.on('data', onData);
        port.on('error', onError);
      };
      registerEvents();

      //Reconnect
      const reconnect = () =>
      {
        if (maximumAttempts != Infinity && attempts >= maximumAttempts)
        {
          logger.error(`Reached maximum attempts when connecting to ${machine.path} aka ${machine._id}`);
          this.emit('disconnect', machine);
        }
        else
        {
          attempts++;

          //Delay
          setTimeout(() =>
          {
            //Cleanup before reconnecting
            port.removeAllListeners();
            port.destroy();

            //Reconnect
            port = new serialport(machine.path, {baudRate: machine.baudRate});

            //Update machine
            this.machines.find(filter => filter._id == machine._id).port = port;

            //Re-register events
            registerEvents();
          }, delay);
        }
      };

      //Save for later
      this.machines.push({
        ...machine,
        port
      });
    });
  }

  /**
   * Send data to machine
   * @param {String} id Machine ID
   * @param {String} data Raw data to be sent to machine
   */
  send(id, data)
  {
    //Find machine
    const machine = this.machines.find(machine => id == machine._id);

    //Log
    logger.info(`Sending data to ${machine.path} aka ${id}`);

    //Send data
    machine.port.write(data);
  }
};