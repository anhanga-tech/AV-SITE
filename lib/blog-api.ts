import { BlogPost } from '../data/blogData';
import { cleanString } from './lead-logic';

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
            const title = cleanString(extractTag(itemXml, 'title'));
            const link = extractTag(itemXml, 'link');
            const description = extractTag(itemXml, 'description');
            const content = extractTag(itemXml, 'content:encoded') || extractTag(itemXml, 'encoded');
            const pubDate = extractTag(itemXml, 'pubDate');
            const author = cleanString(extractTag(itemXml, 'dc:creator') || extractTag(itemXml, 'creator') || 'Equipe Anhangá');
            const category = cleanString(extractTag(itemXml, 'category'));

            // Try different ways to get the image
            let imageUrl = extractAttribute(itemXml, 'media:content', 'url');
            if (!imageUrl) {
                imageUrl = extractAttribute(itemXml, 'enclosure', 'url');
            }
            if (!imageUrl) {
                // Try to find an img tag in content:encoded
                const imgMatch = content.match(/<img[^>]*src="([^"]*)"/i);
                if (imgMatch) imageUrl = imgMatch[1];
            }

            // Extract slug from link
            const slug = cleanString(link.replace(/\/$/, '').split('/').pop() || '');

            const excerpt = description.replace(/<[^>]*>/g, '').substring(0, 150).trim() + (description.length > 150 ? '...' : '');

            return {
                id: index + 1000, // Dynamic IDs start at 1000
                slug,
                title,
                excerpt: cleanString(excerpt),
                content: cleanString(content),
                image: cleanString(imageUrl),
                category: category || 'Dicas',
                date: formatDate(pubDate),
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
