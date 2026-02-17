export const BLOG_BASE_URL = 'https://blog.anhanga.tur.br';

export const getBlogHomeUrl = (): string => BLOG_BASE_URL;

export const getBlogPostUrl = (slug: string): string => `${BLOG_BASE_URL}/${slug}`;
