import { BLOG_POST_MANIFEST } from '../data/blogManifest';
import type { PostMeta } from '../types/blog';

export type { PostMeta } from '../types/blog';

export function getAllPosts(): PostMeta[] {
  return BLOG_POST_MANIFEST;
}
