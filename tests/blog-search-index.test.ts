import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBlogSearchIndex, filterBlogSearchIndex } from '../utils/blog.ts';

interface FakePost {
  title: string;
  category: string;
  tags: string[];
}

const POSTS: FakePost[] = [
  { title: 'Dicas para Orlando', category: 'Destinos', tags: ['Disney', 'Parques'] },
  { title: 'Roteiro de Lisboa', category: 'Europa', tags: ['Portugal', 'Cidade'] },
  { title: 'Cruzeiros no Brasil', category: 'Curadoria', tags: ['Navio', 'Litoral'] },
];

// Reference implementation matching the previous per-field filter, used to prove
// the indexed filter keeps identical matching semantics.
function referenceFilter(posts: FakePost[], rawTerm: string): FakePost[] {
  const term = rawTerm.toLowerCase();
  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(term) ||
      post.category.toLowerCase().includes(term) ||
      post.tags.some((tag) => tag.toLowerCase().includes(term)),
  );
}

test('empty term returns every post in original order', () => {
  const index = buildBlogSearchIndex(POSTS);
  assert.deepEqual(filterBlogSearchIndex(index, ''), POSTS);
});

test('matches by title, category, or tag, case-insensitively', () => {
  const index = buildBlogSearchIndex(POSTS);

  assert.deepEqual(filterBlogSearchIndex(index, 'orlando'), [POSTS[0]]);
  assert.deepEqual(filterBlogSearchIndex(index, 'EUROPA'), [POSTS[1]]);
  assert.deepEqual(filterBlogSearchIndex(index, 'navio'), [POSTS[2]]);
});

test('non-matching term returns an empty list', () => {
  const index = buildBlogSearchIndex(POSTS);
  assert.deepEqual(filterBlogSearchIndex(index, 'zzz-nada'), []);
});

test('a term never matches across two different fields', () => {
  // "destinosdicas" would only match if fields were concatenated without a
  // separator; the "\n" join must prevent a cross-field false positive.
  const index = buildBlogSearchIndex(POSTS);
  assert.deepEqual(filterBlogSearchIndex(index, 'destinosdicas'), []);
});

test('indexed filter matches the reference per-field filter for many terms', () => {
  const index = buildBlogSearchIndex(POSTS);
  const terms = ['', 'o', 'DI', 'lisboa', 'curadoria', 'parques', 'z', 'brasil', 'Cidade'];

  for (const term of terms) {
    assert.deepEqual(
      filterBlogSearchIndex(index, term),
      referenceFilter(POSTS, term),
      `mismatch for term "${term}"`,
    );
  }
});
