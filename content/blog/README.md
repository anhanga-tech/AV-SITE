# content/blog

Posts do blog em formato MDX com frontmatter YAML.

## Agendamento de publicação

O campo `date` do frontmatter agenda a publicação: **no build de produção** (Cloudflare Pages, branch `main`), posts com `date` futura ficam fora do manifest, do prerender, do `sitemap.xml`, do `feed.xml` e do `llms.txt`. Um workflow diário (`.github/workflows/scheduled-publish.yml`, 06:15 de São Paulo) verifica se algum post vencido (data <= hoje) ainda está fora do sitemap de produção e, se sim, dispara o Deploy Hook do Pages — o rebuild coloca o post no ar. A comparação com o sitemap dá catch-up automático: se o cron falhar no dia do post, a execução seguinte publica o atrasado.

Na prática: pode mergear a PR do post quando o conteúdo estiver pronto; ele só publica na data do frontmatter.

- Dev local e previews de PR mostram **todos** os posts, inclusive futuros (bom para revisão).
- Para simular produção localmente: `BLOG_HIDE_FUTURE_POSTS=true pnpm build`.
- O fuso de referência é `America/Sao_Paulo` (ver `lib/blog-schedule.js`).
- Depende do secret `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL` (URL de Deploy Hook criada no dashboard do Pages).
- Um post mergeado com data já passada publica no próprio deploy do merge, como sempre.

## Limitação: JSX inline não é suportado pelo Decap CMS

O widget `markdown` do Decap CMS não renderiza nem preserva JSX. Por isso, **não inclua componentes JSX diretamente no corpo dos posts** (ex.: `<ChatCTA />`, `<VideoEmbed />`, etc.).

### Como adicionar o CTA do chat (ChatCTA)

Use o campo booleano `showChatCTA` no frontmatter em vez de colocar `<ChatCTA />` no corpo:

```yaml
---
title: "Título do Post"
...
showChatCTA: true             # exibe o botão de CTA ao final do post
chatCTADestination: "Orlando" # opcional: personaliza a mensagem do botão
---
```

Quando `showChatCTA: true`, o componente `<ChatCTA />` é renderizado automaticamente pelo `BlogPost.tsx` após o conteúdo principal do artigo.

### Template

Use `_template.mdx` como ponto de partida para novos posts. Ele já inclui `showChatCTA: true` e não contém JSX inline.

### Campos do frontmatter

| Campo           | Tipo      | Obrigatório | Descrição                                          |
|-----------------|-----------|-------------|----------------------------------------------------|
| `title`         | string    | sim         | Título do post                                     |
| `excerpt`       | string    | sim         | Resumo (máx. 160 chars) — usado em SEO e nos cards |
| `date`          | string    | sim         | Data de publicação (ISO 8601: `YYYY-MM-DD`)        |
| `dateModified`  | string    | não         | Data da última revisão significativa               |
| `author`        | string    | sim         | Chave do autor em `data/blogData.ts`               |
| `category`      | string    | sim         | Categoria do post                                  |
| `image`         | string    | sim         | URL da imagem de capa                              |
| `featured`      | boolean   | não         | Se `true`, aparece em destaque no BlogList         |
| `showChatCTA`   | boolean   | não         | Se `true`, exibe `<ChatCTA />` ao final do post    |
| `chatCTADestination` | string | não    | Destino para personalizar a mensagem do chat (ex: "Orlando", "Maldivas") |
| `tags`          | string[]  | não         | Lista de tags                                      |
| `seoTitle`      | string    | não         | Título alternativo para a tag `<title>` de SEO     |
| `seoDescription`| string    | não         | Meta description alternativa ao excerpt            |
