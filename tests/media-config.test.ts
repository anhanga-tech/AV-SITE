import test from 'node:test';
import assert from 'node:assert/strict';

import { AUTHORS } from '../data/blogData.ts';
import { HERO_VIDEOS } from '../data/mediaConfig.ts';

test('hero media should point to the Cloudflare R2 origin', () => {
    assert.deepEqual(
        HERO_VIDEOS.map((video) => video.url),
        [
            'https://media.anhanga.tur.br/videos/hero/rio.mp4',
            'https://media.anhanga.tur.br/videos/hero/paris.mp4',
            'https://media.anhanga.tur.br/videos/hero/maldivas.mp4',
            'https://media.anhanga.tur.br/videos/hero/new-york.mp4',
            'https://media.anhanga.tur.br/videos/hero/natureza.mp4',
        ],
    );

    assert.deepEqual(
        HERO_VIDEOS.map((video) => video.poster),
        [
            'https://media.anhanga.tur.br/images/hero/rio-poster.jpg',
            'https://media.anhanga.tur.br/images/hero/paris-poster.jpg',
            'https://media.anhanga.tur.br/images/hero/maldivas-poster.jpg',
            'https://media.anhanga.tur.br/images/hero/new-york-poster.jpg',
            'https://media.anhanga.tur.br/images/hero/natureza-poster.jpg',
        ],
    );
});

test('migrated author avatars should use the Cloudflare R2 origin', () => {
    assert.equal(
        AUTHORS.luigi.image,
        'https://media.anhanga.tur.br/images/authors/chef-luigi.jpg',
    );
});
