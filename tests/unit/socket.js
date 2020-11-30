/**
 * @fileoverview Socket Controller Tests
 */

//Imports
const expect = require('chai').expect;
const io = require('socket.io');
const logger = require('../../lib/logger');
const socketController = require('../../lib/socket');

//Data
let controller;
let socket;

//Mock core server
let server = new io.Server(80);
server.once('connection', temp => socket = temp);

//Tests
module.exports = () =>
{
  it('should connect to core', done =>
  {
    controller = new socketController('http://127.0.0.1', '', '', 1, 2, [
      {
        _id: 'TESTING MACHINE'
      }
    ]);
    controller.once('connected', () =>
    {
      done();
    });
  });

  it('should emit command event and respond', done =>
  {
    const payload = {
      machine: 'TESTING MACHINE',
      payload: 'TEST PAYLOAD'
    };

    socket.emit('command', payload);

    controller.once('command', data =>
    {
      expect(data).to.be.eql(payload);
      done();
    });
  });

  it('should emit execute event and respond', done =>
  {
    const payload = {
      machine: 'TESTING MACHINE',
      payload: 'TEST PAYLOAD'
    };

    socket.emit('execute', payload);

    controller.once('execute', data =>
    {
      expect(data).to.be.eql(payload);
      done();
    });
  });

  it('should reconnect', done =>
  {
    //Restart server
    controller.once('disconnect', () =>
    {
      server = new io.Server(80);
    });

    //Confirm reconnect
    controller.once('connected', () =>
    {
      done();
    });

    //Disconnect
    server.close();
  });

  it('should emit disconnect event', done =>
  {
    //Confirm disconnect
    controller.once('disconnect', () =>
    {
      done();
    });

    //Disconnect
    server.close();
  });
};