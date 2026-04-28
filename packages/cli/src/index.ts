import { basename, resolve } from 'node:path';

import { parseFlags, USAGE } from './flags.js';
import { runWizard } from './prompts.js';
import { copyTemplate, removeObservability, patchPackageJson } from './scaffold.js';

const main = async (): Promise<void> => {
  const { force, skipPrompts, help, targetArg } = parseFlags(process.argv);

  if (help) {
    console.log(USAGE);
    process.exit(0);
  }

  let resolvedTargetArg = targetArg;
  let packageManager = 'pnpm';
  let includeObservability = true;
  let includeRedis = true;

  if (skipPrompts) {
    if (!resolvedTargetArg) {
      console.error('A target directory is required when using --yes.\n');
      console.error(USAGE);
      process.exit(1);
    }
  } else {
    const result = await runWizard(resolvedTargetArg);
    resolvedTargetArg = result.targetArg;
    packageManager = result.packageManager;
    includeObservability = result.includeObservability;
    includeRedis = result.includeRedis;
  }

  const targetDir = resolve(process.cwd(), resolvedTargetArg!);

  copyTemplate(targetDir, force);

  if (!includeObservability) {
    removeObservability(targetDir);
  }

  patchPackageJson(targetDir);

  const pm = packageManager;
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

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
