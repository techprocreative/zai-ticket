type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    }

    if (this.isDevelopment) {
      // Pretty print for development
      console[level === 'debug' ? 'log' : level](
        `[${timestamp}] ${level.toUpperCase()}: ${message}`,
        context || ''
      )
    } else {
      // JSON for production (can be sent to log aggregator)
      console.log(JSON.stringify(logEntry))
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    })
  }

  // Auth-specific helpers
  authSuccess(userId: string, email: string) {
    this.info('Authentication successful', { userId, email })
  }

  authFailure(email: string, reason: string) {
    this.warn('Authentication failed', { email, reason })
  }

  apiRequest(method: string, path: string, userId?: string) {
    this.debug('API request', { method, path, userId })
  }
}

export const logger = new Logger()
