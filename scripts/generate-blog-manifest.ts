import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeBlogManifest } from '../lib/blog-manifest.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const blogDir = path.join(rootDir, 'content', 'blog');
const outputFile = path.join(rootDir, 'data', 'blogManifest.ts');

const posts = await writeBlogManifest(blogDir, outputFile);

console.log(`✓ Generated blog manifest with ${posts.length} posts at data/blogManifest.ts`);
