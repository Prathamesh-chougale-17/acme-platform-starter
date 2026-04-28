const APP_VERSION_EXPORT = /^export\s+const\s+APP_VERSION\s*=\s*['"]([^'"]+)['"];?/m;

function matchAppVersion(contents) {
  const match = APP_VERSION_EXPORT.exec(contents);

  if (!match) {
    throw new Error('APP_VERSION export was not found in constants.ts.');
  }

  return match;
}

module.exports.readVersion = function readVersion(contents) {
  return matchAppVersion(contents)[1];
};

module.exports.writeVersion = function writeVersion(contents, version) {
  return contents.replace(matchAppVersion(contents)[0], `export const APP_VERSION = '${version}';`);
};
