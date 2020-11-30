# Controller
![status](https://img.shields.io/badge/status-under%20development-yellow)
[![tests](https://img.shields.io/github/workflow/status/Cloud-CNC/controller/tests?label=tests)](https://github.com/Cloud-CNC/controller/actions)
[![issues](https://img.shields.io/github/issues/Cloud-CNC/controller)](https://github.com/Cloud-CNC/controller/issues)
[![last commit](https://img.shields.io/github/last-commit/Cloud-CNC/controller)](https://github.com/Cloud-CNC/controller/commits/master)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FCloud-CNC%2Fcontroller.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FCloud-CNC%2Fcontroller?ref=badge_shield)

## Production

View guides, documentation and more at [cloud-cnc.github.io](https://cloud-cnc.github.io)

## Development

*Note: This repository contains all files for running a controller. Controller(s) are typically ran on computers with close proximity to the CNC machines.*

### Installation
1. Setup a [core](https://github.com/cloud-cnc/core) server instance
2. Create the controller entry via the web GUI to get a controller ID + key.
3. Install dependencies via running `npm i`
4. Modify the config file ([default.js](config/default.js)) to add the ID + key and to customize your controller
5. Run `npm start` to start the controller
6. If you need any additional help, feel free to ask in the [Spectrum channel](https://spectrum.chat/cloud-cnc/controller)

## Development

### NPM Scripts
Name | Description
--- | ---
`coverage` | Run all unit tests and generate coverage reports
`lint` | Lint everything with ES Lint
`start` | Start the controller in production mode
`start:development` | Start the controller in development mode - uses [mock serialport bindings](https://serialport.io/docs/api-binding-mock), logs to console
`start:e2e` | Start the controller in E2E testing mode - uses [IPC serialport bindings](./lib/ipcBinding.js), disables logging
`start:unit` | Start the controller in unit testing mode - disables logging
`test` | Run all unit tests

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FCloud-CNC%2Fcontroller.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FCloud-CNC%2Fcontroller?ref=badge_large)