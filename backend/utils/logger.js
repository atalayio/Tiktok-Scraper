const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      return `${timestamp} ${level.toUpperCase()}: ${message} ${stack || ''}`;
    })
  ),
  defaultMeta: { service: 'tiktok-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log') 
    }),
    
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    })
  ]
});

const fs = require('fs');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const customLogger = {
  error: (message) => logger.error(message),
  warn: (message) => logger.warn(message),
  info: (message) => logger.info(message),
  http: (message) => logger.http(message),
  verbose: (message) => logger.verbose(message),
  debug: (message) => logger.debug(message),
  
  log: (level, message) => {
    if (typeof logger[level] === 'function') {
      logger[level](message);
    } else {
      logger.info(message);
    }
  },
  
  success: (message) => logger.info(`✅ SUCCESS: ${message}`),
  
  request: (req) => {
    const { method, url, ip, headers } = req;
    logger.http(`Request: ${method} ${url} from ${ip} | User-Agent: ${headers['user-agent']}`);
  }
};

module.exports = customLogger;