/**
 * @fileoverview Serial Controller
 */

//Imports
const EventEmitter = require('events');
const ipcBinding = require('./ipcBinding');
const logger = require('./logger');
const mockBinding = require('@serialport/binding-mock');
const serialport = require('serialport');

//Serialport bindings
if (process.env.E2E == 'true')
{
  serialport.Binding = ipcBinding;
}
else
{
  serialport.Binding = mockBinding;
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
   * @param {Winston.Logger} logger Winston logger
   */
  constructor(machines, delay, maximumAttempts, logger)
  {
    //Instantiate event emitter
    super();

    //Store logger
    logger = logger;

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
        logger.info(`Successfully connected to serial machine at ${machine.path} aka ${machine._id}`);
        this.emit('open');
      };

      const onClose = () =>
      {
        logger.info(`Disconnected from machine at ${machine.path} aka ${machine._id}`);
        this.emit('close');

        //Reconnect
        reconnect();
      };

      const onData = data =>
      {
        data = data.toString();

        //Log
        logger.info(`Received data from ${machine.path} aka ${machine._id}`);

        this.emit('data', {
          _id: machine._id,
          data
        });
      };

      const onError = error =>
      {
        logger.error(`${error} occurred at ${machine.path} aka ${machine._id}`);
        this.emit('error', error);

        //If error is due to a missing machine, retry
        if (/File not found/.test(error.message))
        {
          reconnect();
        }
        else
        {
          //Remove machine
          this.machines = this.machines.splice(index, 1);

          this.emit('error', {
            _id: machine._id,
            error
          });
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
        if (maximumAttempts != -1 && attempts >= maximumAttempts)
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
    //Return promise
    return new Promise((resolve, reject) =>
    {
      //Find machine
      const machine = this.machines.find(machine => id == machine._id);

      //Log
      logger.info(`Sending data to ${machine.path} aka ${id}`);

      //Send data
      machine.port.write(data);

      //Await response
      machine.port.on('data', data =>
      {
        //Convert from buffer to string
        data = data.toString();

        //Log
        logger.info(`Received data from ${machine.path} aka ${machine._id}`);

        //Resolve
        resolve(data);
      });
    });
  }
};