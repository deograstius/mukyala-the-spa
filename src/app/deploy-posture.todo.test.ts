import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = path.resolve(__dirname, '../../.github/workflows/deploy.yml');
const workflow = readFileSync(workflowPath, 'utf8');

describe('staging frontend deploy workflow posture', () => {
  it('pins release images to the immutable commit SHA', () => {
    expect(workflow).toContain(':${GITHUB_SHA}');
    expect(workflow).not.toMatch(/:latest\b/);
  });

  it('sets the staging API base URL at build time', () => {
    expect(workflow).toContain('VITE_API_BASE_URL=https://api.staging.mukyala.com');
  });
});
