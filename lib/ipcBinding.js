/**
 * @fileoverview Serialport IPC (Pipe) Binding
 * Useful for testing serialport functionality
 * 
 * Data Flow:
 * DTE (Serial Controller) <---> DCE (This file) <---> DCE (E2E IPC controller) <---> DTE (E2E test file)
 * See https://en.wikipedia.org/wiki/RS-232 for more information
 * See http://www.acumeninstruments.com/Support/documentation/SerialPortBasics/index_pg5.shtml for the difference between RTS/CTS and DTR/DSR
 */

//Imports
const {IPC} = require('node-ipc');
const AbstractBinding = require('@serialport/binding-abstract');
const logger = require('./logger');

//Inter-pipe state
const state = {
  pipes: [],
  serialNumber: 0
};

//Export
module.exports = class IpcBinding extends AbstractBinding
{
  static async list()
  {
    return state.pipes;
  }

  constructor(options)
  {
    super(options);

    //Number of connected clients
    this.clients = 0;

    logger.info('Using IPC SerialPort binding (If you\'re not running E2E tests, something is wrong!)');
  }

  async open(path, options)
  {
    await super.open(path, options);

    //Add to state
    state.pipes.push({
      path,
      manufacturer: 'Cloud CNC E2E Tests',
      serialNumber: state.serialNumber++,
    });

    //Start IPC server
    this.ipc = new IPC();

    this.ipc.config.appspace = 'cloud-cnc-e2e-tests';
    this.ipc.config.id = `/${path}`;
    this.ipc.config.silent = true;

    this.ipc.serve();
    this.ipc.server.start();

    //Manage client connections
    this.ipc.server.on('connect', () =>
    {
      this.clients++;
    });
    this.ipc.server.on('disconnect', () =>
    {
      this.clients--;
    });

    //Required by the abstract binding
    this.isOpen = true;

    logger.info(`Started IPC server for ${path}`);
  }

  async close()
  {
    await super.close();

    //Close IPC server
    this.ipc.server.stop();

    logger.info('Stopped IPC server');
  }

  async read(buffer, offset, length)
  {
    await super.read(buffer, offset, length);

    return new Promise(resolve => this.ipc.server.on('res', data =>
    {
      //Convert to buffer
      data = Buffer.from(data);

      //Splice buffers (May overwrite (some) existing data)
      const bytes = splice(buffer, data, offset, length);

      resolve({
        bytesRead: bytes.length,
        buffer: bytes
      });
    }));
  }

  async write(buffer)
  {
    await super.write(buffer);

    this.ipc.server.broadcast('message', buffer);
  }

  async update(options)
  {
    await super.update(options);

    this.baudRate = options.baudRate || 9600;
  }

  async set(options)
  {
    await super.set(options);
  }

  async get()
  {
    await super.get();

    return {
      //Clear To Send (The send buffer is empty)
      cts: true,

      //Data Set Ready (Similar to CTS, typically used for 'major' events)
      dsr: false,

      //Data Carrier Detect (The IPC server has at least one client)
      dcd: this.clients > 0
    };
  }

  async getBaudRate()
  {
    await super.getBaudRate();

    return {
      baudRate: this.baudRate
    };
  }

  async flush()
  {
    await super.flush();
  }

  async drain()
  {
    await super.drain();
  }
};

/**
 * Splice `b` into `a` at a given offset for a given length
 * @param {Buffer} a 
 * @param {Buffer} b 
 * @param {Number} offset 
 * @param {Number} length 
 */
const splice = (a, b, offset, length) =>
{
  //Parameter validation
  if (offset < 0)
  {
    throw new Error('Specified offset is negative, indexes are always non-negative!');
  }
  else
  {
    //Concatenate
    const buffer = Buffer.concat([
      a.slice(0, offset),
      b,
      a.slice(offset)
    ]);

    //Truncate to length
    return buffer.slice(0, length);
  }
};