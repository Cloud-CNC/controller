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
   * @param {Number} delay Auto-reconnect delay
   * @param {Winston.Logger} logger Winston logger
   */
  constructor(url, key, delay, logger)
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

    //Event handlers
    const onOpen = () =>
    {
      this.logger.info(`Successfully connected to core server located at ${this.url}`);
      this.emit('open');
    };
    const onClose = () =>
    {
      //Delay
      setTimeout(() =>
      {
        //Cleanup before reconnecting
        this.socket.removeAllListeners();

        //Reconnect
        this.socket = new ws(this.url, {
          headers: {
            key
          }
        });

        //Re-register events
        registerEvents();
      }, delay);
    };
    const onMessage = message =>
    {
      message = JSON.parse(message);
      this.emit('command', message);
    };
    const onError = error =>
    {
      this.logger.error(`${error} occurred when connected to ${this.url}`);
    };

    //Register events
    const registerEvents = () =>
    {
      this.socket.on('open', onOpen);
      this.socket.on('close', onClose);
      this.socket.on('message', onMessage);
      this.socket.on('error', onError);
    };
    registerEvents();
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
        this.logger.error(`${error} occurred when attempting to bind to core server located at ${this.url}`);
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