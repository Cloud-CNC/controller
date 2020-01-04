/**
 * @fileoverview Websocket Controller
 */

//Imports
const EventEmitter = require('events');
const ws = require('ws');

/**
 * @class Websocket Controller
 */
module.exports = class Websocket extends EventEmitter
{
  /**
   * @param {String} url Core server websocket url
   * @param {String} key Controller key
   * @param {Winston.Logger} logger Winston logger
   */
  constructor(url, key, logger)
  {
    //Instantiate event emitter
    super();

    //Store logger
    this.logger = logger;

    //Store URL
    this.url = url;

    //Connect to core
    this.socket = new ws(this.url, {
      headers: {
        key
      }
    });

    //Error event
    this.socket.on('error', error =>
    {
      this.logger.error(`Error ${error} occurred when connected to  ${this.url}`);
    });

    //Open event
    this.socket.on('open', () =>
    {
      this.emit('open');
    });

    //Message event
    this.socket.on('message', message =>
    {
      this.emit('command', message);
    });
  }

  /**
   * Bind controller to core server
   * @param {String} id Controller ID
   * @param {String} version Controller version
   */
  bind(id, version)
  {
    this.socket.send(JSON.stringify({
      event: 'bind',
      controller: {
        _id: id,
        version
      }
    }), error =>
    {
      if (error)
      {
        this.logger.error(`Error ${error} occurred when attempting to bind to core server located at ${this.url}`);
      }
      else
      {
        //Log
        this.logger.info(`Successfully bound to core server located at ${this.url}`);
      
        this.emit('bound');
      }
    });
  }
};