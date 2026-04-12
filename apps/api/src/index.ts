import { serve } from '@hono/node-server';
import { loadApiEnv } from '@acme/config';
import { createLogger } from '@acme/logger';
import { startObservability, stopObservability } from '@acme/observability';

import { createApp } from './app';

const env = loadApiEnv(process.env);
const bootstrapLogger = createLogger({
  serviceName: env.API_SERVICE_NAME,
  environment: env.NODE_ENV,
  level: env.API_LOG_LEVEL,
  lokiUrl: env.LOKI_URL,
  enablePretty: env.NODE_ENV !== 'production',
});

await startObservability({
  serviceName: env.API_SERVICE_NAME,
  environment: env.NODE_ENV,
  endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
});

const app = createApp({ env });

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    bootstrapLogger.info(
      {
        port: info.port,
      },
      'api server started',
    );
  },
);

const shutdown = async (signal: string) => {
  bootstrapLogger.info({ signal }, 'shutting down api server');
  server.close();
  await stopObservability();
  process.exit(0);
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
