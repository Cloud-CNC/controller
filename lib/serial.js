/**
 * @fileoverview Serial Controller
 */

//Imports
const EventEmitter = require('events');
const serialport = require('serialport');

/**
 * @class Serial Controller
 */
module.exports = class Serial extends EventEmitter
{
  /**
   * @param {Array<Object>} machines Array of machines
   * @param {Winston.Logger} logger Winston logger
   */
  constructor(machines, logger)
  {
    //Instantiate event emitter
    super();

    //Store logger
    this.logger = logger;

    //Array for storing machines
    this.machines = [];

    //Connect to each machine
    machines.forEach((machine, index) =>
    {
      const connection = new serialport(machine.path);

      this.logger.info(`Successfully connected to serial device at ${machine.path} aka ${machine._id}`);

      //Register data event
      connection.on('data', data =>
      {
        //Log
        this.logger.info(`Received ${data.length > 100 ? data.substring(0, 100) : data} from ${machine.path} aka ${machine._id}`);

        this.emit('data', {
          _id: machine._id,
          data
        });
      });

      //Register error event
      connection.on('error', error =>
      {
        //Log
        this.logger.error(`Error ${error} occurred at ${machine.path} aka ${machine._id}`);

        //Remove machine
        this.machines = this.machines.splice(index, 1);

        this.emit('error', {
          _id: machine._id,
          error
        });
      });

      //Save for later
      this.machines.push({
        _id: machine._id,
        connection
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
    this.logger.info(`Sending ${data.length > 100 ? data.substring(0, 100) : data} to ${machine.path} aka ${id}`);

    //Send data
    machine.connection.write(data);
  }
};