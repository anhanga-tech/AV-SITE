import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
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
    assert.equal(posts[1].dateModified, undefined);
    assert.match(posts[0].readingTime, /^\d+ min de leitura$/);
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});

test('collectBlogPostMeta keeps same-day posts in slug order', async () => {
  const blogDir = await mkdtemp(path.join(os.tmpdir(), 'blog-manifest-same-day-'));

  try {
    await Promise.all(
      ['same-day-a', 'same-day-b', 'same-day-c'].map((slug) =>
        writeFile(
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
        )
      ),
    );

    const posts = await collectBlogPostMeta(blogDir);

    assert.deepEqual(
      posts.map((post) => post.slug),
      ['same-day-a', 'same-day-b', 'same-day-c']
    );
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});

test('collectBlogPostMeta normalizes YAML dates into ISO strings', async () => {
  const blogDir = await mkdtemp(path.join(os.tmpdir(), 'blog-manifest-yaml-date-'));

  try {
    await writeFile(
      path.join(blogDir, 'yaml-date-post.mdx'),
      `---
title: "YAML Date Post"
excerpt: "YAML date excerpt"
date: 2026-04-25
dateModified: 2026-04-26
author: "equipe-anhanga"
category: "Cruzeiros"
image: "https://example.com/yaml-date-post.jpg"
featured: false
---

Body for yaml date post.
`,
      'utf8',
    );

    const [post] = await collectBlogPostMeta(blogDir);

    assert.equal(post.date, '2026-04-25');
    assert.equal(post.dateModified, '2026-04-26');
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});

test('collectBlogPostMeta passes through faq frontmatter for FAQPageSchema', async () => {
  const blogDir = await mkdtemp(path.join(os.tmpdir(), 'blog-manifest-faq-'));

  try {
    await writeFile(
      path.join(blogDir, 'faq-post.mdx'),
      `---
title: "FAQ Post"
excerpt: "FAQ excerpt"
date: "2026-04-01"
author: "equipe-anhanga"
category: "Planejamento"
image: "https://example.com/faq-post.jpg"
featured: false
faq:
  - question: "Pergunta um?"
    answer: "Resposta um."
  - question: "Pergunta dois?"
    answer: "Resposta dois."
---

Body with a FAQ section.
`,
      'utf8',
    );

    const [post] = await collectBlogPostMeta(blogDir);

    assert.deepEqual(post.faq, [
      { question: 'Pergunta um?', answer: 'Resposta um.' },
      { question: 'Pergunta dois?', answer: 'Resposta dois.' },
    ]);
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});

test('collectBlogPostMeta leaves faq undefined when frontmatter omits it', async () => {
  const blogDir = await mkdtemp(path.join(os.tmpdir(), 'blog-manifest-no-faq-'));

  try {
    await writeFile(
      path.join(blogDir, 'no-faq-post.mdx'),
      `---
title: "No FAQ Post"
excerpt: "No FAQ excerpt"
date: "2026-04-01"
author: "equipe-anhanga"
category: "Planejamento"
image: "https://example.com/no-faq-post.jpg"
featured: false
---

Body without a FAQ section.
`,
      'utf8',
    );

    const [post] = await collectBlogPostMeta(blogDir);

    assert.equal(post.faq, undefined);
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});

test('blog content filenames stay ASCII slug-safe for canonical URLs', async () => {
  const filenames = await readdir(new URL('../content/blog', import.meta.url));

  const invalidFilenames = filenames.filter(
    (filename) => filename.endsWith('.mdx') && !filename.startsWith('_') && !/^[a-z0-9-]+\.mdx$/.test(filename),
  );

  assert.deepEqual(invalidFilenames, []);
});
