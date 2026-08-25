const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sharedDir = path.join('packages', 'shared');

// Skip when only package.json was copied (Docker deps stage)
if (!fs.existsSync(path.join(sharedDir, 'tsconfig.json'))) {
  process.exit(0);
}

// A filtered install (e.g. `pnpm install --filter @arazchat/web`) leaves the
// shared package without its own dependencies, so `tsc` would fail and abort
// the whole install. Build only once shared can actually resolve them.
try {
  require.resolve('zod', { paths: [path.resolve(sharedDir)] });
} catch {
  console.warn(
    '[postinstall] Skipping @arazchat/shared build: dependencies are not installed yet. ' +
      'Run `pnpm install` (without --filter) to build it.',
  );
  process.exit(0);
}

execSync('pnpm --filter @arazchat/shared build', { stdio: 'inherit' });
