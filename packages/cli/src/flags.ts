export interface CliFlags {
  force: boolean;
  skipPrompts: boolean;
  help: boolean;
  includeSkills: boolean | undefined;
  targetArg: string | undefined;
}

export const USAGE = `Usage: create-acme-platform [directory] [options]

Options:
  --yes, -y      Skip prompts and use defaults (all features, pnpm, no skills)
  --with-skills  Install agent skills from skills-lock.json with npx skills@latest
  --no-skills    Do not copy or install agent skills
  --force        Overwrite an existing non-empty target directory
  --help         Show this help message
`;

export function parseFlags(argv: string[]): CliFlags {
  const args = argv.slice(2);
  const force = args.includes('--force');
  const skipPrompts = args.includes('--yes') || args.includes('-y');
  const help = args.includes('--help');
  const includeSkills = args.includes('--with-skills') || args.includes('--skills');
  const excludeSkills = args.includes('--no-skills');
  const positionalArgs = args.filter((arg) => !arg.startsWith('-'));
  const [targetArg] = positionalArgs;

  return {
    force,
    skipPrompts,
    help,
    includeSkills: includeSkills ? true : excludeSkills ? false : undefined,
    targetArg,
  };
}
