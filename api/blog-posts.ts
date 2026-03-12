import {
    BLOG_RSS_URL,
    parseRecentPostsFromRss,
    sanitizePostsLimit,
} from '../lib/blog-api';

export const config = {
    runtime: 'edge',
};

const SUCCESS_CACHE_CONTROL = 's-maxage=300, stale-while-revalidate=3600';
const ERROR_CACHE_CONTROL = 'no-store';

function buildJsonResponse(body: unknown, status: number, cacheControl: string): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': cacheControl,
        },
    });
}

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return buildJsonResponse({ error: 'Method not allowed' }, 405, ERROR_CACHE_CONTROL);
    }

    try {
        const url = new URL(request.url);
        const limit = sanitizePostsLimit(url.searchParams.get('limit'));

        const response = await fetch(BLOG_RSS_URL, {
            headers: {
                Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch RSS feed: ${response.status}`);
        }

        const xmlText = await response.text();
        const posts = parseRecentPostsFromRss(xmlText, limit);

        return buildJsonResponse(posts, 200, SUCCESS_CACHE_CONTROL);
    } catch (error) {
        console.error('Failed to fetch blog posts API payload', error);
        return buildJsonResponse({ error: 'Failed to fetch blog posts' }, 500, ERROR_CACHE_CONTROL);
    }
}
