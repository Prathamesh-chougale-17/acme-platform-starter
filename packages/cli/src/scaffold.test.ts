import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FALLBACK_PACKAGE_NAME, removeObservability, toSlug } from './scaffold.js';

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

  it('removes observability infra and disables local observability env defaults', () => {
    const targetDir = join(tmpdir(), `acme-scaffold-${crypto.randomUUID()}`);
    const rootEnvExamplePath = join(targetDir, '.env.example');
    const apiEnvExamplePath = join(targetDir, 'apps', 'api', '.env.example');

    mkdirSync(join(targetDir, 'infra', 'observability'), { recursive: true });
    mkdirSync(join(targetDir, 'apps', 'api'), { recursive: true });
    writeFileSync(
      rootEnvExamplePath,
      [
        'OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318',
        'LOKI_URL=http://localhost:3100',
        'API_LOG_TO_LOKI=true',
      ].join('\n'),
    );
    writeFileSync(
      apiEnvExamplePath,
      [
        'OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318',
        'LOKI_URL=http://localhost:3100',
        'API_LOG_TO_LOKI=true',
      ].join('\n'),
    );

    try {
      removeObservability(targetDir);

      expect(existsSync(join(targetDir, 'infra', 'observability'))).toBe(false);
      expect(readFileSync(rootEnvExamplePath, 'utf8')).toContain('OTEL_EXPORTER_OTLP_ENDPOINT=');
      expect(readFileSync(rootEnvExamplePath, 'utf8')).not.toContain('http://localhost:4318');
      expect(readFileSync(apiEnvExamplePath, 'utf8')).toContain('LOKI_URL=');
      expect(readFileSync(apiEnvExamplePath, 'utf8')).toContain('API_LOG_TO_LOKI=false');
    } finally {
      rmSync(targetDir, { recursive: true, force: true });
    }
  });
});
