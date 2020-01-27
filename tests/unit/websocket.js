/**
 * @fileoverview Websocket Controller Tests
 */

//Imports
const expect = require('chai').expect;
const logger = require('../../lib/logger');
const websocketController = require('../../lib/websocket');
const ws = require('ws');

//Mock core server
let server = new ws.Server({
  port: 80
});
server.on('connection', temp => socket = temp);

//Data
let controller;
let socket;

//Tests
module.exports = () =>
{
  it('should connect to core', done =>
  {
    controller = new websocketController('ws://127.0.0.1', '', '', 1, 2, logger);
    controller.once('open', () =>
    {
      done();
    });
  });

  it('should emit command event and respond', done =>
  {
    const payload = {
      event: 'command',
      _id: 'TESTING ID',
      machine: 'TESTING MACHINE',
      command: 'TESTING COMMAND'
    };

    socket.send(JSON.stringify(payload));

    controller.once('command', message =>
    {
      expect(message).to.be.eql(payload);
      done();
    });
  });

  it('should emit execute event and respond', done =>
  {
    const payload = {
      event: 'execute',
      _id: 'TESTING ID',
      machine: 'TESTING MACHINE',
      file: 'TESTING FILE'
    };

    socket.send(JSON.stringify(payload));

    controller.once('execute', message =>
    {
      expect(message).to.be.eql(payload);
      done();
    });
  });

  it('should reconnect', done =>
  {
    //Restart server
    controller.once('close', () =>
    {
      server = new ws.Server({
        port: 80
      });
    });

    //Reconnect
    controller.once('open', () =>
    {
      done();
    });
    
    server.close();
  });

  it('should emit disconnect', done =>
  {
    server.close();

    controller.on('error', () => null);

    controller.once('disconnect', () =>
    {
      done();
    });
  });
};