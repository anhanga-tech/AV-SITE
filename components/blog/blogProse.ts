// Tipografia do corpo do post, compartilhada entre o MDX (BlogPostContent) e o bloco de FAQ
// renderizado pelo template (BlogPostFaq), para os dois ficarem idênticos.
export const BLOG_PROSE_CLASSES = [
    'prose md:prose-lg max-w-none',
    'prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tight prose-headings:text-brand-dark',
    'prose-p:font-serif prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:mb-6',
    'prose-a:text-anhanga-actionInk prose-a:font-bold prose-a:no-underline prose-a:border-b-2 prose-a:border-brand-cyan/30 hover:prose-a:border-brand-cyan hover:prose-a:text-anhanga-dark hover:prose-a:bg-brand-cyan/5 prose-a:transition',
    'prose-strong:text-brand-dark prose-strong:font-black',
    'prose-ul:list-disc prose-ul:pl-6 prose-ul:marker:text-brand-yellow',
    'prose-li:font-serif prose-li:text-zinc-600',
    'prose-blockquote:border-2 prose-blockquote:border-brand-yellow/40 prose-blockquote:bg-yellow-50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-2xl prose-blockquote:not-italic prose-blockquote:font-serif prose-blockquote:text-brand-dark [&_blockquote_p]:text-brand-dark',
].join(' ');

// Capitular só no corpo do MDX; o bloco de FAQ não leva.
export const BLOG_DROP_CAP_CLASSES =
    'first-letter:text-[3rem] first-letter:md:text-[4.5rem] first-letter:font-black first-letter:text-brand-dark first-letter:float-left first-letter:leading-none first-letter:mr-2 first-letter:mt-1';
