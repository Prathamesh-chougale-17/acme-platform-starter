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

const usage = `Usage: create-acme-platform <directory> [--force]

Options:
  --force   Overwrite an existing non-empty target directory
  --help    Show this help message
`;

const args = process.argv.slice(2);
const force = args.includes('--force');
const positionalArgs = args.filter((arg) => !arg.startsWith('--'));
const [targetArg] = positionalArgs;

if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}

if (!targetArg) {
  console.error('A target directory is required.\n');
  console.error(usage);
  process.exit(1);
}

if (!existsSync(templateDir)) {
  console.error(`Template directory not found at ${templateDir}`);
  process.exit(1);
}

const targetDir = resolve(process.cwd(), targetArg);
const targetExists = existsSync(targetDir);

const getDirectoryEntries = (directoryPath) =>
  existsSync(directoryPath) ? readdirSync(directoryPath).filter((entry) => entry !== '.git') : [];

if (targetExists) {
  const existingEntries = getDirectoryEntries(targetDir);

  if (existingEntries.length > 0 && !force) {
    console.error(
      `Target directory "${targetDir}" is not empty. Re-run with --force to overwrite it.`,
    );
    process.exit(1);
  }

  if (existingEntries.length > 0 && force) {
    for (const entry of existingEntries) {
      rmSync(join(targetDir, entry), {
        recursive: true,
        force: true,
      });
    }
  }
} else {
  mkdirSync(targetDir, {
    recursive: true,
  });
}

cpSync(templateDir, targetDir, {
  recursive: true,
});

const packageJsonPath = join(targetDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const packageSlug =
  basename(targetDir)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || fallbackPackageName;

packageJson.name = packageSlug;
packageJson.private = true;

writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

const nextSteps = [
  `cd ${basename(targetDir)}`,
  'pnpm install',
  'Copy `.env.example`, `apps/api/.env.example`, and `apps/web/.env.example` to their `.env` files',
  'pnpm dev',
];

console.log(`\nCreated a new Acme Platform starter in ${targetDir}\n`);
console.log('Next steps:');

for (const [index, step] of nextSteps.entries()) {
  console.log(`${index + 1}. ${step}`);
}
