import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { collectBlogPostMeta } from '../lib/blog-manifest.ts';

test('collectBlogPostMeta reads MDX frontmatter and ignores template files', async () => {
  const blogDir = await mkdtemp(path.join(os.tmpdir(), 'blog-manifest-'));

  try {
    await writeFile(
      path.join(blogDir, '_template.mdx'),
      `---
title: "Template"
excerpt: "Template"
date: "2026-04-01"
author: "equipe-anhanga"
category: "Template"
image: "https://example.com/template.jpg"
featured: false
tags: ["template"]
---

Template body.
`,
      'utf8'
    );

    await writeFile(
      path.join(blogDir, 'older-post.mdx'),
      `---
title: "Older Post"
excerpt: "Older excerpt"
date: "2026-03-01"
author: "equipe-anhanga"
category: "Cruzeiros"
image: "https://example.com/older.jpg"
featured: false
---

Older body with enough words to count as a post.
`,
      'utf8'
    );

    await writeFile(
      path.join(blogDir, 'newer-post.mdx'),
      `---
title: "Newer Post"
excerpt: "Newer excerpt"
date: "2026-03-20"
author: "ana-souza"
category: "Disney"
image: "https://example.com/newer.jpg"
featured: true
tags: ["disney", "planejamento"]
---

Newer body with multiple words so the reading time is derived from the markdown content.
`,
      'utf8'
    );

    const posts = await collectBlogPostMeta(blogDir);

    assert.equal(posts.length, 2);
    assert.deepEqual(
      posts.map((post) => post.slug),
      ['newer-post', 'older-post']
    );
    assert.equal(posts[0].title, 'Newer Post');
    assert.equal(posts[0].featured, true);
    assert.deepEqual(posts[0].tags, ['disney', 'planejamento']);
    assert.equal(posts[1].title, 'Older Post');
    assert.deepEqual(posts[1].tags, []);
    assert.match(posts[0].readingTime, /^\d+ min de leitura$/);
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});

test('collectBlogPostMeta keeps same-day posts in slug order', async () => {
  const blogDir = await mkdtemp(path.join(os.tmpdir(), 'blog-manifest-same-day-'));

  try {
    for (const slug of ['same-day-a', 'same-day-b', 'same-day-c']) {
      await writeFile(
        path.join(blogDir, `${slug}.mdx`),
        `---
title: "${slug}"
excerpt: "${slug}"
date: "2026-03-20"
author: "equipe-anhanga"
category: "Cruzeiros"
image: "https://example.com/${slug}.jpg"
featured: false
---

Body for ${slug}.
`,
        'utf8'
      );
    }

    const posts = await collectBlogPostMeta(blogDir);

    assert.deepEqual(
      posts.map((post) => post.slug),
      ['same-day-a', 'same-day-b', 'same-day-c']
    );
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});
