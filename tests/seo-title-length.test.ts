import test from 'node:test';
import assert from 'node:assert/strict';

import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';

// O componente Seo anexa " | Anhangá Viagens" (+18 chars) quando o title não
// contém a marca. SERPs truncam por volta de 60 chars (auditoria Ahrefs jun/2026).
const SUFFIX_LENGTH = ' | Anhangá Viagens'.length;
const MAX_TITLE = 60;

test('every blog post renders a <title> within 60 characters', () => {
  const offenders: string[] = [];

  for (const post of BLOG_POST_MANIFEST) {
    const title = post.seoTitle ?? post.title;
    const rendered = title.includes('Anhangá Viagens') ? title.length : title.length + SUFFIX_LENGTH;
    if (rendered > MAX_TITLE) {
      offenders.push(`${post.slug}: ${rendered} chars`);
    }
  }

  assert.deepEqual(offenders, [], `titles over ${MAX_TITLE} chars:\n${offenders.join('\n')}`);
});

test('every blog post renders a meta description between 110 and 160 characters', () => {
  const offenders: string[] = [];

  for (const post of BLOG_POST_MANIFEST) {
    const description = post.seoDescription ?? post.excerpt;
    if (description.length < 110 || description.length > 160) {
      offenders.push(`${post.slug}: ${description.length} chars`);
    }
  }

  assert.deepEqual(offenders, [], `descriptions out of 110–160 range:\n${offenders.join('\n')}`);
});
