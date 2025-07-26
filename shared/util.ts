export function getFunctionName(depth: number = 2): string {
  const stack = new Error().stack;
  if (!stack) return 'unknown';

  const lines = stack.split('\n');
  const callerLine = lines[depth];

  const match = callerLine?.match(/at (\S+)/);
  return match?.[1] ?? 'anonymous';
}
