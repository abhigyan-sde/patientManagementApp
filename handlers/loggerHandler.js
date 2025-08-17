const { ipcMain } = require('electron')
const logger = require('../logger/logger');

module.exports = function registerLoggerHandler(){
    
    ipcMain.on('app-log', (event, logObj) => {
        const {level, message, meta} = logObj || {};

        if(!level || !message)
            return;

        switch(level.toLowerCase()){
            case 'info':
                logger.info(message, meta);
            case 'warn':
                logger.warn(message, meta);
            case 'error':
                logger.error(message, meta);
            default:
                logger.info(message, meta);
        }
    });
}