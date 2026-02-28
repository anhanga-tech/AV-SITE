# Revisão de Código — PR #143: Technical SEO Optimizations

**Revisor:** Claude (claude/review-seo-pr-143-pIHTd)
**Data:** 2026-02-28
**Status geral:** ✅ Aprovado com sugestões menores

---

## Resumo

A PR traz melhorias sólidas de SEO técnico: remoção de artefatos incorretos (`robots.tsx`, `Home.tsx.diff`), lógica anti-duplicação de nome da marca nos títulos, canonicalização de URL com `www`, atualização do logo no Schema e melhoria nas meta descriptions com contexto geográfico. As mudanças são coerentes e direcionadas.

---

## Problemas Encontrados

### 🔴 Bug — Ano desatualizado no título do BetoCarreroLanding

**Arquivo:** `pages/landings/BetoCarreroLanding.tsx:31`

```tsx
// PR introduz:
title="Pacote Beto Carrero 2025: Diversão para toda a Família"
```

Hoje é 2026-02-28. O ano "2025" no `<title>` já aparece como conteúdo desatualizado nos resultados de busca, prejudicando a taxa de clique (CTR). Corrigir para `2025/2026` ou remover o ano do título.

**Sugestão:**
```tsx
title="Pacote Beto Carrero: Diversão para toda a Família"
// ou
title="Pacote Beto Carrero 2025/2026: Diversão para toda a Família"
```

---

### 🟡 Aviso — Remoção do `titleTemplate` remove a rede de segurança de títulos

**Arquivo:** `App.tsx:48`

```tsx
// Antes (main):
<Helmet titleTemplate="%s | Anhangá Viagens">

// Depois (PR):
<Helmet >
```

O `titleTemplate` garantia automaticamente o sufixo `| Anhangá Viagens` em qualquer `<Helmet><title>` criado no futuro — mesmo sem passar pelo componente `SEO`. Com a remoção, a lógica de anti-duplicação foi movida para `SEO.tsx` via `includes()`, o que é correto para as páginas existentes. Porém, qualquer página nova que use `<Helmet>` diretamente (sem `SEO`) não terá mais o sufixo automático.

**Recomendação:** Manter o `titleTemplate` no `App.tsx` como camada de segurança e ajustar a lógica de `SEO.tsx` para que o componente _não adicione_ o sufixo se o `titleTemplate` já o fizer — ou documentar explicitamente que todo `<title>` deve obrigatoriamente passar pelo componente `SEO`.

O espaço extra em `<Helmet >` também pode ser removido (cosmético).

---

### 🟡 Aviso — Lógica de deduplicação de título é frágil com acentuação

**Arquivo:** `components/SEO.tsx:24`

```tsx
const fullTitle = title.toLowerCase().includes(siteName.toLowerCase())
    ? title
    : `${title} | ${siteName}`;
```

`siteName = "Anhangá Viagens"`. A comparação `toLowerCase()` **não normaliza diacríticos**, então um título como `"Anhanga Viagens | ..."` (sem o acento) não seria reconhecido, resultando em `"Anhanga Viagens | ... | Anhangá Viagens"`.

Embora pouco provável na prática, é preferível normalizar:

```tsx
const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const fullTitle = normalize(title).includes(normalize(siteName))
    ? title
    : `${title} | ${siteName}`;
```

---

### 🟡 Aviso — `currentUrl` com `.replace()` é código morto na prática

**Arquivo:** `components/SEO.tsx:25`

```tsx
const currentUrl = canonical || (typeof window !== 'undefined'
    ? window.location.href.replace('https://anhanga.tur.br', 'https://www.anhanga.tur.br')
    : '');
```

Todas as páginas passam `canonical` explicitamente com `www.`, então o `replace()` nunca é executado. Não é um bug, mas cria a falsa impressão de que a normalização está ativa para páginas sem canonical. Uma futura página sem `canonical` geraria URL canônica baseada em `window.location.href`, que no ambiente Vercel já virá com `www` (via redirect). O código defensivo é válido, mas um comentário explicitando o comportamento esperado ajudaria.

---

## Pontos Positivos

| Item | Avaliação |
|---|---|
| Remoção de `public/robots.tsx` | ✅ Correto — arquivo `.tsx` em `public/` não é processado pelo Vite; o `robots.txt` real já existia |
| Remoção de `pages/Home.tsx.diff` | ✅ Artefato de edição acidentalmente commitado, bem identificado |
| Logo no `OrganizationSchema` | ✅ Caminho `/assets/LOGO%20ANHANGA%20VIAGENS%20-%20AZUL.svg` correto — arquivo existe em `public/assets/` |
| Descriptions com contexto geográfico ("São Paulo") | ✅ Melhora relevância local |
| Sincronização de `lastmod` no sitemap | ✅ Datas alinhadas com o deploy |
| Anti-duplicação de nome no `SEO.tsx` | ✅ Resolve o problema de `"Página | Anhangá Viagens | Anhangá Viagens"` |
| `shouldRenderBelowFold` em `Home.tsx` | ✅ Bom para performance/LCP — carregamento diferido do conteúdo below-the-fold |

---

## Consideração de SEO — Estrutura do título na Home

O título da Home ficou:

```
Anhangá Viagens | Agência de viagens em São Paulo com roteiros personalizados
```

A keyword principal (`"agência de viagens em São Paulo"`) fica depois da marca. Em geral, colocar a keyword primária antes melhora o CTR e o peso semântico percebido pelo Google. Considerar:

```
Agência de Viagens em São Paulo | Anhangá Viagens
```

Porém, para marcas estabelecidas, a posição da marca no início é uma escolha deliberada e válida. É apenas uma sugestão de otimização, não um bloqueador.

---

## Checklist de Aprovação

- [x] Sem regressões funcionais identificadas
- [x] Sem vulnerabilidades introduzidas
- [x] Artefatos indevidos removidos
- [x] Schema.org atualizado com logo correto
- [ ] Corrigir ano no título do BetoCarreroLanding (2025 → atual)
- [ ] Avaliar manter `titleTemplate` como camada de segurança
