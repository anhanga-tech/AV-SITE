import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { PROPOSAL_OPENS_RETENTION_SECONDS } from '../lib/proposal-opens.ts';
import { checkProposalKeyRetention, PROPOSAL_RETENTION_LIMITS } from '../lib/proposal-retention.ts';
import { PROPOSAL_TOMBSTONE_GRACE_SECONDS, PROPOSAL_VALIDITY_SECONDS } from '../lib/proposal-store.ts';

// P12 (#1902): the daily audit proves no proposal key outlives decision D5.

const DAY = 24 * 60 * 60;
const ID = 'AbCdEfGhIjKlMnOp';

test('the audit limits are the TTLs the store and the open log write', () => {
    assert.deepEqual(PROPOSAL_RETENTION_LIMITS, {
        'proposta:rec': PROPOSAL_VALIDITY_SECONDS,
        'proposta:exp': PROPOSAL_VALIDITY_SECONDS + PROPOSAL_TOMBSTONE_GRACE_SECONDS,
        'proposta:abr': PROPOSAL_OPENS_RETENTION_SECONDS,
    });
});

test('a key within its limit passes, up to the limit itself', () => {
    assert.equal(checkProposalKeyRetention(`proposta:rec:${ID}`, 15 * DAY), 'ok');
    assert.equal(checkProposalKeyRetention(`proposta:exp:${ID}`, 45 * DAY), 'ok');
    assert.equal(checkProposalKeyRetention(`proposta:abr:${ID}`, 1), 'ok');
});

test('a key past its limit or without a TTL fails', () => {
    assert.equal(checkProposalKeyRetention(`proposta:rec:${ID}`, 15 * DAY + 1), 'over_limit');
    assert.equal(checkProposalKeyRetention(`proposta:abr:${ID}`, 90 * DAY + 1), 'over_limit');
    assert.equal(checkProposalKeyRetention(`proposta:exp:${ID}`, -1), 'no_ttl');
});

test('a key that vanished between SCAN and TTL is not a violation, even with an unknown prefix', () => {
    assert.equal(checkProposalKeyRetention(`proposta:rec:${ID}`, -2), 'gone');
    assert.equal(checkProposalKeyRetention('proposta:sal:2026-10-22', -2), 'gone');
});

test('keys outside the known prefixes fail, including the retired IP salt', () => {
    assert.equal(checkProposalKeyRetention('proposta:sal:2026-10-22', 2 * DAY), 'unknown_key');
    assert.equal(checkProposalKeyRetention('proposta:rec', 10), 'unknown_key');
    assert.equal(checkProposalKeyRetention('proposta:rec:', 10), 'unknown_key');
    assert.equal(checkProposalKeyRetention('proposta:nova:x', 10), 'unknown_key');
});

test('the audit workflow runs daily without installing dependencies next to the Redis token', async () => {
    const text = await readFile(new URL('../.github/workflows/proposal-retention-audit.yml', import.meta.url), 'utf8');
    const workflow = text.split('\n').filter((line) => !line.trim().startsWith('#')).join('\n');
    assert.match(workflow, /^\s+- cron: /m);
    assert.match(workflow, /^permissions:\n {2}contents: read$/m);
    assert.match(workflow, /persist-credentials: false/);
    assert.doesNotMatch(workflow, /pnpm|npm (ci|install)|yarn/);
    assert.match(workflow, /run: node scripts\/audit-proposal-retention\.ts/);
});
