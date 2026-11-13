import React from 'react';
import type { BlogPostFaqItem } from '../../types/blog';
import { BLOG_PROSE_CLASSES } from './blogProse';

interface BlogPostFaqProps {
    items: BlogPostFaqItem[];
}

// FAQ estático (sem acordeão): pergunta e resposta ficam no HTML, com o mesmo texto do
// `faq` do frontmatter que alimenta o FAQPageSchema. Só é renderizado quando o MDX do
// post não tem a própria seção "Perguntas Frequentes" (post.faqMissingFromBody).
export const BlogPostFaq: React.FC<BlogPostFaqProps> = ({ items }) => {
    if (items.length === 0) return null;

    return (
        <section aria-labelledby="perguntas-frequentes" data-blog-post-faq className={`${BLOG_PROSE_CLASSES} mt-12`}>
            <h2 id="perguntas-frequentes">Perguntas Frequentes</h2>
            {items.map((item) => (
                <React.Fragment key={item.question}>
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                </React.Fragment>
            ))}
        </section>
    );
};
