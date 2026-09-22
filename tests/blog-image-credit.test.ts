import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const BLOG_DIR = path.resolve(process.cwd(), 'content/blog');
const STATUS_PATTERN = /^imageCreditStatus:\s*["']?(confirmed|unknown)["']?\s*$/m;

function frontmatter(text: string): string {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, 'post must have a YAML frontmatter block');
  return match[1];
}

test('cada capa do blog tem status de crédito documentado', () => {
  const posts = fs.readdirSync(BLOG_DIR).filter(name => name.endsWith('.mdx')).sort();
  assert.ok(posts.length > 0);

  for (const filename of posts) {
    const text = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8');
    const fm = frontmatter(text);
    const status = fm.match(STATUS_PATTERN)?.[1];
    assert.ok(status, `${filename}: imageCreditStatus must be confirmed or unknown`);

    if (status === 'confirmed') {
      for (const field of ['imageCredit', 'imageSource', 'imageLicense', 'imageLicenseUrl', 'imageAdaptation']) {
        assert.match(fm, new RegExp(`^${field}:\\s*.+$`, 'm'), `${filename}: confirmed image must have ${field}`);
      }
    }
  }
});
