/**
 * @fileoverview Cloud CNC Controller Config
 */

//Import
const fs = require('fs');

//Export
module.exports = {
  //Cryptography
  crypto: {
    //Key generated by the GUI
    key: fs.readFileSync('./crypto/key.txt', 'utf8')
  },
  //Core server information
  core: {
    //Websocket URL of core
    url: 'wss://127.0.0.1'
  },
  //Logging
  logging: {
    //Output directory (Only used in production)
    directory: './logs/'
  },
  //Connected machines
  machines: [
    {
      _id: '5e124b6036767727a837676d',
      enabled: false,
      path: 'COM3'
    }
  ],
  //Meta information
  meta: {
    //Controller ID
    _id: '5e124af936767727a837676c',

    //Auto-reconnect delay (ms)
    timeout: 3000
  }
};