/**
 * @fileoverview Websocket Controller
 */

//Imports
const config = require('config');
const EventEmitter = require('events');
const logger = require('./logger');
const syswideCA = require('syswide-cas');
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
   * @param {Number} maximumAttempts Maximum number of attempts to reconnect to core
   */
  constructor(url, id, key, delay, maximumAttempts)
  {
    //Instantiate event emitter
    super();

    //Store URL
    this.url = url;

    //Attempt counter
    let attempts = 0;

    //Self signed certificate
    if (config.get('core.selfSigned'))
    {
      syswideCA.addCAs(config.get('core.cert'));
    }

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
      attempts = 0;
      logger.info(`Successfully connected to core server located at ${this.url}`);
      this.emit('open');
    };

    const onClose = () =>
    {
      logger.info(`Disconnected from core server located at ${this.url}`);
      this.emit('close');

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
      logger.error(`${error} occurred when connecting to ${this.url}`);
      this.emit('error', error);
    };

    //Register events
    const registerEvents = () =>
    {
      this.socket.once('open', onOpen);
      this.socket.once('close', onClose);
      this.socket.on('message', onMessage);
      this.socket.on('error', onError);
    };
    registerEvents();

    //Reconnect
    const reconnect = () =>
    {
      if (maximumAttempts != -1 && attempts >= maximumAttempts)
      {
        logger.error(`Reached maximum attempts when connecting to ${this.url}`);
        this.emit('disconnect');
      }
      else
      {
        attempts++;

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
      }
    };
  }
};