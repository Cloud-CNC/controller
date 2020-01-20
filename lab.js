/**
 * @fileoverview Serial Lab
 * Useful script to help you identify the correct path and baud rate of your machines
 */

//Imports
const readline = require('readline');
const serialport = require('serialport');

//Line reader
const linereader = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

//Get path and baud rate
linereader.question('Machine Path (ie: COM3): ', path =>
{
  linereader.question('Machine Baud Rate (ie: 250000): ', baudRate =>
  {
    //Connect to machine
    const port = new serialport(path, {
      baudRate: parseInt(baudRate)
    });

    //Loop
    function main()
    {
      linereader.question('[Type ".exit" to exit]> ', command =>
      {
        //Sentinel
        if (command == '.exit')
        {
          //Cleanup
          linereader.close();
          port.close();

          //Exit
          process.exit();
        }
        else
        {
          port.write(`${command}\n`, main);
        }
      });
    }

    //Events
    port.on('open', () =>
    {
      console.log('Opened!');
      main();
    });

    port.on('data', data =>
    {
      console.log(`> ${data}`);
    });

    port.on('error', err =>
    {
      console.error(err);
    });

    port.on('close', () =>
    {
      console.log('Closed!');
    });
  });
});