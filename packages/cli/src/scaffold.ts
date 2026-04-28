import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const FALLBACK_PACKAGE_NAME = 'acme-platform-app';

export const toSlug = (input: string): string =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || FALLBACK_PACKAGE_NAME;

export const getDirectoryEntries = (dirPath: string): string[] =>
  existsSync(dirPath) ? readdirSync(dirPath).filter((e) => e !== '.git') : [];

export const copyTemplate = (targetDir: string, force: boolean): void => {
  const templateDir = resolve(__dirname, '../template');

  if (!existsSync(templateDir)) {
    console.error(`Template directory not found at ${templateDir}`);
    process.exit(1);
  }

  if (existsSync(targetDir)) {
    const existing = getDirectoryEntries(targetDir);

    if (existing.length > 0 && !force) {
      console.error(
        `Target directory "${targetDir}" is not empty. Re-run with --force to overwrite it.`,
      );
      process.exit(1);
    }

    if (existing.length > 0 && force) {
      for (const entry of existing) {
        rmSync(join(targetDir, entry), { recursive: true, force: true });
      }
    }
  } else {
    mkdirSync(targetDir, { recursive: true });
  }

  cpSync(templateDir, targetDir, { recursive: true });
};

export const removeObservability = (targetDir: string): void => {
  const obsDir = join(targetDir, 'infra', 'observability');
  if (existsSync(obsDir)) {
    rmSync(obsDir, { recursive: true, force: true });
  }

  for (const envExamplePath of [
    join(targetDir, '.env.example'),
    join(targetDir, 'apps', 'api', '.env.example'),
  ]) {
    if (!existsSync(envExamplePath)) {
      continue;
    }

    const nextContent = readFileSync(envExamplePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => {
        if (line.startsWith('OTEL_EXPORTER_OTLP_ENDPOINT=')) {
          return 'OTEL_EXPORTER_OTLP_ENDPOINT=';
        }

        if (line.startsWith('LOKI_URL=')) {
          return 'LOKI_URL=';
        }

        if (line.startsWith('API_LOG_TO_LOKI=')) {
          return 'API_LOG_TO_LOKI=false';
        }

        return line;
      })
      .join('\n');

    writeFileSync(envExamplePath, nextContent);
  }
};

export const patchPackageJson = (targetDir: string): void => {
  const packageJsonPath = join(targetDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
  packageJson['name'] = toSlug(basename(targetDir));
  packageJson['private'] = true;
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
};
