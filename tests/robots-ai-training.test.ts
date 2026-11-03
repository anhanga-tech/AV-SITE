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

// RFC 9309: on equal-length matches `Allow` wins, so `Allow: /` cancels `Disallow: /`.
const blocksSite = (rules: string[]) =>
  rules.some((line) => /^Disallow:\s*\/\s*$/i.test(line)) &&
  !rules.some((line) => /^Allow:\s*\/\s*$/i.test(line));

// Search, answer and training crawlers all keep access: being in model training is a
// deliberate choice (small brand recognition), declared as `ai-train=yes`.
const AI_CRAWLERS = [
  'GPTBot', 'ClaudeBot', 'anthropic-ai', 'Claude-Web', 'Google-Extended', 'Applebot-Extended',
  'Amazonbot', 'Meta-ExternalAgent', 'CCBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot',
  'Perplexity-User', 'Claude-SearchBot', 'Claude-User', 'Bingbot', 'Googlebot', 'Applebot',
  'FacebookBot'
];

// Bulk scrapers stay blocked to reduce load.
const BLOCKED_SCRAPERS = ['Bytespider'];

test('robots.txt allows AI search, answer and training crawlers', async () => {
  for (const agent of AI_CRAWLERS) {
    assert.ok(!blocksSite(await groupFor(agent)), `${agent} must not be disallowed from /`);
  }
});

test('robots.txt keeps bulk scrapers blocked', async () => {
  for (const agent of BLOCKED_SCRAPERS) {
    assert.ok(blocksSite(await groupFor(agent)), `${agent} should be disallowed from /`);
  }
});

// The Content-Signal must not contradict the crawler rules above (the old file said
// ai-train=no while allowing GPTBot, ClaudeBot and Google-Extended).
test('robots.txt Content-Signal matches the training crawler policy', async () => {
  const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /^Content-Signal:.*\bai-train=yes\b/m);
  assert.doesNotMatch(robots, /ai-train=no/);
});
