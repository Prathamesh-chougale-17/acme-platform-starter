import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
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
  restoreGitignoreTemplates(targetDir);
};

export const restoreGitignoreTemplates = (directoryPath: string): void => {
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === '.git') {
        continue;
      }

      restoreGitignoreTemplates(entryPath);
      continue;
    }

    if (!entry.isFile() || entry.name !== '.gitignore.template') {
      continue;
    }

    const gitignorePath = join(directoryPath, '.gitignore');

    if (!existsSync(gitignorePath)) {
      copyFileSync(entryPath, gitignorePath);
    }

    rmSync(entryPath, { force: true });
  }
};

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
};

type TurboJson = {
  globalEnv?: string[];
  tasks?: Record<string, unknown>;
  [key: string]: unknown;
};

type SkillsLock = {
  version?: number;
  skills?: Record<
    string,
    {
      source?: string;
      sourceType?: string;
      skillPath?: string;
    }
  >;
};

const editFile = (filePath: string, updater: (content: string) => string): void => {
  if (!existsSync(filePath)) {
    return;
  }

  writeFileSync(filePath, updater(readFileSync(filePath, 'utf8')));
};

const readJsonFile = <T>(filePath: string): T => JSON.parse(readFileSync(filePath, 'utf8')) as T;

const writeJsonFile = (filePath: string, value: unknown): void => {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const editJsonFile = <T>(filePath: string, updater: (value: T) => T): void => {
  if (!existsSync(filePath)) {
    return;
  }

  writeJsonFile(filePath, updater(readJsonFile<T>(filePath)));
};

const removeRecordKeys = (record: Record<string, string> | undefined, keys: string[]): void => {
  if (!record) {
    return;
  }

  for (const key of keys) {
    delete record[key];
  }
};

const removePackageJsonEntries = (
  filePath: string,
  entries: {
    scripts?: string[];
    dependencies?: string[];
    devDependencies?: string[];
  },
): void => {
  editJsonFile<PackageJson>(filePath, (packageJson) => {
    removeRecordKeys(packageJson.scripts, entries.scripts ?? []);
    removeRecordKeys(packageJson.dependencies, entries.dependencies ?? []);
    removeRecordKeys(packageJson.devDependencies, entries.devDependencies ?? []);
    return packageJson;
  });
};

const removeEnvKeys = (targetDir: string, keys: string[]): void => {
  for (const envExamplePath of [
    join(targetDir, '.env.example'),
    join(targetDir, 'apps', 'api', '.env.example'),
    join(targetDir, 'apps', 'web', '.env.example'),
  ]) {
    editFile(envExamplePath, (content) =>
      content
        .split(/\r?\n/)
        .filter((line) => !keys.some((key) => line.startsWith(`${key}=`)))
        .join('\n'),
    );
  }
};

const removeYamlChildBlocks = (filePath: string, parentKey: string, childKeys: string[]): void => {
  const childrenToRemove = new Set(childKeys);

  editFile(filePath, (content) => {
    const lines = content.split(/\r?\n/);
    const nextLines: string[] = [];
    let inParent = false;
    let skippingChild = false;

    for (const line of lines) {
      if (/^\S.*:\s*$/.test(line)) {
        inParent = line === `${parentKey}:`;
        skippingChild = false;
        nextLines.push(line);
        continue;
      }

      if (inParent) {
        const childMatch = /^ {2}([A-Za-z0-9_-]+):/.exec(line);

        if (childMatch?.[1]) {
          skippingChild = childrenToRemove.has(childMatch[1]);
        }

        if (skippingChild) {
          continue;
        }
      }

      nextLines.push(line);
    }

    return nextLines.join('\n');
  });
};

const removeTranspilePackage = (targetDir: string, packageName: string): void => {
  editFile(join(targetDir, 'apps', 'web', 'next.config.ts'), (content) =>
    content.replace(/transpilePackages:\s*\[([^\]]*)\]/, (match, packageList: string) => {
      const nextPackageList = packageList
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value && !value.includes(packageName))
        .join(', ');

      return nextPackageList ? `transpilePackages: [${nextPackageList}]` : match;
    }),
  );
};

const removeCopiedLockfile = (targetDir: string): void => {
  const lockfilePath = join(targetDir, 'pnpm-lock.yaml');
  if (existsSync(lockfilePath)) {
    rmSync(lockfilePath, { force: true });
  }
};

export const copyEnvFiles = (targetDir: string): void => {
  const pairs: [string, string][] = [
    [join(targetDir, '.env.example'), join(targetDir, '.env')],
    [join(targetDir, 'apps', 'api', '.env.example'), join(targetDir, 'apps', 'api', '.env')],
    [join(targetDir, 'apps', 'web', '.env.example'), join(targetDir, 'apps', 'web', '.env')],
  ];

  for (const [src, dest] of pairs) {
    if (existsSync(src) && !existsSync(dest)) {
      copyFileSync(src, dest);
    }
  }
};

export const removeSkillsLock = (targetDir: string): void => {
  const skillsLockPath = join(targetDir, 'skills-lock.json');

  if (existsSync(skillsLockPath)) {
    rmSync(skillsLockPath, { force: true });
  }
};

export const installSkillsFromLock = async (targetDir: string): Promise<void> => {
  const skillsLockPath = join(targetDir, 'skills-lock.json');

  if (!existsSync(skillsLockPath)) {
    throw new Error('skills-lock.json was not found in the scaffold template.');
  }

  const skillsLock = readJsonFile<SkillsLock>(skillsLockPath);
  const skillCount = Object.keys(skillsLock.skills ?? {}).length;

  if (skillCount === 0) {
    return;
  }

  console.log(`\nInstalling ${skillCount} agent skills from skills-lock.json...`);

  const result = spawnSync('npx', ['-y', 'skills@latest', 'experimental_install', '--yes'], {
    cwd: targetDir,
    env: {
      ...process.env,
      DISABLE_TELEMETRY: '1',
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if ((result.status ?? 1) !== 0) {
    throw new Error(
      'Failed to install agent skills from skills-lock.json. Re-run "npx -y skills@latest experimental_install --yes" from the project directory after checking the error above.',
    );
  }
};

const removeTurboEnvAndTasks = ({
  targetDir,
  envKeys,
  taskKeys,
}: {
  targetDir: string;
  envKeys: string[];
  taskKeys: string[];
}): void => {
  editJsonFile<TurboJson>(join(targetDir, 'turbo.json'), (turboConfig) => {
    if (turboConfig.globalEnv) {
      turboConfig.globalEnv = turboConfig.globalEnv.filter((key) => !envKeys.includes(key));
    }

    if (turboConfig.tasks) {
      for (const taskKey of taskKeys) {
        delete turboConfig.tasks[taskKey];
      }
    }

    return turboConfig;
  });
};

export const removeObservability = (targetDir: string): void => {
  const obsDir = join(targetDir, 'infra', 'observability');
  if (existsSync(obsDir)) {
    rmSync(obsDir, { recursive: true, force: true });
  }

  const obsPackageDir = join(targetDir, 'packages', 'observability');
  if (existsSync(obsPackageDir)) {
    rmSync(obsPackageDir, { recursive: true, force: true });
  }

  removePackageJsonEntries(join(targetDir, 'apps', 'api', 'package.json'), {
    dependencies: ['@acme/observability', '@opentelemetry/api'],
  });
  removeEnvKeys(targetDir, ['OTEL_EXPORTER_OTLP_ENDPOINT', 'LOKI_URL', 'API_LOG_TO_LOKI']);
  removeTurboEnvAndTasks({
    targetDir,
    envKeys: ['OTEL_EXPORTER_OTLP_ENDPOINT', 'LOKI_URL', 'API_LOG_TO_LOKI'],
    taskKeys: [],
  });
  removeYamlChildBlocks(join(targetDir, 'docker-compose.yml'), 'services', [
    'loki',
    'tempo',
    'otel-collector',
    'prometheus',
    'grafana',
  ]);
  removeYamlChildBlocks(join(targetDir, 'docker-compose.yml'), 'volumes', ['grafana-data']);

  editFile(join(targetDir, 'apps', 'api', 'src', 'index.ts'), (content) =>
    content
      .replace("import { startObservability, stopObservability } from '@acme/observability';\n", '')
      .replace(
        `    try {
      await stopObservability();
      bootstrapLogger.info('observability stopped');
    } catch (shutdownError) {
      bootstrapLogger.error({ err: shutdownError }, 'failed to stop observability cleanly');
    }

`,
        '',
      )
      .replace(
        `  await startObservability({
    serviceName: env.API_SERVICE_NAME,
    environment: env.NODE_ENV,
    endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  });

`,
        '',
      )
      .replace(/,\n\s+otlpEndpoint: env\.OTEL_EXPORTER_OTLP_ENDPOINT/g, ''),
  );

  editFile(join(targetDir, 'apps', 'api', 'src', 'worker.ts'), (content) =>
    content
      .replace("import { startObservability, stopObservability } from '@acme/observability';\n", '')
      .replace(', stopObservability()', '')
      .replace(
        `  await startObservability({
    serviceName: \`\${env.API_SERVICE_NAME}-worker\`,
    environment: env.NODE_ENV,
    endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  });

`,
        '',
      ),
  );

  editFile(join(targetDir, 'apps', 'api', 'src', 'middleware', 'request-context.ts'), (content) =>
    content.replace("import { withRequestSpan } from '@acme/observability';\n", '').replace(
      `    await withRequestSpan(
      env.API_SERVICE_NAME,
      \`\${c.req.method} \${c.req.path}\`,
      {
        'http.method': c.req.method,
        'http.route': c.req.path,
      },
      async (traceId) => {
        c.set('traceId', traceId);

        const requestLogger = logger.child(
          getLoggerBindings({
            requestId,
            traceId,
            route: c.req.path,
            method: c.req.method,
          }),
        );

        c.set('logger', requestLogger);

        try {
          await next();
        } finally {
          const latency = Number((performance.now() - startedAt).toFixed(2));
          const statusCode = c.res.status || 200;

          observeRequest({
            route: c.req.path,
            method: c.req.method,
            statusCode,
            latency,
          });

          requestLogger.info(
            getLoggerBindings({
              statusCode,
              latency,
            }),
            'request completed',
          );
        }
      },
    );
`,
      `    const traceId = requestId;
    c.set('traceId', traceId);

    const requestLogger = logger.child(
      getLoggerBindings({
        requestId,
        traceId,
        route: c.req.path,
        method: c.req.method,
      }),
    );

    c.set('logger', requestLogger);

    try {
      await next();
    } finally {
      const latency = Number((performance.now() - startedAt).toFixed(2));
      const statusCode = c.res.status || 200;

      observeRequest({
        route: c.req.path,
        method: c.req.method,
        statusCode,
        latency,
      });

      requestLogger.info(
        getLoggerBindings({
          statusCode,
          latency,
        }),
        'request completed',
      );
    }
`,
    ),
  );

  editFile(join(targetDir, 'apps', 'api', 'src', 'middleware', 'auth-context.ts'), (content) =>
    content.replace("import { trace } from '@opentelemetry/api';\n", '').replace(
      `
  trace.getActiveSpan()?.setAttributes({
    'auth.user.id': authContext.user.id,
    'auth.organization.id': authContext.organizationId ?? '',
    'auth.role': authContext.role ?? '',
  });
`,
      '',
    ),
  );

  editFile(join(targetDir, 'apps', 'api', 'src', 'services', 'health-service.ts'), (content) =>
    content.replace(
      `        observability: {
          status: this.env.OTEL_EXPORTER_OTLP_ENDPOINT ? 'up' : 'degraded',
          detail: this.env.OTEL_EXPORTER_OTLP_ENDPOINT
            ? 'OTLP trace exporter configured'
            : 'OTLP trace exporter missing',
        },
`,
      `        observability: {
          status: 'up',
          detail: 'Optional observability stack not included',
        },
`,
    ),
  );

  editFile(join(targetDir, 'apps', 'web', 'components', 'health-dashboard.tsx'), (content) =>
    content.replace(
      `Inspect the API health contract, confirm environment wiring, and verify that local
            observability is ready before feature work starts.`,
      `Inspect the API health contract, confirm environment wiring, and verify that local
            services are ready before feature work starts.`,
    ),
  );

  removeCopiedLockfile(targetDir);
};

export const removeJobs = (targetDir: string): void => {
  const jobsPackageDir = join(targetDir, 'packages', 'jobs');
  if (existsSync(jobsPackageDir)) {
    rmSync(jobsPackageDir, { recursive: true, force: true });
  }

  const workerPath = join(targetDir, 'apps', 'api', 'src', 'worker.ts');
  if (existsSync(workerPath)) {
    rmSync(workerPath, { force: true });
  }

  const apiTurboPath = join(targetDir, 'apps', 'api', 'turbo.json');
  if (existsSync(apiTurboPath)) {
    rmSync(apiTurboPath, { force: true });
  }

  removePackageJsonEntries(join(targetDir, 'apps', 'api', 'package.json'), {
    scripts: ['start:worker', 'worker'],
    dependencies: ['@acme/jobs', 'bullmq'],
  });
  removePackageJsonEntries(join(targetDir, 'packages', 'auth', 'package.json'), {
    dependencies: ['@acme/jobs'],
  });
  removePackageJsonEntries(join(targetDir, 'apps', 'web', 'package.json'), {
    dependencies: ['@acme/jobs'],
  });
  removeTranspilePackage(targetDir, '@acme/jobs');
  removeEnvKeys(targetDir, ['REDIS_URL', 'REDIS_PREFIX', 'FEATURE_FLAGS_JSON']);
  removeTurboEnvAndTasks({
    targetDir,
    envKeys: ['REDIS_URL', 'REDIS_PREFIX', 'FEATURE_FLAGS_JSON'],
    taskKeys: ['start:worker'],
  });
  removeYamlChildBlocks(join(targetDir, 'docker-compose.yml'), 'services', ['redis']);
  removeYamlChildBlocks(join(targetDir, '.github', 'workflows', 'ci.yml'), 'jobs', [
    'async-verify',
  ]);

  editFile(join(targetDir, 'apps', 'api', 'tsup.config.ts'), (content) =>
    content.replace(
      /entry:\s*\[\s*'src\/index\.ts'\s*,\s*'src\/worker\.ts'\s*\]/,
      "entry: ['src/index.ts']",
    ),
  );

  editFile(join(targetDir, 'packages', 'auth', 'src', 'server.ts'), (content) =>
    content
      .replace(
        "import { loadBetterAuthEnv, resolveServerFeatureFlags } from '@acme/config';",
        "import { loadBetterAuthEnv } from '@acme/config';",
      )
      .replace("import { enqueueInviteEmailJob } from '@acme/jobs';\n", '')
      .replace('const featureFlags = resolveServerFeatureFlags(process.env);\n', '')
      .replace(
        `        if (featureFlags.asyncInviteEmail) {
          try {
            await enqueueInviteEmailJob({
              invitationId: id,
            });
            return;
          } catch (error) {
            console.error('[auth-email] failed to enqueue invitation email job', {
              invitationId: id,
              error,
            });
          }
        }

`,
        '',
      ),
  );

  editFile(join(targetDir, 'apps', 'api', 'src', 'services', 'user-service.ts'), (content) =>
    content
      .replace(
        "import type { AuditRepository, UsersRepository, WebhookRepository } from '@acme/db';",
        "import type { AppendAuditLogInput, AuditRepository, UsersRepository, WebhookRepository } from '@acme/db';",
      )
      .replace("import { recordOrganizationAccessEvent } from '@acme/jobs';\n", '')
      .replace(
        `type AuditRequestMetadata = {
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};
`,
        `type AuditRequestMetadata = {
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type LocalOrganizationAccessEventInput = {
  auditLog: AppendAuditLogInput;
  [key: string]: unknown;
};

const recordOrganizationAccessEvent = async ({
  auditRepository,
  event,
}: {
  auditRepository: AuditRepository;
  webhookRepository?: WebhookRepository;
  featureFlags: ServerFeatureFlags;
  event: LocalOrganizationAccessEventInput;
}): Promise<void> => {
  await auditRepository.appendAuditLog(event.auditLog);
};
`,
      ),
  );

  removeCopiedLockfile(targetDir);
};

export const patchPackageJson = (targetDir: string): void => {
  const packageJsonPath = join(targetDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
  packageJson['name'] = toSlug(basename(targetDir));
  packageJson['private'] = true;
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
};
