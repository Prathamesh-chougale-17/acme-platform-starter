export interface WizardResult {
  targetArg: string;
  packageManager: string;
  includeObservability: boolean;
  includeRedis: boolean;
}

export const runWizard = async (initialTarget: string | undefined): Promise<WizardResult> => {
  const { intro, outro, text, select, multiselect, isCancel, cancel } =
    await import('@clack/prompts');

  intro('create-acme-platform');

  let targetArg = initialTarget;

  if (!targetArg) {
    const nameAnswer = await text({
      message: 'Where should we create your project?',
      placeholder: './my-acme-app',
      validate(value) {
        const trimmed = (value ?? '').trim();
        if (!trimmed) return 'Please enter a directory name.';
        if (trimmed === '.' || trimmed === './') return 'Please choose a sub-directory name.';
      },
    });
    if (isCancel(nameAnswer)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }
    targetArg = (nameAnswer as string).trim();
  }

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

  const featureAnswer = await multiselect({
    message: 'Which optional features do you want to include?',
    options: [
      {
        value: 'observability',
        label: 'Observability stack',
        hint: 'Grafana, Loki, Tempo, Prometheus, OTel package — removed if deselected',
      },
      {
        value: 'redis',
        label: 'Async jobs / Redis (BullMQ)',
        hint: '@acme/jobs, API worker, Redis service, and async CI — removed if deselected',
      },
    ],
    initialValues: ['observability', 'redis'],
  });
  if (isCancel(featureAnswer)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  outro('Setting up your project...');

  return {
    targetArg: targetArg as string,
    packageManager: pmAnswer as string,
    includeObservability: (featureAnswer as string[]).includes('observability'),
    includeRedis: (featureAnswer as string[]).includes('redis'),
  };
};
