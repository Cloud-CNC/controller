/**
 * @fileoverview E2E Testing Cloud CNC Controller Config
 * This config file does NOT use sain defaults
 */

//Export
module.exports = {
  //Settings for this controller
  controller: {
    //Controller ID (Generated by the GUI)
    _id: process.env.CONTROLLER_ID,

    //Controller key directory (Generated by the GUI)
    key: process.env.CONTROLLER_KEY,

    //Logging settings
    logger: {
      //Logging directory (Only used when mode = file)
      directory: './logs/',

      //Logging mode (file = log to file, console = log to console, silent = don't log)
      mode: 'silent'
    },

    //Auto-reconnect settings
    reconnect: {
      //Serialport settings
      serial: {
        //Delay between detecting a disconnect and attempting to reconnect
        delay: 3000,

        //Maximum number of attempts to reconnect
        maximumAttempts: 10,

        //After reaching the maximum reconnect attempts, run the specified failsafe command for every machine
        failSafe: true
      },

      //Socket settings (The link between the core and this controller)
      socket: {
        //Delay between detecting a disconnect and attempting to reconnect
        delay: 3000,

        //Maximum number of attempts to reconnect
        maximumAttempts: 10
      }
    }
  },

  //Settings for connecting to the core
  core: {
    //TLS certificate (Used for trusting self signed certificates) (PEM encoded)
    cert: './config/cert.cer',

    //Self signed (Trust self signed certificates installed on the core server)
    selfSigned: true,

    //Websocket URL of core server (With URI scheme)
    url: 'wss://127.0.0.1'
  },
  
  //List of machines this controller should control
  machines: [
    {
      //The ID of the machine (Found on the website)
      _id: process.env.MACHINE_ID,

      //The command to execute if this controller cannot contact the core
      failsafe: 'M112\n',

      //The serial path or os-specific ID
      path: 'test-machine',

      //The serial connection baud rate
      baudRate: 0
    }
  ]
};