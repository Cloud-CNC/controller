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
  /**
   * List available ports
   * @returns {Array<Object>}
   */
  static async list()
  {
    return state.pipes;
  }

  /**
   * @param {Object} options Port options
   */
  constructor(options)
  {
    super(options);

    //Number of connected clients
    this.clients = 0;

    //Buffers
    this.rx = Buffer.alloc(0);

    logger.info('Using IPC SerialPort binding (If you\'re not running E2E tests, something is wrong!)');
  }

  /**
   * Open the port
   * @param {string} path 
   * @param {Object} options 
   * @returns {Promise<void>}
   */
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

    //Read handler
    this.ipc.server.on('message', data =>
    {
      //Convert to buffer
      data = Buffer.from(data);

      //Append to the port's buffer
      this.rx = Buffer.concat([this.rx, data]);

      //Trigger the read
      this.triggerRead();
    });

    //Ready data
    this.rx = Buffer.concat([this.rx, Buffer.from('READY')]);

    //Required by the abstract binding
    this.isOpen = true;

    logger.info(`Started IPC server for ${path}`);
  }

  /**
   * Close the port
   * @returns {Promise<void>}
   */
  async close()
  {
    await super.close();

    //Close IPC server
    this.ipc.server.stop();

    logger.info('Stopped IPC server');
  }

  /**
   * Read part of the port's internal buffer
   * @param {Buffer} buffer The buffer to copy to
   * @param {Number} offset The offset to copy data into the buffer at
   * @param {Number} length The length of the data to copy into the buffer
   * @returns {Number} The bytes read
   */
  async read(buffer, offset, length)
  {
    await super.read(buffer, offset, length);

    //If theirs no data, return recursively
    if (this.rx.length == 0)
    {
      return new Promise((resolve, reject) =>
      {
        //This function is called by the IPC 'message' event handler
        this.triggerRead = () =>
        {
          this.read(buffer, offset, length).then(resolve, reject);
        };
      });
    }
    //When theirs data, return normally (SerialPort will call read again)
    else
    {
      //Splice the port's data into the provided buffer (May overwrite (some) existing data)
      const bytesRead = this.rx.copy(buffer, offset);

      //"Pop" the Rx buffer
      this.rx = this.rx.slice(length);

      return {
        bytesRead,
        buffer
      };
    }
  }

  /**
   * Write buffer to the port
   * @param {Buffer} buffer 
   * @returns {Promise<void>}
   */
  async write(buffer)
  {
    await super.write(buffer);

    this.ipc.server.broadcast('message', buffer);
  }

  /**
   * Update options
   * @param {Object} options 
   * @returns {Promise<void>}
   */
  async update(options)
  {
    await super.update(options);

    this.baudRate = options.baudRate || 9600;
  }

  /**
   * Set flags
   * @param {Object} options 
   * @returns {Promise<void>}
   */
  async set(options)
  {
    await super.set(options);
  }

  /**
   * Get flags
   * @returns {Promise<{cts: boolean, dsr: boolean, dcd: boolean}>}
   */
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

  /**
   * Get the baud rate
   * @returns {Promise<Number>}
   */
  async getBaudRate()
  {
    await super.getBaudRate();

    return {
      baudRate: this.baudRate
    };
  }

  /**
   * Flush all data written but not sent, and received but not read
   * @returns {Promise<void>}
   */
  async flush()
  {
    await super.flush();

    this.rx = Buffer.alloc(0);
  }

  /**
   * Wait for all in-progress operations to finish then return
   * @returns {Promise<void>}
   */
  async drain()
  {
    await super.drain();
  }
};