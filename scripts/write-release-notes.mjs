#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = join(rootDir, 'CHANGELOG.md');
const [tagName, outputPath] = process.argv.slice(2);

if (!tagName || !outputPath) {
  console.error('Usage: node scripts/write-release-notes.mjs <tag> <output-path>');
  process.exit(1);
}

const version = tagName.replace(/^v/, '');
let notes = `Release ${tagName}\n\nSee CHANGELOG.md for the full release history.\n`;
if (existsSync(changelogPath)) {
  const changelog = readFileSync(changelogPath, 'utf8');
  const headings = Array.from(
    changelog.matchAll(
      /^#{2,3}\s+(?:\[(?<linked>v?\d+\.\d+\.\d+(?:[-+][^\]]+)?)\]|(?<plain>v?\d+\.\d+\.\d+(?:[-+][^\s]+)?)).*$/gm,
    ),
  );

  for (let index = 0; index < headings.length; index += 1) {
    const match = headings[index];
    const matchedVersion = (match?.groups?.linked ?? match?.groups?.plain)?.replace(/^v/, '');

    if (matchedVersion !== version) {
      continue;
    }

    const sectionStart = match.index ?? 0;
    const sectionEnd = headings[index + 1]?.index ?? changelog.length;
    notes = changelog.slice(sectionStart, sectionEnd).trim();
    break;
  }
}

const resolvedOutputPath = resolve(rootDir, outputPath);
mkdirSync(dirname(resolvedOutputPath), {
  recursive: true,
});

writeFileSync(resolvedOutputPath, `${notes}\n`);
