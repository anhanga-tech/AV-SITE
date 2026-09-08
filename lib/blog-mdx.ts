import type React from 'react';

type MdxModule = { default: React.ComponentType };

const mdxLoaders = import.meta.glob<MdxModule>('/content/blog/*.mdx');
const loadedModules = new Map<string, MdxModule>();
const pendingModules = new Map<string, Promise<MdxModule>>();
const failedModules = new Map<string, unknown>();

function moduleKey(slug: string): string {
  return `/content/blog/${slug}.mdx`;
}

export function getBlogSlugFromUrl(url: string): string | null {
  const pathname = new URL(url, 'https://prerender.local').pathname;
  const match = pathname.match(/^\/blog\/([a-zA-Z0-9-]+)\/?$/);
  return match?.[1] ?? null;
}

export function preloadBlogPostMdx(slug: string): Promise<MdxModule | null> {
  const key = moduleKey(slug);
  const loaded = loadedModules.get(key);
  if (loaded) return Promise.resolve(loaded);

  const loader = mdxLoaders[key];
  if (!loader) return Promise.resolve(null);

  const pending = pendingModules.get(key);
  if (pending) return pending;

  const request = loader()
    .then((module) => {
      loadedModules.set(key, module);
      pendingModules.delete(key);
      return module;
    })
    .catch((error: unknown) => {
      pendingModules.delete(key);
      // Cache the rejection so Suspense does not retry a chunk that is known to
      // be unavailable, and rethrow so the route's error boundary can recover.
      failedModules.set(key, error);
      throw error;
    });
  pendingModules.set(key, request);
  return request;
}

export async function preloadBlogPostMdxForUrl(url: string): Promise<void> {
  const slug = getBlogSlugFromUrl(url);
  if (slug) await preloadBlogPostMdx(slug);
}

/**
 * Returns synchronously after the route bootstrap has preloaded its article.
 * During SPA navigation, throwing the one-article promise lets the existing
 * route Suspense boundary wait without downloading any other post bodies.
 */
export function readBlogPostMdx(slug: string): React.ComponentType | null {
  const key = moduleKey(slug);
  const loaded = loadedModules.get(key);
  if (loaded) return loaded.default;
  if (failedModules.has(key)) {
    // The chunk already rejected once (stale-cache reload exhausted or a
    // persistent failure): surface the failure instead of throwing a new
    // promise that keeps the route in its Suspense fallback forever.
    throw failedModules.get(key);
  }
  if (!mdxLoaders[key]) return null;

  throw preloadBlogPostMdx(slug);
}
