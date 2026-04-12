import pino, { type Logger, type LoggerOptions } from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type AppLogger = Logger;

export type LoggerBindings = {
  requestId?: string;
  traceId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  latency?: number;
};

export type CreateLoggerOptions = {
  serviceName: string;
  environment: string;
  level?: LogLevel;
  lokiUrl?: string;
  enablePretty?: boolean;
  enableLoki?: boolean;
};

export const getLoggerBindings = (bindings: LoggerBindings): LoggerBindings =>
  Object.fromEntries(Object.entries(bindings).filter(([, value]) => value !== undefined));

const createTransport = (options: CreateLoggerOptions) => {
  const targets: Array<{
    target: string;
    level?: LogLevel;
    options: Record<string, unknown>;
  }> = [];

  if (options.enablePretty) {
    targets.push({
      target: 'pino-pretty',
      level: options.level ?? 'info',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    });
  } else {
    targets.push({
      target: 'pino/file',
      options: {
        destination: 1,
      },
    });
  }

  if (options.enableLoki && options.lokiUrl) {
    targets.push({
      target: 'pino-loki',
      level: options.level ?? 'info',
      options: {
        host: options.lokiUrl,
        batching: true,
        interval: 5,
        labels: {
          service: options.serviceName,
          environment: options.environment,
        },
      },
    });
  }

  return pino.transport({ targets });
};

export const createLogger = (options: CreateLoggerOptions): Logger => {
  const loggerOptions: LoggerOptions = {
    level: options.level ?? 'info',
    name: options.serviceName,
    base: {
      service: options.serviceName,
      environment: options.environment,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    serializers: {
      err: pino.stdSerializers.err,
    },
  };

  return pino(loggerOptions, createTransport(options));
};
