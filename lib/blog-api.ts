import { BlogPost } from '../data/blogData';

export const BLOG_RSS_URL = 'https://blog.anhanga.tur.br/rss/';
export const BLOG_POSTS_API_PATH = '/api/blog-posts';
export const DEFAULT_BLOG_POST_LIMIT = 4;
export const MAX_BLOG_POST_LIMIT = 10;

const COLORS = [
    'text-blue-600 bg-blue-50 border-blue-200',
    'text-emerald-600 bg-emerald-50 border-emerald-200',
    'text-green-600 bg-green-50 border-green-200',
    'text-pink-600 bg-pink-50 border-pink-200',
    'text-red-600 bg-red-50 border-red-200',
    'text-orange-600 bg-orange-50 border-orange-200'
];

const ROTATIONS = ['rotate-0', '-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1'];

function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month}, ${year}`;
    } catch {
        return dateString;
    }
}

function extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    if (!match) return '';
    const content = match[1] || match[2] || '';
    return content.trim();
}

function extractAttribute(xml: string, tag: string, attr: string): string {
    const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
}

/**
 * Aggressive HTML escaping to prevent XSS.
 */
function escapeHTML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Robust sanitization that works both in Browser and Edge/Node environments.
 */
function safeSanitize(text: string): string {
    if (!text) return '';
    // Remove all angle brackets to ensure no tag-like sequences (e.g. "<script") remain
    const withoutAngles = text.replace(/[<>]/g, '');
    // Then escape potential characters that could be used for injection
    return escapeHTML(withoutAngles);
}

/**
 * Validates and sanitizes image URLs to prevent data: or javascript: URI injection.
 */
function safeImageUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    // Only allow absolute HTTP(S) URLs to prevent javascript: or data: URI injection
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return '';
    return escapeHTML(trimmed);
}

function stripHtmlTags(text: string): string {
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function buildExcerpt(rawDescription: string): string {
    const normalized = decodeHtmlEntities(stripHtmlTags(rawDescription));
    if (normalized.length <= 150) return normalized;
    return `${normalized.substring(0, 150).trim()}...`;
}

function isBlogPost(value: unknown): value is BlogPost {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Partial<BlogPost>;
    return typeof candidate.id === 'number'
        && typeof candidate.slug === 'string'
        && typeof candidate.title === 'string'
        && typeof candidate.excerpt === 'string'
        && typeof candidate.content === 'string'
        && typeof candidate.image === 'string'
        && typeof candidate.category === 'string'
        && typeof candidate.date === 'string'
        && typeof candidate.author === 'string'
        && typeof candidate.color === 'string'
        && typeof candidate.rotate === 'string';
}

export function sanitizePostsLimit(limit: string | number | null | undefined): number {
    if (typeof limit === 'number' && Number.isFinite(limit)) {
        return Math.min(Math.max(Math.floor(limit), 1), MAX_BLOG_POST_LIMIT);
    }

    if (typeof limit === 'string') {
        const parsed = Number.parseInt(limit, 10);
        if (Number.isFinite(parsed)) {
            return Math.min(Math.max(parsed, 1), MAX_BLOG_POST_LIMIT);
        }
    }

    return DEFAULT_BLOG_POST_LIMIT;
}

export function parseRecentPostsFromRss(xmlText: string, limit: number = DEFAULT_BLOG_POST_LIMIT): BlogPost[] {
    const normalizedLimit = sanitizePostsLimit(limit);
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];
    const items = itemMatches.slice(0, normalizedLimit);

    if (items.length === 0) return [];

    return items.map((itemXml, index) => {
        const rawTitle = extractTag(itemXml, 'title');
        const rawLink = extractTag(itemXml, 'link');
        const rawDescription = extractTag(itemXml, 'description');
        const rawAuthor = extractTag(itemXml, 'dc:creator') || extractTag(itemXml, 'creator') || 'Equipe Anhangá';
        const rawCategory = extractTag(itemXml, 'category');

        let rawImageUrl = extractAttribute(itemXml, 'media:content', 'url');
        if (!rawImageUrl) {
            rawImageUrl = extractAttribute(itemXml, 'enclosure', 'url');
        }
        if (!rawImageUrl) {
            const rawContent = extractTag(itemXml, 'content:encoded') || extractTag(itemXml, 'encoded');
            const imgMatch = rawContent.match(/<img[^>]*src="([^"]*)"/i);
            if (imgMatch) rawImageUrl = imgMatch[1];
        }

        const title = safeSanitize(rawTitle);
        const author = safeSanitize(rawAuthor);
        const category = safeSanitize(rawCategory);
        const imageUrl = safeImageUrl(rawImageUrl);
        const slug = safeSanitize(rawLink.replace(/\/$/, '').split('/').pop() || '');
        const excerpt = buildExcerpt(rawDescription);

        return {
            id: index + 1000,
            slug,
            title,
            excerpt,
            content: '',
            image: imageUrl,
            category: category || 'Dicas',
            date: formatDate(extractTag(itemXml, 'pubDate')),
            author,
            isFeatured: index === 0,
            color: COLORS[index % COLORS.length],
            rotate: ROTATIONS[index % ROTATIONS.length]
        };
    });
}

export async function fetchRecentPosts(limit: number = DEFAULT_BLOG_POST_LIMIT): Promise<BlogPost[]> {
    const normalizedLimit = sanitizePostsLimit(limit);
    const response = await fetch(`${BLOG_POSTS_API_PATH}?limit=${normalizedLimit}`, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch recent blog posts: ${response.status}`);
    }

    const posts = await response.json();
    if (!Array.isArray(posts) || !posts.every(isBlogPost)) {
        throw new Error('Invalid blog posts response');
    }

    return posts;
}
