type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'test') return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data && Object.keys(data).length > 0 ? { data } : {}),
  };

  const output = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
  info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
};
