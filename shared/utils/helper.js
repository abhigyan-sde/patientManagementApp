function getFunctionName(depth = 2) {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    const callerLine = lines[depth];
    const match = callerLine && callerLine.match(/at (\S+)/);
    return match ? match[1] : 'anonymous';
}

module.exports = { getFunctionName };