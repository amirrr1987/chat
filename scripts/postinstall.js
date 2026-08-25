const fs = require('fs');
const { execSync } = require('child_process');

// Skip when only package.json was copied (Docker deps stage)
if (!fs.existsSync('packages/shared/tsconfig.json')) {
  process.exit(0);
}

execSync('pnpm --filter @arazchat/shared build', { stdio: 'inherit' });
