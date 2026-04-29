import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FALLBACK_PACKAGE_NAME,
  removeJobs,
  removeObservability,
  removeSkillsLock,
  toSlug,
} from './scaffold.js';

const writeProjectFile = (targetDir: string, relativePath: string, content: string): void => {
  const filePath = join(targetDir, ...relativePath.split('/'));
  mkdirSync(join(filePath, '..'), { recursive: true });
  writeFileSync(filePath, content);
};

describe('toSlug', () => {
  it('lowercases uppercase input', () => {
    expect(toSlug('MyApp')).toBe('myapp');
  });

  it('replaces spaces with dashes', () => {
    expect(toSlug('my app')).toBe('my-app');
  });

  it('strips leading dashes', () => {
    expect(toSlug('-my-app')).toBe('my-app');
  });

  it('strips trailing dashes', () => {
    expect(toSlug('my-app-')).toBe('my-app');
  });

  it('collapses multiple consecutive dashes', () => {
    expect(toSlug('my--app')).toBe('my-app');
  });

  it('replaces special characters with dashes and collapses them', () => {
    expect(toSlug('my@app!')).toBe('my-app');
  });

  it('handles mixed case, spaces, and special chars together', () => {
    expect(toSlug('  My Awesome App!  ')).toBe('my-awesome-app');
  });

  it('returns the fallback for an empty string', () => {
    expect(toSlug('')).toBe(FALLBACK_PACKAGE_NAME);
  });

  it('returns the fallback for a whitespace-only string', () => {
    expect(toSlug('   ')).toBe(FALLBACK_PACKAGE_NAME);
  });

  it('returns the fallback for a string of only special chars', () => {
    expect(toSlug('!!!@@@')).toBe(FALLBACK_PACKAGE_NAME);
  });

  it('preserves existing valid slugs unchanged', () => {
    expect(toSlug('my-acme-app')).toBe('my-acme-app');
  });

  it('handles numbers in input', () => {
    expect(toSlug('app2024')).toBe('app2024');
  });

  it('removes observability infra, package references, and local env defaults', () => {
    const targetDir = join(tmpdir(), `acme-scaffold-${crypto.randomUUID()}`);
    const rootEnvExamplePath = join(targetDir, '.env.example');
    const apiEnvExamplePath = join(targetDir, 'apps', 'api', '.env.example');

    mkdirSync(join(targetDir, 'infra', 'observability'), { recursive: true });
    mkdirSync(join(targetDir, 'packages', 'observability'), { recursive: true });
    mkdirSync(join(targetDir, 'apps', 'api'), { recursive: true });
    writeProjectFile(
      targetDir,
      'apps/api/package.json',
      JSON.stringify({
        dependencies: {
          '@acme/observability': 'workspace:*',
          '@opentelemetry/api': '^1.9.0',
          hono: '^4.0.0',
        },
      }),
    );
    writeFileSync(
      rootEnvExamplePath,
      [
        'OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318',
        'LOKI_URL=http://localhost:3100',
        'API_LOG_TO_LOKI=true',
        'DATABASE_URL=postgres://postgres:postgres@localhost:5433/acme_platform',
      ].join('\n'),
    );
    writeFileSync(
      apiEnvExamplePath,
      [
        'OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318',
        'LOKI_URL=http://localhost:3100',
        'API_LOG_TO_LOKI=true',
        'DATABASE_URL=postgres://postgres:postgres@localhost:5433/acme_platform',
      ].join('\n'),
    );
    writeProjectFile(
      targetDir,
      'docker-compose.yml',
      [
        'services:',
        '  postgres:',
        '    image: postgres:17.4-alpine',
        '  loki:',
        '    image: grafana/loki:3.4.2',
        '  grafana:',
        '    image: grafana/grafana:12.1.1',
        'volumes:',
        '  postgres-data:',
        '  grafana-data:',
      ].join('\n'),
    );
    writeProjectFile(
      targetDir,
      'turbo.json',
      JSON.stringify({
        globalEnv: ['DATABASE_URL', 'OTEL_EXPORTER_OTLP_ENDPOINT', 'LOKI_URL', 'API_LOG_TO_LOKI'],
        tasks: {},
      }),
    );
    writeProjectFile(
      targetDir,
      'apps/api/src/middleware/auth-context.ts',
      [
        "import { trace } from '@opentelemetry/api';",
        'trace.getActiveSpan()?.setAttributes({});',
      ].join('\n'),
    );
    writeProjectFile(
      targetDir,
      'apps/api/src/services/health-service.ts',
      [
        'const checks = {',
        '        observability: {',
        "          status: this.env.OTEL_EXPORTER_OTLP_ENDPOINT ? 'up' : 'degraded',",
        '          detail: this.env.OTEL_EXPORTER_OTLP_ENDPOINT',
        "            ? 'OTLP trace exporter configured'",
        "            : 'OTLP trace exporter missing',",
        '        },',
        '};',
      ].join('\n'),
    );
    writeProjectFile(targetDir, 'pnpm-lock.yaml', 'lockfileVersion: 9.0\n');

    try {
      removeObservability(targetDir);

      expect(existsSync(join(targetDir, 'infra', 'observability'))).toBe(false);
      expect(existsSync(join(targetDir, 'packages', 'observability'))).toBe(false);
      expect(existsSync(join(targetDir, 'pnpm-lock.yaml'))).toBe(false);
      expect(readFileSync(rootEnvExamplePath, 'utf8')).not.toContain('OTEL_EXPORTER_OTLP_ENDPOINT');
      expect(readFileSync(rootEnvExamplePath, 'utf8')).not.toContain('http://localhost:4318');
      expect(readFileSync(apiEnvExamplePath, 'utf8')).not.toContain('LOKI_URL');
      expect(readFileSync(apiEnvExamplePath, 'utf8')).not.toContain('API_LOG_TO_LOKI');
      expect(readFileSync(join(targetDir, 'docker-compose.yml'), 'utf8')).not.toContain('loki:');
      expect(readFileSync(join(targetDir, 'docker-compose.yml'), 'utf8')).not.toContain(
        'grafana-data:',
      );
      expect(readFileSync(join(targetDir, 'turbo.json'), 'utf8')).not.toContain(
        'OTEL_EXPORTER_OTLP_ENDPOINT',
      );
      expect(readFileSync(join(targetDir, 'apps', 'api', 'package.json'), 'utf8')).not.toContain(
        '@acme/observability',
      );
      expect(
        readFileSync(
          join(targetDir, 'apps', 'api', 'src', 'middleware', 'auth-context.ts'),
          'utf8',
        ),
      ).not.toContain('@opentelemetry/api');
      expect(
        readFileSync(
          join(targetDir, 'apps', 'api', 'src', 'services', 'health-service.ts'),
          'utf8',
        ),
      ).toContain('Optional observability stack not included');
    } finally {
      rmSync(targetDir, { recursive: true, force: true });
    }
  });

  it('removes jobs infra, package references, worker wiring, and local env defaults', () => {
    const targetDir = join(tmpdir(), `acme-scaffold-${crypto.randomUUID()}`);

    mkdirSync(join(targetDir, 'packages', 'jobs'), { recursive: true });
    writeProjectFile(targetDir, 'apps/api/src/worker.ts', 'worker');
    writeProjectFile(
      targetDir,
      'apps/api/turbo.json',
      '{"tasks":{"start":{"with":["start:worker"]}}}',
    );
    writeProjectFile(
      targetDir,
      'apps/api/package.json',
      JSON.stringify({
        scripts: {
          start: 'node dist/index.cjs',
          'start:worker': 'node dist/worker.cjs',
          worker: 'pnpm run start:worker',
        },
        dependencies: {
          '@acme/jobs': 'workspace:*',
          bullmq: '^5.0.0',
          hono: '^4.0.0',
        },
      }),
    );
    writeProjectFile(
      targetDir,
      'packages/auth/package.json',
      JSON.stringify({
        dependencies: {
          '@acme/jobs': 'workspace:*',
          '@acme/shared': 'workspace:*',
        },
      }),
    );
    writeProjectFile(
      targetDir,
      'apps/web/package.json',
      JSON.stringify({
        dependencies: {
          '@acme/jobs': 'workspace:*',
          next: '16.2.3',
        },
      }),
    );
    writeProjectFile(
      targetDir,
      'apps/web/next.config.ts',
      "const nextConfig = { transpilePackages: ['@acme/auth', '@acme/jobs', '@acme/ui'] };",
    );
    writeProjectFile(
      targetDir,
      '.env.example',
      ['REDIS_URL=redis://localhost:6379', 'REDIS_PREFIX=acme-platform', 'DATABASE_URL=x'].join(
        '\n',
      ),
    );
    writeProjectFile(
      targetDir,
      'apps/api/.env.example',
      ['REDIS_URL=redis://localhost:6379', 'FEATURE_FLAGS_JSON={}', 'DATABASE_URL=x'].join('\n'),
    );
    writeProjectFile(
      targetDir,
      'apps/web/.env.example',
      ['REDIS_URL=redis://localhost:6379', 'FEATURE_FLAGS_JSON={}', 'NEXT_PUBLIC_APP_ENV=dev'].join(
        '\n',
      ),
    );
    writeProjectFile(
      targetDir,
      'turbo.json',
      JSON.stringify({
        globalEnv: ['DATABASE_URL', 'REDIS_URL', 'REDIS_PREFIX', 'FEATURE_FLAGS_JSON'],
        tasks: {
          start: {},
          'start:worker': {},
        },
      }),
    );
    writeProjectFile(
      targetDir,
      'docker-compose.yml',
      [
        'services:',
        '  postgres:',
        '    image: postgres:17.4-alpine',
        '  redis:',
        '    image: redis:8.2-alpine',
        'volumes:',
        '  postgres-data:',
      ].join('\n'),
    );
    writeProjectFile(
      targetDir,
      '.github/workflows/ci.yml',
      [
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '  async-verify:',
        '    runs-on: ubuntu-latest',
      ].join('\n'),
    );
    writeProjectFile(
      targetDir,
      'apps/api/tsup.config.ts',
      "export default defineConfig({ entry: ['src/index.ts', 'src/worker.ts'] });",
    );
    writeProjectFile(
      targetDir,
      'packages/auth/src/server.ts',
      [
        "import { loadBetterAuthEnv, resolveServerFeatureFlags } from '@acme/config';",
        "import { enqueueInviteEmailJob } from '@acme/jobs';",
        'const featureFlags = resolveServerFeatureFlags(process.env);',
        'async sendInvitationEmail({ id }) {',
        '        if (featureFlags.asyncInviteEmail) {',
        '          try {',
        '            await enqueueInviteEmailJob({',
        '              invitationId: id,',
        '            });',
        '            return;',
        '          } catch (error) {',
        "            console.error('[auth-email] failed to enqueue invitation email job', {",
        '              invitationId: id,',
        '              error,',
        '            });',
        '          }',
        '        }',
        '',
        '        await mailer.sendInvitation({});',
        '}',
      ].join('\n'),
    );
    writeProjectFile(
      targetDir,
      'apps/api/src/services/user-service.ts',
      [
        "import type { AuditRepository, UsersRepository, WebhookRepository } from '@acme/db';",
        "import { recordOrganizationAccessEvent } from '@acme/jobs';",
        'type AuditRequestMetadata = {',
        '  requestId?: string | null;',
        '  ipAddress?: string | null;',
        '  userAgent?: string | null;',
        '};',
      ].join('\n'),
    );
    writeProjectFile(targetDir, 'pnpm-lock.yaml', 'lockfileVersion: 9.0\n');

    try {
      removeJobs(targetDir);

      expect(existsSync(join(targetDir, 'packages', 'jobs'))).toBe(false);
      expect(existsSync(join(targetDir, 'apps', 'api', 'src', 'worker.ts'))).toBe(false);
      expect(existsSync(join(targetDir, 'apps', 'api', 'turbo.json'))).toBe(false);
      expect(existsSync(join(targetDir, 'pnpm-lock.yaml'))).toBe(false);
      expect(readFileSync(join(targetDir, 'apps', 'api', 'package.json'), 'utf8')).not.toContain(
        '@acme/jobs',
      );
      expect(readFileSync(join(targetDir, 'apps', 'api', 'package.json'), 'utf8')).not.toContain(
        'bullmq',
      );
      expect(readFileSync(join(targetDir, 'apps', 'web', 'next.config.ts'), 'utf8')).not.toContain(
        '@acme/jobs',
      );
      expect(readFileSync(join(targetDir, '.env.example'), 'utf8')).not.toContain('REDIS_URL');
      expect(readFileSync(join(targetDir, 'turbo.json'), 'utf8')).not.toContain('start:worker');
      expect(readFileSync(join(targetDir, 'docker-compose.yml'), 'utf8')).not.toContain('redis:');
      expect(readFileSync(join(targetDir, '.github', 'workflows', 'ci.yml'), 'utf8')).not.toContain(
        'async-verify',
      );
      expect(readFileSync(join(targetDir, 'apps', 'api', 'tsup.config.ts'), 'utf8')).toContain(
        "entry: ['src/index.ts']",
      );
      expect(
        readFileSync(join(targetDir, 'packages', 'auth', 'src', 'server.ts'), 'utf8'),
      ).not.toContain('@acme/jobs');
      expect(
        readFileSync(join(targetDir, 'apps', 'api', 'src', 'services', 'user-service.ts'), 'utf8'),
      ).toContain('AppendAuditLogInput');
    } finally {
      rmSync(targetDir, { recursive: true, force: true });
    }
  });
});

describe('skills scaffolding', () => {
  it('removes skills-lock.json when agent skills are not selected', () => {
    const targetDir = join(tmpdir(), `acme-scaffold-${crypto.randomUUID()}`);

    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'skills-lock.json'), '{"version":1,"skills":{}}\n');

    try {
      removeSkillsLock(targetDir);

      expect(existsSync(join(targetDir, 'skills-lock.json'))).toBe(false);
    } finally {
      rmSync(targetDir, { recursive: true, force: true });
    }
  });
});
