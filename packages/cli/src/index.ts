import { basename, resolve } from 'node:path';

import { parseFlags, USAGE } from './flags.js';
import { runWizard } from './prompts.js';
import {
  copyTemplate,
  installSkillsFromLock,
  patchPackageJson,
  removeJobs,
  removeObservability,
  removeSkillsLock,
} from './scaffold.js';

const main = async (): Promise<void> => {
  const {
    force,
    skipPrompts,
    help,
    targetArg,
    includeSkills: includeSkillsFlag,
  } = parseFlags(process.argv);

  if (help) {
    console.log(USAGE);
    process.exit(0);
  }

  let resolvedTargetArg = targetArg;
  let packageManager = 'pnpm';
  let includeObservability = true;
  let includeRedis = true;
  let includeSkills = false;

  if (skipPrompts) {
    if (!resolvedTargetArg) {
      console.error('A target directory is required when using --yes.\n');
      console.error(USAGE);
      process.exit(1);
    }
    includeSkills = includeSkillsFlag ?? false;
  } else {
    const result = await runWizard(resolvedTargetArg);
    resolvedTargetArg = result.targetArg;
    packageManager = result.packageManager;
    includeObservability = result.includeObservability;
    includeRedis = result.includeRedis;
    includeSkills = result.includeSkills;
  }

  if (includeSkillsFlag !== undefined) {
    includeSkills = includeSkillsFlag;
  }

  const targetDir = resolve(process.cwd(), resolvedTargetArg!);

  copyTemplate(targetDir, force);

  if (!includeObservability) {
    removeObservability(targetDir);
  }

  if (!includeRedis) {
    removeJobs(targetDir);
  }

  patchPackageJson(targetDir);

  if (includeSkills) {
    await installSkillsFromLock(targetDir);
  } else {
    removeSkillsLock(targetDir);
  }

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
    console.log('\nNote: Async jobs / Redis was not selected. The @acme/jobs package, worker');
    console.log('entrypoint, Redis service, and async CI job were removed from this project.');
  }

  if (!includeObservability) {
    console.log('\nNote: Observability stack was not selected. The Grafana/Loki/Tempo/Prometheus');
    console.log('Docker services and @acme/observability package were removed from this project.');
  }

  if (!includeRedis || !includeObservability) {
    console.log('\nNote: pnpm-lock.yaml was removed so your first install can regenerate a');
    console.log('lockfile that matches the selected feature set.');
  }

  if (includeSkills) {
    console.log('\nAgent skills were restored from skills-lock.json with the latest Skills CLI.');
    console.log('Commit the generated skills-lock.json if the Skills CLI refreshed it.');
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
