#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publishDir = join(rootDir, 'dist', 'create-acme-platform');
const templateDir = join(publishDir, 'template');
const cliPath = join(publishDir, 'bin', 'create-acme-platform.mjs');
const nodeCommand = process.execPath;
const npmCommand = 'npm';
const pnpmCommand = 'pnpm';

const runCommand = (
  command,
  args,
  { cwd = rootDir, expectFailure = false, captureOutput = false } = {},
) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    shell: process.platform === 'win32' && command !== nodeCommand,
    stdio: captureOutput ? 'pipe' : 'inherit',
  });

  const commandLabel = `${command} ${args.join(' ')}`;
  const succeeded = (result.status ?? 1) === 0;

  if (!expectFailure && !succeeded) {
    throw new Error(
      `Command failed: ${commandLabel}\n${result.stderr ?? ''}\n${result.stdout ?? ''}`.trim(),
    );
  }

  if (expectFailure && succeeded) {
    throw new Error(`Command unexpectedly succeeded: ${commandLabel}`);
  }

  return result;
};

const copyEnvExampleIfPresent = (directoryPath) => {
  const examplePath = join(directoryPath, '.env.example');
  const envPath = join(directoryPath, '.env');

  if (existsSync(examplePath)) {
    writeFileSync(envPath, readFileSync(examplePath, 'utf8'));
  }
};

const rootPackageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const publishPackageJson = JSON.parse(readFileSync(join(publishDir, 'package.json'), 'utf8'));
const templatePackageJson = JSON.parse(readFileSync(join(templateDir, 'package.json'), 'utf8'));

assert.equal(
  publishPackageJson.version,
  rootPackageJson.version,
  'Publish package version should match the root package version',
);

for (const requiredPath of [
  join(publishDir, 'README.md'),
  join(publishDir, 'LICENSE'),
  cliPath,
  join(templateDir, 'apps'),
  join(templateDir, 'packages'),
  join(templateDir, '.github', 'workflows', 'ci.yml'),
  join(templateDir, '.github', 'workflows', 'database-migrate.yml'),
  join(templateDir, 'scripts', 'prepare.mjs'),
]) {
  assert.ok(existsSync(requiredPath), `Expected ${requiredPath} to exist in the packaged output`);
}

for (const excludedPath of [
  join(templateDir, '.github', 'workflows', 'release.yml'),
  join(templateDir, '.git'),
  join(templateDir, '.agents'),
  join(templateDir, '.claude'),
  join(templateDir, '.idea'),
  join(templateDir, '.vscode'),
  join(templateDir, 'coverage'),
  join(templateDir, 'dist'),
  join(templateDir, 'packages', 'cli'),
  join(templateDir, 'node_modules'),
  join(templateDir, 'test-results'),
  join(templateDir, 'apps', 'api', '.env'),
  join(templateDir, 'apps', 'api', 'dist'),
  join(templateDir, 'apps', 'web', '.env'),
  join(templateDir, 'apps', 'web', '.next'),
]) {
  assert.ok(!existsSync(excludedPath), `Did not expect ${excludedPath} in the packaged output`);
}

for (const scriptName of [
  'release:patch',
  'release:minor',
  'release:major',
  'release:build-package',
  'release:verify',
  'release:pack:dry-run',
]) {
  assert.ok(
    !templatePackageJson.scripts?.[scriptName],
    `Template package.json should not expose repo-only script ${scriptName}`,
  );
}

assert.equal(
  templatePackageJson.repository,
  undefined,
  'Template package.json should not carry repository metadata',
);
assert.equal(
  templatePackageJson.homepage,
  undefined,
  'Template package.json should not carry homepage metadata',
);
assert.equal(
  templatePackageJson.bugs,
  undefined,
  'Template package.json should not carry bugs metadata',
);

const workspaceTempRoot = mkdtempSync(join(tmpdir(), 'create-acme-platform-verify-'));
const directTarget = join(workspaceTempRoot, 'from-bin');

runCommand(nodeCommand, [cliPath, directTarget, '--yes']);

const directPackageJson = JSON.parse(readFileSync(join(directTarget, 'package.json'), 'utf8'));
assert.equal(directPackageJson.name, 'from-bin');
assert.equal(directPackageJson.private, true);

const secondRunResult = runCommand(nodeCommand, [cliPath, directTarget, '--yes'], {
  captureOutput: true,
  expectFailure: true,
});
assert.match(
  `${secondRunResult.stderr ?? ''}${secondRunResult.stdout ?? ''}`,
  /not empty/i,
  'CLI should fail with a clear non-empty directory message',
);

runCommand(nodeCommand, [cliPath, directTarget, '--force', '--yes']);

const tarballResult = runCommand(npmCommand, ['pack', publishDir, '--json'], {
  cwd: workspaceTempRoot,
  captureOutput: true,
});
const tarballInfo = JSON.parse(tarballResult.stdout ?? '[]');
const tarballFilename = tarballInfo[0]?.filename;

assert.ok(tarballFilename, 'npm pack should return the generated tarball filename');

const installerDir = join(workspaceTempRoot, 'tarball-install');
const tarballTarget = join(workspaceTempRoot, 'from-tarball');
mkdirSync(installerDir, {
  recursive: true,
});
writeFileSync(
  join(installerDir, 'package.json'),
  `${JSON.stringify({ name: 'tarball-installer', private: true }, null, 2)}\n`,
);

runCommand(npmCommand, ['install', '--no-package-lock', join(workspaceTempRoot, tarballFilename)], {
  cwd: installerDir,
});

const installedCliPath = join(
  installerDir,
  'node_modules',
  'create-acme-platform',
  'bin',
  'create-acme-platform.mjs',
);

assert.ok(existsSync(installedCliPath), 'The packed tarball should install the scaffold CLI');

runCommand(nodeCommand, [installedCliPath, tarballTarget, '--yes'], {
  cwd: installerDir,
});

const tarballPackageJson = JSON.parse(readFileSync(join(tarballTarget, 'package.json'), 'utf8'));
assert.equal(tarballPackageJson.name, 'from-tarball');
assert.equal(tarballPackageJson.private, true);

copyEnvExampleIfPresent(tarballTarget);
copyEnvExampleIfPresent(join(tarballTarget, 'apps', 'api'));
copyEnvExampleIfPresent(join(tarballTarget, 'apps', 'web'));

runCommand(pnpmCommand, ['install'], {
  cwd: tarballTarget,
});
runCommand(pnpmCommand, ['lint'], {
  cwd: tarballTarget,
});
runCommand(pnpmCommand, ['typecheck'], {
  cwd: tarballTarget,
});
runCommand(pnpmCommand, ['build'], {
  cwd: tarballTarget,
});

console.log(`Release packaging verification passed in ${workspaceTempRoot}`);
