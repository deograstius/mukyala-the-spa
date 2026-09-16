import { build } from 'vite';

// Admin (staff back-office) build — vite's process lingers after build, so
// exit explicitly (same reason scripts/build-docker.mjs exists).
try {
  await build({ configFile: 'vite.admin.config.ts' });
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
