/**
 * Notifies the social-media automation pipeline when a new blog post lands on
 * `main`. Invoked by `.github/workflows/notify-social-automation.yml` with the
 * list of newly added `content/blog/*.mdx` paths (newline-separated in
 * `ADDED_BLOG_FILES` — passed via env rather than interpolated into the shell
 * command to avoid script injection from file names); posts one announcement
 * payload per file to the n8n webhook that schedules the post in Postiz.
 *
 * Not wired into `pnpm build`/`pnpm dev` — this only runs in CI, after merge.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { buildBlogAnnouncementPayload } from '../lib/social-announcement.ts';
import type { BlogPostFrontmatter } from '../types/blog';

const webhookUrl = process.env.N8N_SOCIAL_ANNOUNCE_WEBHOOK_URL?.trim();
const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim();

async function dispatchAnnouncement(filepath: string, url: string, secret: string): Promise<boolean> {
  const slug = path.basename(filepath, '.mdx');
  const raw = await readFile(filepath, 'utf8');
  const { data } = matter(raw);
  const payload = buildBlogAnnouncementPayload(slug, data as BlogPostFrontmatter);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': secret,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(`✗ ${slug}: n8n respondeu ${response.status}`);
    return false;
  }

  console.log(`✓ ${slug}: anúncio enviado para o n8n`);
  return true;
}

function readFileList(): string[] {
  const fromEnv = process.env.ADDED_BLOG_FILES ?? '';
  const fromArgv = process.argv.slice(2);
  const combined = fromArgv.length > 0 ? fromArgv : fromEnv.split('\n');
  return combined.map((line) => line.trim()).filter(Boolean);
}

async function main(): Promise<void> {
  const files = readFileList();

  if (files.length === 0) {
    console.log('Nenhum post novo para anunciar.');
    return;
  }

  if (!webhookUrl || !webhookSecret) {
    console.log('N8N_SOCIAL_ANNOUNCE_WEBHOOK_URL ou N8N_WEBHOOK_SECRET não configurados — pulando automação social.');
    return;
  }

  const results = await Promise.all(files.map((filepath) => dispatchAnnouncement(filepath, webhookUrl, webhookSecret)));

  if (results.some((ok) => !ok)) {
    process.exitCode = 1;
  }
}

await main();
