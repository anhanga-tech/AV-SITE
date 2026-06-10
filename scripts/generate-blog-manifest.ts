import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeBlogManifest, writeBlogMarkdown } from '../lib/blog-manifest.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const blogDir = path.join(rootDir, 'content', 'blog');
const outputFile = path.join(rootDir, 'data', 'blogManifest.ts');
const markdownOutputFile = path.join(rootDir, 'data', 'blogMarkdown.ts');

const posts = await writeBlogManifest(blogDir, outputFile);
const markdownCount = await writeBlogMarkdown(blogDir, markdownOutputFile);

console.log(`✓ Generated blog manifest with ${posts.length} posts at data/blogManifest.ts`);
console.log(`✓ Generated blog markdown module with ${markdownCount} posts at data/blogMarkdown.ts`);
