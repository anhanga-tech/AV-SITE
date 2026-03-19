export interface BlogPostFrontmatter {
  title: string;
  excerpt: string;         // max 160 chars — usado no <meta description> e nos cards
  date: string;            // ISO 8601: "2026-04-01"
  author: string;          // chave do objeto AUTHORS em blogData.ts
  category: string;
  image: string;           // URL absoluta da imagem de capa
  featured?: boolean;      // se true, aparece em destaque no BlogList
  tags?: string[];
  seoTitle?: string;       // opcional: título diferente para <title> tag SEO
  seoDescription?: string; // opcional: meta description diferente do excerpt
}
