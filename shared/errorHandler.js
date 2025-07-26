"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapAppError = wrapAppError;
function wrapAppError(error, layer, location, message) {
    if (error?.layer)
        return error; // already wrapped
    return {
        layer,
        location,
        message,
        timestamp: new Date().toISOString(),
        originalError: error
    };
}
