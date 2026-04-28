#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const templateDir = resolve(__dirname, '../template');
const fallbackPackageName = 'acme-platform-app';

// ── Flag parsing (sync, before any async/import) ──────────────────────────────
const args = process.argv.slice(2);
const force = args.includes('--force');
const skipPrompts = args.includes('--yes') || args.includes('-y');
const positionalArgs = args.filter((arg) => !arg.startsWith('-'));
const [targetArg] = positionalArgs;

const usage = `Usage: create-acme-platform [directory] [options]

Options:
  --yes, -y   Skip prompts and use defaults (all features, pnpm)
  --force     Overwrite an existing non-empty target directory
  --help      Show this help message
`;

if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}

if (!existsSync(templateDir)) {
  console.error(`Template directory not found at ${templateDir}`);
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const toSlug = (input) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || fallbackPackageName;

const getDirectoryEntries = (dirPath) =>
  existsSync(dirPath) ? readdirSync(dirPath).filter((e) => e !== '.git') : [];

// ── Main ──────────────────────────────────────────────────────────────────────
const main = async () => {
  let resolvedTargetArg = targetArg;
  let resolvedPackageManager = 'pnpm';
  let includeObservability = true;
  let includeRedis = true;

  if (skipPrompts) {
    if (!resolvedTargetArg) {
      console.error('A target directory is required when using --yes.\n');
      console.error(usage);
      process.exit(1);
    }
  } else {
    const { intro, outro, text, select, multiselect, isCancel, cancel } =
      await import('@clack/prompts');

    intro('create-acme-platform');

    // Step 1: Project directory (skipped if positional arg already provided)
    if (!resolvedTargetArg) {
      const nameAnswer = await text({
        message: 'Where should we create your project?',
        placeholder: './my-acme-app',
        validate(value) {
          const trimmed = value.trim();
          if (!trimmed) return 'Please enter a directory name.';
          if (trimmed === '.' || trimmed === './') return 'Please choose a sub-directory name.';
        },
      });
      if (isCancel(nameAnswer)) {
        cancel('Operation cancelled.');
        process.exit(0);
      }
      resolvedTargetArg = nameAnswer.trim();
    }

    // Step 2: Package manager
    const pmAnswer = await select({
      message: 'Which package manager do you use?',
      options: [
        { value: 'pnpm', label: 'pnpm', hint: 'recommended' },
        { value: 'npm', label: 'npm' },
        { value: 'yarn', label: 'yarn' },
        { value: 'bun', label: 'bun' },
      ],
    });
    if (isCancel(pmAnswer)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }
    resolvedPackageManager = pmAnswer;

    // Step 3: Optional features
    const featureAnswer = await multiselect({
      message: 'Which optional features do you want to include?',
      options: [
        {
          value: 'observability',
          label: 'Observability stack',
          hint: 'Grafana, Loki, Tempo, Prometheus — infra/observability/ removed if deselected',
        },
        {
          value: 'redis',
          label: 'Async jobs / Redis (BullMQ)',
          hint: 'Auto-disabled at runtime when REDIS_URL is absent; code stays in place',
        },
      ],
      initialValues: ['observability', 'redis'],
    });
    if (isCancel(featureAnswer)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }

    includeObservability = featureAnswer.includes('observability');
    includeRedis = featureAnswer.includes('redis');

    outro('Setting up your project...');
  }

  // ── Scaffold ──────────────────────────────────────────────────────────────
  const targetDir = resolve(process.cwd(), resolvedTargetArg);

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

  // Remove observability infra if deselected
  if (!includeObservability) {
    const obsDir = join(targetDir, 'infra', 'observability');
    if (existsSync(obsDir)) {
      rmSync(obsDir, { recursive: true, force: true });
    }
  }

  // Personalize package.json
  const packageJsonPath = join(targetDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  packageJson.name = toSlug(basename(targetDir));
  packageJson.private = true;
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  // ── Output ────────────────────────────────────────────────────────────────
  const pm = resolvedPackageManager;
  const installCmd = pm === 'bun' ? 'bun install' : `${pm} install`;
  const devCmd = pm === 'bun' ? 'bun dev' : `${pm} dev`;

  console.log(`\nCreated a new Acme Platform starter in ${targetDir}\n`);
  console.log('Next steps:');
  console.log(`  1. cd ${basename(targetDir)}`);
  console.log(`  2. ${installCmd}`);
  console.log(
    '  3. Copy `.env.example`, `apps/api/.env.example`, and `apps/web/.env.example` to their `.env` files',
  );
  console.log(`  4. ${devCmd}`);

  if (includeRedis) {
    console.log('\nNote: Async jobs / Redis requires REDIS_URL to be set in your .env file.');
    console.log(
      'Without it, asyncInviteEmail and outgoingWebhooks feature flags auto-disable at runtime.',
    );
  } else {
    console.log('\nNote: Async jobs / Redis was not selected. The code remains in place but is');
    console.log(
      'automatically disabled when REDIS_URL is absent — no changes to the source needed.',
    );
  }

  if (!includeObservability) {
    console.log('\nNote: infra/observability/ was removed. The @acme/observability package stays');
    console.log('in your codebase and becomes a no-op when OTEL_EXPORTER_OTLP_ENDPOINT is unset.');
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
