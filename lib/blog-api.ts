import { BlogPost } from '../data/blogData';

const RSS_URL = 'https://blog.anhanga.tur.br/rss/';

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

export async function fetchRecentPosts(limit: number = 4): Promise<BlogPost[]> {
    try {
        const response = await fetch(RSS_URL);
        if (!response.ok) throw new Error('Failed to fetch RSS feed');

        const xmlText = await response.text();

        // Portable parsing using regex for RSS items
        const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];
        const items = itemMatches.slice(0, limit);

        if (items.length === 0) return [];

        return items.map((itemXml, index) => {
            const rawTitle = extractTag(itemXml, 'title');
            const rawLink = extractTag(itemXml, 'link');
            const rawDescription = extractTag(itemXml, 'description');
            const rawAuthor = extractTag(itemXml, 'dc:creator') || extractTag(itemXml, 'creator') || 'Equipe Anhangá';
            const rawCategory = extractTag(itemXml, 'category');

            // Try different ways to get the image
            let rawImageUrl = extractAttribute(itemXml, 'media:content', 'url');
            if (!rawImageUrl) {
                rawImageUrl = extractAttribute(itemXml, 'enclosure', 'url');
            }
            if (!rawImageUrl) {
                // Try to find an img tag in content:encoded
                const rawContent = extractTag(itemXml, 'content:encoded') || extractTag(itemXml, 'encoded');
                const imgMatch = rawContent.match(/<img[^>]*src="([^"]*)"/i);
                if (imgMatch) rawImageUrl = imgMatch[1];
            }

            // Sanitize all values immediately after extraction
            const title = safeSanitize(rawTitle);
            const author = safeSanitize(rawAuthor);
            const category = safeSanitize(rawCategory);
            const imageUrl = safeImageUrl(rawImageUrl);
            const slug = safeSanitize(rawLink.replace(/\/$/, '').split('/').pop() || '');

            // Create a safe excerpt
            const excerpt = safeSanitize(rawDescription).substring(0, 150).trim() +
                           (rawDescription.length > 150 ? '...' : '');

            return {
                id: index + 1000,
                slug,
                title,
                excerpt,
                content: '', // Not used in homepage grid
                image: imageUrl,
                category: category || 'Dicas',
                date: formatDate(extractTag(itemXml, 'pubDate')),
                author,
                isFeatured: index === 0,
                color: COLORS[index % COLORS.length],
                rotate: ROTATIONS[index % ROTATIONS.length]
            };
        });
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        throw error;
    }
}
