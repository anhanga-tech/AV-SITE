export interface BlogPostFaqItem {
  question: string;
  answer: string;
}

export interface BlogPostFrontmatter {
  title: string;
  excerpt: string;         // max 160 chars — usado no <meta description> e nos cards
  date: string;            // ISO 8601: "2026-04-01" — data de publicação original
  dateModified?: string;   // ISO 8601: "2026-04-15" — data da última revisão significativa
  author: string;          // chave do objeto AUTHORS em blogData.ts
  category: string;
  image: string;           // URL absoluta da imagem de capa
  featured?: boolean;      // se true, aparece em destaque no BlogList
  showChatCTA?: boolean;   // se true, renderiza <ChatCTA /> ao final do post via BlogPost.tsx
  chatCTADestination?: string; // destino opcional para personalizar o ChatCTA (ex: "Orlando", "Maldivas")
  historicalNotice?: string;
  tags?: string[];
  seoTitle?: string;       // opcional: título diferente para <title> tag SEO
  seoDescription?: string; // opcional: meta description diferente do excerpt
  faq?: BlogPostFaqItem[]; // perguntas/respostas já presentes no corpo do post — alimenta o FAQPageSchema sem duplicar texto
}

export type PostMeta = Omit<BlogPostFrontmatter, 'tags'> & {
  tags: string[];      // normalizado: nunca undefined
  slug: string;        // derivado do filename, ex: "dicas-disney-2026"
  readingTime: string; // ex: "4 min de leitura"
};

// Subconjunto de PostMeta para o teaser da home (components/Blog.tsx): só os campos que
// aquele card renderiza. O manifesto completo (com faq[], tags[], etc. dos 40 posts) fica
// fora do bundle da home — que é renderizada de forma síncrona em ssr.tsx e paga o custo de
// qualquer import estático — porque a home só precisa dos N posts mais recentes.
export type HomeTeaserPost = Pick<
  PostMeta,
  'slug' | 'title' | 'excerpt' | 'date' | 'category' | 'author' | 'image' | 'featured'
>;
