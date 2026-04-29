import { describe, expect, it } from 'vitest';

import { parseFlags } from './flags.js';

describe('parseFlags', () => {
  it('leaves agent skills to default handling when not specified', () => {
    expect(parseFlags(['node', 'cli', 'my-app', '--yes'])).toMatchObject({
      includeSkills: undefined,
      skipPrompts: true,
      targetArg: 'my-app',
    });
  });

  it('enables agent skills when requested', () => {
    expect(parseFlags(['node', 'cli', 'my-app', '--with-skills'])).toMatchObject({
      includeSkills: true,
      targetArg: 'my-app',
    });
  });

  it('allows agent skills to be explicitly disabled', () => {
    expect(parseFlags(['node', 'cli', 'my-app', '--no-skills'])).toMatchObject({
      includeSkills: false,
      targetArg: 'my-app',
    });
  });
});
