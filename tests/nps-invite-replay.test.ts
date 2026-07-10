import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeNpsInviteOnce } from '../lib/nps-invite-replay.ts';

function uid(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test('consumeNpsInviteOnce allows the first use and rejects a replay', async () => {
    const jti = `jti-${uid()}`;

    const first = await consumeNpsInviteOnce(jti, 60);
    const second = await consumeNpsInviteOnce(jti, 60);

    assert.equal(first, true, 'first use should be allowed');
    assert.equal(second, false, 'replay of the same jti should be rejected');
});

test('consumeNpsInviteOnce treats distinct jtis independently', async () => {
    const jtiA = `jti-a-${uid()}`;
    const jtiB = `jti-b-${uid()}`;

    assert.equal(await consumeNpsInviteOnce(jtiA, 60), true);
    assert.equal(await consumeNpsInviteOnce(jtiB, 60), true);
});
