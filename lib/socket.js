/**
 * @fileoverview Socket Controller
 */

//Imports
const config = require('config');
const {EventEmitter} = require('events');
const io = require('socket.io-client');
const logger = require('./logger');

/**
 * @class Socket Controller
 */
module.exports = class Socket extends EventEmitter
{
  /**
   * @param {String} url Core server websocket url
   * @param {String} id Controller ID
   * @param {String} key Controller key
   * @param {Number} delay Auto-reconnect delay (MS)
   * @param {Number} maximumAttempts Maximum number of attempts to reconnect to core
   * @param {Array<Object>} machines Array of machines
   */
  constructor(url, id, key, delay, maximumAttempts, machines)
  {
    //Instantiate event emitter
    super();

    //Store URL
    this.url = url;

    //Store machines
    this.machines = machines;

    //Connect to core
    this.socket = io.connect(this.url, {
      auth: {
        _id: id,
        key
      },
      reconnectionDelay: delay,
      reconnectionAttempts: maximumAttempts,
      rejectUnauthorized: !config.get('core.selfSigned')
    });

    //On socket connection
    this.socket.on('connect', () =>
    {
      logger.info(`Successfully connected to core server located at ${this.url}`);
      this.emit('connected');
    });

    //On socket connection error
    this.socket.on('connect_error', error =>
    {
      logger.error(`Received error ${error.message} while connecting to ${this.url}`);

      //Only re-emit event if there are listeners
      if (this.listeners('error').length > 0)
      {
        this.emit('error', error);
      }
    });

    //On socket error
    this.socket.on('error', error =>
    {
      logger.error(error);

      //Only re-emit event if there are listeners
      if (this.listeners('error').length > 0)
      {
        this.emit('error', error);
      }
    });

    //On socket disconnection
    this.socket.on('disconnect', () =>
    {
      //Log
      logger.info(`Disconnected from core server located at ${this.url}`);

      //Forward event
      this.emit('disconnect');
    });

    //On command
    this.socket.on('command', data =>
    {
      //Find machine
      const machine = this.machines.find(machine => data.machine == machine._id);

      //Security check
      if (machine == null)
      {
        logger.error(`Received "command" instruction for unknown machine ${data.id}`);
      }
      else
      {
        //Log
        logger.info(`Received "command" instruction for machine ${machine.path} aka ${machine._id}`);

        //Re-emit event (Prevent prototype pollution)
        this.emit('command', {
          machine: data.machine,
          payload: data.payload
        });
      }
    });

    //On execute
    this.socket.on('execute', data =>
    {
      //Find machine
      const machine = this.machines.find(machine => data.machine == machine._id);

      //Security check
      if (machine == null)
      {
        logger.error(`Received "execute" instruction for unknown machine ${data.id}`);
      }
      else
      {
        //Log
        logger.info(`Received "execute" instruction for machine ${machine.path} aka ${machine._id}`);

        //Re-emit event (Prevent prototype pollution)
        this.emit('execute', {
          machine: data.machine,
          payload: data.payload
        });
      }
    });
  }

  /**
   * Send output data to the core
   * @param {String} machine the machine ID
   * @param {ArrayBuffer} payload The binary data to forward
   */
  send(machine, payload)
  {
    //Send
    this.socket.emit('output', {
      machine,
      payload
    });
  }
};