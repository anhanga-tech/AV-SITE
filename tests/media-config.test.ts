import test from 'node:test';
import assert from 'node:assert/strict';

import { AUTHORS } from '../data/blogData.ts';
import {
    getMediaRuntimeConfig,
    HERO_VIDEOS,
    generateAvifSrcSet,
    generateWebpSrcSet,
    optimizeCloudinaryUrl,
} from '../data/mediaConfig.ts';
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
                VITE_MEDIA_TRANSFORM_ZONE_URL: 'https://media.anhanga.tur.br',
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

test('getMediaRuntimeConfig should memoize the default configuration', () => {
    const config1 = getMediaRuntimeConfig();
    const config2 = getMediaRuntimeConfig();

    // Reference equality check
    assert.equal(config1, config2, 'Default configuration should be memoized');
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
        AUTHORS['queila-oliveira'].image,
        'https://media.anhanga.tur.br/images/authors/queila.jpg',
    );
});

test('generateAvifSrcSet should return empty string when transforms are not enabled', () => {
    // Without VITE_MEDIA_ENABLE_TRANSFORMS=true, optimizeRemoteImageUrl returns
    // the resolved URL without /cdn-cgi/image/ — format param has no effect, so
    // formatted === unformatted and every entry is filtered out.
    const result = generateAvifSrcSet('https://media.anhanga.tur.br/images/destinations/paris.jpg');
    assert.equal(result, '');
});

test('generateWebpSrcSet should return empty string when transforms are not enabled', () => {
    const result = generateWebpSrcSet('https://media.anhanga.tur.br/images/destinations/paris.jpg');
    assert.equal(result, '');
});

test('optimizeCloudinaryUrl should pass format to the underlying helper (not silently ignore it)', () => {
    // When transforms are disabled the URL falls back to the resolved source, so
    // format has no visible effect — but the function must not throw and must not
    // return a string containing the *wrong* format token.
    const withAuto = optimizeCloudinaryUrl('https://media.anhanga.tur.br/images/destinations/paris.jpg', 800, 'auto');
    const withWebp = optimizeCloudinaryUrl('https://media.anhanga.tur.br/images/destinations/paris.jpg', 800, 'webp');
    const withAvif = optimizeCloudinaryUrl('https://media.anhanga.tur.br/images/destinations/paris.jpg', 800, 'avif');

    // All three should resolve to the same plain URL when transforms are off.
    assert.equal(withAuto, 'https://media.anhanga.tur.br/images/destinations/paris.jpg');
    assert.equal(withWebp, 'https://media.anhanga.tur.br/images/destinations/paris.jpg');
    assert.equal(withAvif, 'https://media.anhanga.tur.br/images/destinations/paris.jpg');
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
