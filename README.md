# Controller
![status](https://img.shields.io/badge/status-under%20development-yellow)
[![issues](https://img.shields.io/github/issues/Cloud-CNC/controller)](https://github.com/Cloud-CNC/core/issues)
[![last commit](https://img.shields.io/github/last-commit/Cloud-CNC/controller)](https://github.com/Cloud-CNC/core/commits/master)
[![chat](https://img.shields.io/discord/637861853674078218)](https://discord.gg/s7aR5eb)

This repository contains all files for running a controller. Controller(s) are typically ran on computers with close proximity to the CNC machines.

## Installation
1. Setup a [core](https://github.com/cloud-cnc/core) server instance
2. Create the controller entry via the web GUI to get a controller ID + key.
3. Install dependencies via running `npm i`
4. Modify the [config file](config.js) to add the ID + key and to customize your controller
5. Run `npm start` to start the controller
6. If you need any additional help, feel free to ask in the Discord server 

## Development

### NPM Scripts
Name | Description
--- | ---
`start` | Run controller
`test` | Run eslint on everything