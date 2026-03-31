import test from 'node:test';
import assert from 'node:assert/strict';

import { AUTHORS } from '../data/blogData.ts';
import { getMediaRuntimeConfig, HERO_VIDEOS } from '../data/mediaConfig.ts';
import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';

test('getMediaRuntimeConfig should enable same-host transforms from env values', () => {
    assert.deepEqual(
        getMediaRuntimeConfig(
            {
                VITE_MEDIA_BASE_URL: 'https://media.anhanga.tur.br',
                VITE_MEDIA_TRANSFORM_ZONE_URL: 'https://media.anhanga.tur.br',
                VITE_MEDIA_ENABLE_TRANSFORMS: 'true',
            },
            {
                hostname: 'www.anhanga.tur.br',
                origin: 'https://www.anhanga.tur.br',
            },
        ),
        {
            mediaBaseUrl: 'https://media.anhanga.tur.br',
            transformZoneUrl: 'https://media.anhanga.tur.br',
            enableTransforms: true,
        },
    );
});

test('getMediaRuntimeConfig should accept quoted boolean env values', () => {
    assert.deepEqual(
        getMediaRuntimeConfig(
            {
                VITE_MEDIA_BASE_URL: 'https://media.anhanga.tur.br',
                VITE_MEDIA_ENABLE_TRANSFORMS: '"true"',
            },
            {
                hostname: 'www.anhanga.tur.br',
                origin: 'https://www.anhanga.tur.br',
            },
        ),
        {
            mediaBaseUrl: 'https://media.anhanga.tur.br',
            transformZoneUrl: 'https://media.anhanga.tur.br',
            enableTransforms: true,
        },
    );
});

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

test('migrated blog cover images should be serialized as absolute URLs', () => {
    const migratedPosts = BLOG_POST_MANIFEST.filter((post) =>
        [
            'guia-definitivo-sobrevivencia-festivais',
            'malas-de-mao-o-guia-definitivo',
            'nova-york-no-natal',
        ].includes(post.slug),
    );

    assert.deepEqual(
        migratedPosts.map((post) => post.image),
        [
            'https://media.anhanga.tur.br/images/blog/guia-festivais.jpg',
            'https://media.anhanga.tur.br/images/blog/malas-de-mao.jpg',
            'https://media.anhanga.tur.br/images/blog/nova-york-natal.jpg',
        ],
    );
});
