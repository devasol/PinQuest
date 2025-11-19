const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',      // Error
  yellow: '\x1b[33m',   // Warning  
  green: '\x1b[32m',    // Success/Info
  blue: '\x1b[34m',     // Debug
  gray: '\x1b[90m',     // Trace
  cyan: '\x1b[36m',     // Special info
};

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

class Logger {
  constructor(level = 'INFO') {
    this.level = logLevels[level] || logLevels.INFO;
  }

  _log(level, levelNum, message, meta = {}) {
    if (levelNum > this.level) return;

    const timestamp = new Date().toISOString();
    const levelColor = colors[level.toLowerCase()] || colors.reset;
    const reset = colors.reset;

    // Create log message with timestamp, level and message
    const logMsg = `${levelColor}[${level} ${timestamp}]${reset} ${message}`;
    
    // Add metadata if provided
    if (Object.keys(meta).length > 0) {
      console.log(logMsg, meta);
    } else {
      console.log(logMsg);
    }
  }

  error(message, meta = {}) {
    this._log('ERROR', logLevels.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this._log('WARN', logLevels.WARN, message, meta);
  }

  info(message, meta = {}) {
    this._log('INFO', logLevels.INFO, message, meta);
  }

  debug(message, meta = {}) {
    this._log('DEBUG', logLevels.DEBUG, message, meta);
  }

  trace(message, meta = {}) {
    this._log('TRACE', logLevels.TRACE, message, meta);
  }
}

module.exports = new Logger(process.env.LOG_LEVEL || 'INFO');