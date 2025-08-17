const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let APP_LOGS_PATH = null;     
let context = {};    // log context    

function initLogger(appLogsPath) {
  APP_LOGS_PATH = appLogsPath;
  // Create the logs directory if we’re running packaged (we only write files in prod)
  if (app.isPackaged) {
    fs.mkdirSync(APP_LOGS_PATH, { recursive: true });
  }
  return module.exports; // allow chaining if you like
}

function setContext(extra) {
  context = { ...context, ...extra };
}

function getDailyLogFile() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (!APP_LOGS_PATH) {
    // In dev we only log to console, but in prod this must be set.
    if (app.isPackaged) {
      throw new Error('initLogger(appLogsPath) must be called before logging in production.');
    }
    return null;
  }
  return path.join(APP_LOGS_PATH, `${today}.log`);
}

function safeMeta(meta) {
  try {
    return JSON.parse(
      JSON.stringify(meta, (k, v) => {
        if (v instanceof Error) {
          return { name: v.name, message: v.message, stack: v.stack };
        }
        return v;
      })
    );
  } catch {
    // Circular or unserializable; fall back to string
    return { value: String(meta) };
  }
}

function formatLine(level, message, meta) {
  const base = {
    ts: new Date().toISOString(),
    level,
    message: message != null ? String(message) : '',
    pid: process.pid,
    packaged: app.isPackaged,
    ...context,
  };
  const withMeta = meta ? { ...base, meta: safeMeta(meta) } : base;
  return JSON.stringify(withMeta) + '\n'; // JSONL (one JSON per line)
}

function write(line) {
  if (app.isPackaged) {
    const file = getDailyLogFile();
    fs.appendFileSync(file, line, 'utf8');
  } else {
    // Dev: mirror to console instead of file
    const obj = JSON.parse(line);
    // Keep dev output readable
    // eslint-disable-next-line no-console
    console[obj.level === 'error' ? 'error' : obj.level === 'warn' ? 'warn' : 'log'](obj);
  }
}

function log(level, message, meta) {
  write(formatLine(level, message, meta));
}

function info(message, meta) { log('info', message, meta); }
function warn(message, meta) { log('warn', message, meta); }
function error(message, meta) { log('error', message, meta); }

/**
 * Helper to log structured AppError (from wrapAppError)
 * Accepts the AppError object directly.
 */
function logAppError(appError) {
  error(appError?.message || 'AppError', appError);
}

/**
 * (Optional) Redirect Node console to logger in production.
 * Call once after initLogger() if you want automatic console capture.
 */
function interceptConsoleInProduction() {
  if (!app.isPackaged) return;
  const orig = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  console.log = (...args) => info(args.map(String).join(' '));
  console.warn = (...args) => warn(args.map(String).join(' '));
  console.error = (...args) => error(args.map(String).join(' '));
  return () => { // undo
    console.log = orig.log;
    console.warn = orig.warn;
    console.error = orig.error;
  };
}

function getCurrentLogFilePath() {
  return app.isPackaged ? getDailyLogFile() : null;
}

module.exports = {
  initLogger,
  setContext,
  info,
  warn,
  error,
  logAppError,
  interceptConsoleInProduction,
  getCurrentLogFilePath,
};
