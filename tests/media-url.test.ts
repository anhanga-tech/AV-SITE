import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildCloudflareImageUrl,
    resolveMediaUrl,
    selectImagePreset,
    optimizeImageUrl,
} from '../lib/media-url.ts';

test('resolveMediaUrl should keep absolute URLs untouched', () => {
    assert.equal(
        resolveMediaUrl('https://images.example.com/photo.jpg', 'https://media.anhanga.tur.br'),
        'https://images.example.com/photo.jpg',
    );
});

test('resolveMediaUrl should join relative paths with the configured media base URL', () => {
    assert.equal(
        resolveMediaUrl('images/home/hero.jpg', 'https://media.anhanga.tur.br'),
        'https://media.anhanga.tur.br/images/home/hero.jpg',
    );
});

test('selectImagePreset should snap square requests to fixed square presets', () => {
    assert.deepEqual(selectImagePreset(200, 200), {
        id: 'avatar',
        width: 256,
        height: 256,
        fit: 'cover',
    });

    assert.deepEqual(selectImagePreset(600, 600), {
        id: 'square',
        width: 640,
        height: 640,
        fit: 'cover',
    });
});

test('selectImagePreset should snap landscape requests to fixed cover presets', () => {
    assert.deepEqual(selectImagePreset(640, 400), {
        id: 'card',
        width: 640,
        height: 400,
        fit: 'cover',
    });

    assert.deepEqual(selectImagePreset(960, 540), {
        id: 'feature',
        width: 960,
        height: 540,
        fit: 'cover',
    });

    assert.deepEqual(selectImagePreset(1280, 720), {
        id: 'hero',
        width: 1280,
        height: 720,
        fit: 'cover',
    });
});

test('selectImagePreset should use scale-down presets when height is not provided', () => {
    assert.deepEqual(selectImagePreset(800), {
        id: 'inline-sm',
        width: 800,
        fit: 'scale-down',
    });

    assert.deepEqual(selectImagePreset(1400), {
        id: 'inline-lg',
        width: 1200,
        fit: 'scale-down',
    });
});

test('buildCloudflareImageUrl should build a /cdn-cgi/image URL with fixed options', () => {
    const url = buildCloudflareImageUrl(
        '/images/home/hero.jpg',
        'https://media.anhanga.tur.br',
        selectImagePreset(1280, 720),
    );

    assert.equal(
        url,
        'https://media.anhanga.tur.br/cdn-cgi/image/format=auto,quality=85,metadata=none,fit=cover,width=1280,height=720/images/home/hero.jpg',
    );
});

test('optimizeImageUrl should fall back to the resolved source URL when no transform zone is configured', () => {
    assert.equal(
        optimizeImageUrl('images/home/hero.jpg', {
            mediaBaseUrl: 'https://media.anhanga.tur.br',
        }),
        'https://media.anhanga.tur.br/images/home/hero.jpg',
    );
});

test('optimizeImageUrl should fall back to the resolved source URL when transforms are disabled', () => {
    assert.equal(
        optimizeImageUrl('images/home/hero.jpg', {
            mediaBaseUrl: 'https://media.anhanga.tur.br',
            transformZoneUrl: 'https://www.anhanga.tur.br',
            width: 1200,
            height: 675,
        }),
        'https://media.anhanga.tur.br/images/home/hero.jpg',
    );
});

test('optimizeImageUrl should build transformed URLs only when transforms are explicitly enabled', () => {
    assert.equal(
        optimizeImageUrl('images/home/hero.jpg', {
            mediaBaseUrl: 'https://media.anhanga.tur.br',
            transformZoneUrl: 'https://media.anhanga.tur.br',
            enableTransforms: true,
            width: 1200,
            height: 675,
        }),
        'https://media.anhanga.tur.br/cdn-cgi/image/format=auto,quality=85,metadata=none,fit=cover,width=1200,height=675/images/home/hero.jpg',
    );
});

test('optimizeImageUrl should transform absolute media URLs that already point to the transform zone', () => {
    assert.equal(
        optimizeImageUrl('https://media.anhanga.tur.br/images/home/hero.jpg?version=2', {
            transformZoneUrl: 'https://media.anhanga.tur.br',
            enableTransforms: true,
            width: 1200,
            height: 675,
        }),
        'https://media.anhanga.tur.br/cdn-cgi/image/format=auto,quality=85,metadata=none,fit=cover,width=1200,height=675/images/home/hero.jpg?version=2',
    );
});

test('optimizeImageUrl should leave external absolute URLs untouched when using same-zone transforms', () => {
    assert.equal(
        optimizeImageUrl('https://images.pexels.com/photos/2868242/pexels-photo-2868242.jpeg', {
            transformZoneUrl: 'https://media.anhanga.tur.br',
            enableTransforms: true,
            width: 640,
            height: 400,
        }),
        'https://images.pexels.com/photos/2868242/pexels-photo-2868242.jpeg',
    );
});

test('optimizeImageUrl should not double-wrap existing Cloudflare transformation URLs', () => {
    const transformed = 'https://media.anhanga.tur.br/cdn-cgi/image/format=auto,quality=85,width=640/images/home/hero.jpg';

    assert.equal(
        optimizeImageUrl(transformed, {
            transformZoneUrl: 'https://media.anhanga.tur.br',
            enableTransforms: true,
            width: 640,
        }),
        transformed,
    );
});

test('buildCloudflareImageUrl should use format=avif when format is avif', () => {
    const url = buildCloudflareImageUrl(
        '/images/home/hero.jpg',
        'https://media.anhanga.tur.br',
        selectImagePreset(1280, 720),
        'avif',
    );

    assert.equal(
        url,
        'https://media.anhanga.tur.br/cdn-cgi/image/format=avif,quality=85,metadata=none,fit=cover,width=1280,height=720/images/home/hero.jpg',
    );
});

test('buildCloudflareImageUrl should use format=webp when format is webp', () => {
    const url = buildCloudflareImageUrl(
        '/images/home/hero.jpg',
        'https://media.anhanga.tur.br',
        selectImagePreset(640, 400),
        'webp',
    );

    assert.equal(
        url,
        'https://media.anhanga.tur.br/cdn-cgi/image/format=webp,quality=85,metadata=none,fit=cover,width=640,height=400/images/home/hero.jpg',
    );
});

test('optimizeImageUrl should propagate format=avif into the Cloudflare transform URL', () => {
    assert.equal(
        optimizeImageUrl('images/home/hero.jpg', {
            mediaBaseUrl: 'https://media.anhanga.tur.br',
            transformZoneUrl: 'https://media.anhanga.tur.br',
            enableTransforms: true,
            width: 1200,
            height: 675,
            format: 'avif',
        }),
        'https://media.anhanga.tur.br/cdn-cgi/image/format=avif,quality=85,metadata=none,fit=cover,width=1200,height=675/images/home/hero.jpg',
    );
});

test('optimizeImageUrl should propagate format=webp into the Cloudflare transform URL', () => {
    assert.equal(
        optimizeImageUrl('images/home/hero.jpg', {
            mediaBaseUrl: 'https://media.anhanga.tur.br',
            transformZoneUrl: 'https://media.anhanga.tur.br',
            enableTransforms: true,
            width: 800,
            format: 'webp',
        }),
        'https://media.anhanga.tur.br/cdn-cgi/image/format=webp,quality=85,metadata=none,fit=scale-down,width=800/images/home/hero.jpg',
    );
});
