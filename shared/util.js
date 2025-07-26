"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFunctionName = getFunctionName;
function getFunctionName(depth = 2) {
    const stack = new Error().stack;
    if (!stack)
        return 'unknown';
    const lines = stack.split('\n');
    const callerLine = lines[depth];
    const match = callerLine?.match(/at (\S+)/);
    return match?.[1] ?? 'anonymous';
}
