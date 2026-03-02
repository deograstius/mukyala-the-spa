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
    expect(workflow).toContain('STAGING_VITE_API_BASE_URL: https://api.staging.mukyala.com');
    expect(workflow).toContain('PROD_VITE_API_BASE_URL: https://api.mukyala.com');
    expect(workflow).toContain('VITE_API_BASE_URL_VALUE="$STAGING_VITE_API_BASE_URL"');
    expect(workflow).toContain('VITE_API_BASE_URL_VALUE="$PROD_VITE_API_BASE_URL"');
    expect(workflow).toContain('--build-arg VITE_API_BASE_URL="$VITE_API_BASE_URL"');
  });

  it('defaults to staging when deploy target input is missing or empty', () => {
    expect(workflow).toContain(
      "TARGET_INPUT: ${{ github.event_name == 'workflow_dispatch' && inputs.target || 'staging' }}",
    );
    expect(workflow).toContain('TARGET="${TARGET_INPUT:-staging}"');
  });

  it('rejects invalid deploy targets', () => {
    expect(workflow).toContain('options:');
    expect(workflow).toContain('- staging');
    expect(workflow).toContain('- prod');
    expect(workflow).toContain('elif [ "$TARGET" != "staging" ]; then');
    expect(workflow).toContain('echo "Unsupported target: $TARGET" >&2');
    expect(workflow).toContain('exit 1');
  });

  it('fails prod deploys when the prod role ARN is missing', () => {
    expect(workflow).toContain('if [ "$TARGET" = "prod" ] && [ -z "$AWS_ROLE_ARN_VALUE" ]; then');
    expect(workflow).toContain('AWS_PROD_ROLE_ARN must be configured for prod deploys');
    expect(workflow).toContain('exit 1');
  });

  it('wires resolved API base URL to env export before docker build', () => {
    const stagingResolveIdx = workflow.indexOf(
      'VITE_API_BASE_URL_VALUE="$STAGING_VITE_API_BASE_URL"',
    );
    const prodResolveIdx = workflow.indexOf('VITE_API_BASE_URL_VALUE="$PROD_VITE_API_BASE_URL"');
    const exportEnvIdx = workflow.indexOf(
      'echo "VITE_API_BASE_URL=$VITE_API_BASE_URL_VALUE" >> "$GITHUB_ENV"',
    );
    const dockerBuildArgIdx = workflow.indexOf(
      '--build-arg VITE_API_BASE_URL="$VITE_API_BASE_URL"',
    );

    expect(stagingResolveIdx).toBeGreaterThan(-1);
    expect(prodResolveIdx).toBeGreaterThan(stagingResolveIdx);
    expect(exportEnvIdx).toBeGreaterThan(prodResolveIdx);
    expect(dockerBuildArgIdx).toBeGreaterThan(exportEnvIdx);
  });
});
