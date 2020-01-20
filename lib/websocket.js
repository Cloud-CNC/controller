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
   * @param {String} id Controller ID
   * @param {String} key Controller key
   * @param {Number} delay Auto-reconnect delay (MS)
   * @param {Winston.Logger} logger Winston logger
   */
  constructor(url, id, key, delay, logger)
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
        _id: id,
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
      this.logger.info(`Disconnected from core server located at ${this.url}`);

      //Reconnect
      reconnect();
    };

    const onMessage = message =>
    {
      message = JSON.parse(message);

      switch (message.event)
      {
        //Command (Short GCODE)
        case 'command': {
          this.emit('command', message, response =>
          {
            this.socket.send(JSON.stringify({
              _id: message._id,
              event: 'response:command',
              machine: message.machine,
              response
            }));
          });
          break;
        }

        //Execute (Long GCODE)
        case 'execute': {
          this.emit('execute', message, success =>
          {
            this.socket.send(JSON.stringify({
              _id: message._id,
              event: 'response:execute',
              machine: message.machine,
              success
            }));
          });
          break;
        }
      }
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

    //Reconnect
    const reconnect = () =>
    {
      //Delay
      setTimeout(() =>
      {
        //Cleanup before reconnecting
        this.socket.removeAllListeners();

        //Reconnect
        this.socket = new ws(this.url, {
          headers: {
            _id: id,
            key
          }
        });

        //Re-register events
        registerEvents();
      }, delay);
    };
  }
};