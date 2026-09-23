const path = require('node:path');
const { workerData } = require('node:worker_threads');

const workerPath = workerData?.workerScript;
if (!workerPath) {
  throw new Error('Missing workerData.workerScript');
}

if (workerPath.endsWith('.ts')) {
  const { createJiti } = require('jiti');
  const jiti = createJiti(__filename, {
    interopDefault: true,
    esmResolve: true,
    alias: { '@shared': path.resolve(__dirname, '../shared') },
  });
  module.exports = jiti(workerPath);
} else {
  module.exports = require(workerPath);
}