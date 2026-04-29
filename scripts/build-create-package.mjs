#!/usr/bin/env node

import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publishDir = join(rootDir, 'dist', 'create-acme-platform');
const templateDir = join(publishDir, 'template');
const binDir = join(publishDir, 'bin');

const templateEntries = [
  '.dockerignore',
  '.env.example',
  '.gitignore',
  '.husky',
  '.github/actions',
  '.github/workflows/ci.yml',
  '.github/workflows/database-migrate.yml',
  'LICENSE',
  'README.md',
  'apps',
  'docker-compose.yml',
  'docs',
  'eslint.config.mjs',
  'infra',
  'package.json',
  'packages',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'scripts/prepare.mjs',
  'skills-lock.json',
  'turbo.json',
];

const excludedDirectoryNames = new Set([
  '.agents',
  '.claude',
  '.git',
  '.idea',
  '.next',
  '.pnpm-store',
  '.turbo',
  '.vscode',
  'build',
  'cli',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'playwright-report',
  'test-results',
]);

const repoOnlyScripts = new Set([
  'release:patch',
  'release:minor',
  'release:major',
  'release:build-package',
  'release:verify',
  'release:pack:dry-run',
]);

const rootPackageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const repositoryUrl =
  typeof rootPackageJson.repository === 'string'
    ? rootPackageJson.repository
    : rootPackageJson.repository?.url;

const publishReadme = `# create-acme-platform

Scaffold the Acme Platform starter monorepo.

## Usage

\`\`\`bash
npm create acme-platform@latest my-app
pnpm create acme-platform my-app
npx create-acme-platform my-app
npx create-acme-platform my-app --no-skills
\`\`\`

## What it creates

- Next.js 16 frontend
- Hono API service
- Better Auth integration
- Drizzle ORM + PostgreSQL wiring
- Redis/BullMQ async jobs
- Turborepo + pnpm workspace setup
- Observability stack and CI workflows
- Agent skills restored from skills-lock.json with the Skills CLI by default

## After scaffolding

1. \`cd my-app\`
2. \`pnpm install\`
3. Copy \`.env.example\`, \`apps/api/.env.example\`, and \`apps/web/.env.example\` to their \`.env\` files
4. \`pnpm dev\`

Starter source: ${rootPackageJson.homepage ?? 'https://github.com/Prathamesh-chougale-17/acme-platform-starter'}
`;

const normalizePath = (pathValue) => pathValue.split('\\').join('/');

const shouldCopy = (sourcePath) => {
  const relativePath = normalizePath(relative(rootDir, sourcePath));

  if (!relativePath || relativePath === '.') {
    return true;
  }

  const segments = relativePath.split('/');
  const basename = segments.at(-1) ?? '';

  if (relativePath === '.github/workflows/release.yml') {
    return false;
  }

  if (segments.some((segment) => excludedDirectoryNames.has(segment))) {
    return false;
  }

  if (basename.startsWith('.env') && basename !== '.env.example') {
    return false;
  }

  if (basename.endsWith('.tsbuildinfo')) {
    return false;
  }

  return true;
};

const copyIntoTemplate = (relativeSourcePath) => {
  const sourcePath = join(rootDir, relativeSourcePath);
  const destinationPath = join(templateDir, relativeSourcePath);

  if (!existsSync(sourcePath)) {
    throw new Error(`Template source entry not found: ${relativeSourcePath}`);
  }

  mkdirSync(dirname(destinationPath), {
    recursive: true,
  });

  cpSync(sourcePath, destinationPath, {
    recursive: true,
    filter: shouldCopy,
  });
};

const sanitizeTemplatePackageJson = () => {
  const packageJsonPath = join(templateDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  if (packageJson.scripts) {
    for (const scriptName of repoOnlyScripts) {
      delete packageJson.scripts[scriptName];
    }
  }

  delete packageJson.repository;
  delete packageJson.homepage;
  delete packageJson.bugs;

  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
};

const writePublishPackageJson = () => {
  const publishPackageJson = {
    name: 'create-acme-platform',
    version: rootPackageJson.version,
    description: 'Scaffold the Acme Platform starter monorepo.',
    type: 'module',
    bin: {
      'create-acme-platform': './bin/create-acme-platform.mjs',
    },
    files: ['bin', 'template', 'README.md', 'LICENSE'],
    engines: rootPackageJson.engines,
    license: rootPackageJson.license,
    repository: rootPackageJson.repository,
    homepage: rootPackageJson.homepage,
    bugs: rootPackageJson.bugs,
    keywords: ['create', 'starter', 'monorepo', 'nextjs', 'hono', 'drizzle', 'turborepo'],
    publishConfig: {
      access: 'public',
    },
    dependencies: {
      '@clack/prompts': '^1.2.0',
    },
  };

  writeFileSync(
    join(publishDir, 'package.json'),
    `${JSON.stringify(publishPackageJson, null, 2)}\n`,
  );
};

rmSync(publishDir, {
  recursive: true,
  force: true,
});

mkdirSync(templateDir, {
  recursive: true,
});
mkdirSync(binDir, {
  recursive: true,
});

for (const entry of templateEntries) {
  copyIntoTemplate(entry);
}

sanitizeTemplatePackageJson();
writePublishPackageJson();

const cliSourcePath = join(rootDir, 'packages', 'cli', 'dist', 'index.mjs');
const cliDestinationPath = join(binDir, 'create-acme-platform.mjs');

cpSync(cliSourcePath, cliDestinationPath);
chmodSync(cliDestinationPath, 0o755);

writeFileSync(join(publishDir, 'README.md'), publishReadme);
cpSync(join(rootDir, 'LICENSE'), join(publishDir, 'LICENSE'));

console.log(`Built publishable package at ${publishDir}`);
console.log(`Repository metadata source: ${repositoryUrl ?? 'not configured'}`);
