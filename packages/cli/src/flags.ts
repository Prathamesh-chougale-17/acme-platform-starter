export interface CliFlags {
  force: boolean;
  skipPrompts: boolean;
  help: boolean;
  targetArg: string | undefined;
}

export const USAGE = `Usage: create-acme-platform [directory] [options]

Options:
  --yes, -y   Skip prompts and use defaults (all features, pnpm)
  --force     Overwrite an existing non-empty target directory
  --help      Show this help message
`;

export function parseFlags(argv: string[]): CliFlags {
  const args = argv.slice(2);
  const force = args.includes('--force');
  const skipPrompts = args.includes('--yes') || args.includes('-y');
  const help = args.includes('--help');
  const positionalArgs = args.filter((arg) => !arg.startsWith('-'));
  const [targetArg] = positionalArgs;

  return { force, skipPrompts, help, targetArg };
}
