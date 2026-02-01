/**
 * Structured logging for observability
 * Can be extended to send logs to external services (DataDog, CloudWatch, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  requestId?: string
  duration?: number
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Minimum log level from environment
const MIN_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'info'

class Logger {
  private serviceName: string

  constructor(serviceName: string = 'carolina-crm') {
    this.serviceName = serviceName
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL]
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: this.serviceName,
        ...context
      }
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return

    const entry = this.formatEntry(level, message, context)

    // In production, output as JSON for log aggregation
    if (process.env.NODE_ENV === 'production') {
      const output = JSON.stringify(entry)
      if (level === 'error') {
        console.error(output)
      } else if (level === 'warn') {
        console.warn(output)
      } else {
        console.log(output)
      }
    } else {
      // In development, use readable format
      const contextStr = context ? ` ${JSON.stringify(context)}` : ''
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`
      if (level === 'error') {
        console.error(`${prefix} ${message}${contextStr}`)
      } else if (level === 'warn') {
        console.warn(`${prefix} ${message}${contextStr}`)
      } else {
        console.log(`${prefix} ${message}${contextStr}`)
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context)
  }

  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context)
  }

  /**
   * Log API request
   */
  apiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    this.log(level, `${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
      userId
    })
  }

  /**
   * Log database query
   */
  dbQuery(operation: string, model: string, duration: number): void {
    this.debug(`DB ${operation} ${model}`, { operation, model, duration })
  }

  /**
   * Log error with stack trace
   */
  logError(error: Error, context?: LogContext): void {
    this.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name
    })
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...context })
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, { ...this.context, ...context })
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...context })
  }

  error(message: string, context?: LogContext): void {
    this.parent.error(message, { ...this.context, ...context })
  }
}

// Singleton instance
export const logger = new Logger()

/**
 * Request timing utility
 */
export function createTimer(): { elapsed: () => number } {
  const start = Date.now()
  return {
    elapsed: () => Date.now() - start
  }
}
