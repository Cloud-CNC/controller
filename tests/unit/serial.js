/**
 * @fileoverview Serial Controller Tests
 */

//Imports
const expect = require('chai').expect;
const logger = require('../../lib/logger');
const mockBinding = require('@serialport/binding-mock');
const serialController = require('../../lib/serial');

//Data
let controller;
let port;

//Debugging prototype methods
serialController.prototype.getPort = function()
{
  return this.machines[0].port;
};

//Tests
module.exports = () =>
{
  it('should connect to machine', done =>
  {
    //Create mock serial port
    mockBinding.createPort('COM0', {echo: true});

    //New controller
    controller = new serialController([
      {
        _id: '5e152b0e67ea760af01b9fd5',
        failsafe: 'M112\n',
        path: 'COM0',
        baudRate: 250000
      }
    ], 1, 2, logger);

    //Get serial port
    port = controller.getPort();

    controller.once('open', () =>
    {
      done();
    });
  });

  it('should emit data event', done =>
  {
    const payload = 'TESTING-PAYLOAD';
    controller.send('5e152b0e67ea760af01b9fd5', payload);

    controller.once('data', res =>
    {
      expect(res).to.be.eql({
        _id: '5e152b0e67ea760af01b9fd5',
        data: payload
      });

      done();
    });
  });

  it('should reconnect', done =>
  {
    //Restart server
    controller.once('close', () =>
    {
      mockBinding.createPort('COM0', {echo: true});
    });

    //Confirm reconnect
    controller.once('open', () =>
    {
      done();

      //Get reopened port
      port = controller.getPort();
    });

    //Disconnect
    port.close();
  });
};