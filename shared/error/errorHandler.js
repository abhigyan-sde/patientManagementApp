"use strict";
const {logAppError} = require("../../logger/logger");

/**
 * Wraps and logs errors for backend (Electron/Node)
 * @param {*} error
 * @param {string} layer
 * @param {string} location
 * @param {string} message
 */
function wrapAppError(error, layer, location, message) {
    if (error?.layer)
        return error; // already wrapped
    const appError = {
        layer,
        location,
        message,
        timestamp: new Date().toISOString(),
        originalError: error
    };
    
    logAppError(error)
    return appError;
}

module.exports = {wrapAppError}
