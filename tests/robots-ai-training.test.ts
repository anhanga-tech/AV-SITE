import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Crawlers obey only their most specific group. Resolve each agent's group the way
// RFC 9309 does: the group naming the agent wins, otherwise `*`.
async function groupFor(agent: string): Promise<string[]> {
  const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
  const groups = robots
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((line) => line.replace(/#.*/, '').trim()).filter(Boolean))
    .filter((lines) => lines.some((line) => /^User-agent:/i.test(line)));
  const named = (lines: string[], name: string) =>
    lines.some((line) => line.toLowerCase() === `user-agent: ${name.toLowerCase()}`);
  return groups.find((lines) => named(lines, agent)) ?? groups.find((lines) => named(lines, '*')) ?? [];
}

const blocksSite = (rules: string[]) => rules.some((line) => /^Disallow:\s*\/\s*$/i.test(line));

const TRAINING_CRAWLERS = [
  'GPTBot', 'ClaudeBot', 'anthropic-ai', 'Claude-Web', 'Google-Extended',
  'Applebot-Extended', 'Amazonbot', 'Meta-ExternalAgent', 'CCBot', 'Bytespider'
];

// Search and user-initiated fetchers drive AI answer visibility: they must keep access.
const SEARCH_AND_ANSWER_CRAWLERS = [
  'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot',
  'Claude-User', 'Bingbot', 'Googlebot', 'Applebot', 'FacebookBot'
];

test('robots.txt blocks every AI training crawler, matching Content-Signal ai-train=no', async () => {
  const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /Content-Signal:.*ai-train=no/);
  for (const agent of TRAINING_CRAWLERS) {
    assert.ok(blocksSite(await groupFor(agent)), `${agent} should be disallowed from /`);
  }
});

test('robots.txt keeps AI search and answer crawlers allowed', async () => {
  for (const agent of SEARCH_AND_ANSWER_CRAWLERS) {
    assert.ok(!blocksSite(await groupFor(agent)), `${agent} must not be disallowed from /`);
  }
});
