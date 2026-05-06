const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

type LogLevelKey = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

interface LogEntry {
  level: LogLevelKey;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const logQueue: LogEntry[] = [];
const MAX_LOG_QUEUE_SIZE = 100;

const createLogEntry = (
  level: LogLevelKey,
  message: string,
  context?: Record<string, unknown>
): LogEntry => ({
  level,
  message,
  context,
  timestamp: new Date().toISOString(),
});

const shouldLog = (level: LogLevelKey): boolean => {
  if (isDevelopment) return true;
  
  return level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN;
};

const formatLog = (entry: LogEntry): string => {
  const { level, message, context, timestamp } = entry;
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

const sendToErrorTracker = (entry: LogEntry): void => {
  if (entry.level === LOG_LEVELS.ERROR) {
    logQueue.push(entry);
    if (logQueue.length > MAX_LOG_QUEUE_SIZE) {
      logQueue.shift();
    }
  }
};

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(formatLog(createLogEntry(LOG_LEVELS.DEBUG, message, context)));
    }
  },

  info: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.info(formatLog(createLogEntry(LOG_LEVELS.INFO, message, context)));
    }
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn(formatLog(createLogEntry(LOG_LEVELS.WARN, message, context)));
      sendToErrorTracker(createLogEntry(LOG_LEVELS.WARN, message, context));
    }
  },

  error: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error(formatLog(createLogEntry(LOG_LEVELS.ERROR, message, context)));
      sendToErrorTracker(createLogEntry(LOG_LEVELS.ERROR, message, context));
    }
  },

  apiError: (errorDetails: {
    statusCode?: number;
    url?: string;
    message?: string;
    data?: unknown;
  }) => {
    const { statusCode, url, message, data } = errorDetails;
    const context: Record<string, unknown> = { statusCode, url, data };
    
    if (shouldLog(LOG_LEVELS.ERROR)) {
      const logEntry = createLogEntry(
        LOG_LEVELS.ERROR,
        `API Error${statusCode ? ` [${statusCode}]` : ''}: ${message || 'Unknown error'}`,
        context
      );
      
      if (isProduction) {
        sendToErrorTracker(logEntry);
      }
      
      console.error(formatLog(logEntry));
    }
  },

  getErrorLogs: (): LogEntry[] => {
    return [...logQueue];
  },

  clearErrorLogs: (): void => {
    logQueue.length = 0;
  },
};

export default logger;