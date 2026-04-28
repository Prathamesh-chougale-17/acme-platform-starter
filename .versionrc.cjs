module.exports = {
  bumpFiles: [
    {
      filename: 'package.json',
      type: 'json',
    },
    {
      filename: 'packages/shared/src/constants.ts',
      updater: 'scripts/standard-version-app-version-updater.cjs',
    },
  ],
};
