# 📊 Auditoria SEO - Anhangá Viagens

**Data da Auditoria:** 22 de Março de 2026  
**Site:** https://www.anhanga.tur.br  
**Tipo de Site:** Agência de Viagens Boutique (São Paulo)

---

## Resumo Executivo

**Avaliação Geral: ⭐⭐⭐⭐⭐ (Excelente)**

O site da Anhangá Viagens está **tecnicamente muito bem otimizado** para SEO. A arquitetura é sólida, schema markup completo, e as melhores práticas foram implementadas corretamente. Há poucas correções críticas necessárias.

---

## 🎯 Principais Achados

### ✅ Pontos Fortes (O que está funcionando bem)

**1. Schema Markup - EXCELENTE**
- Organization Schema completo com NAP (Nome, Endereço, Telefone)
- TravelAgency + Organization em todas as páginas principais
- BlogPosting Schema nos artigos com autor e publisher
- BreadcrumbList Schema em todas as páginas
- FAQPage Schema nas landing pages de produtos
- Service Schema nas páginas de serviços
- AggregateRating com estrelas
- Person Schema para autores de blog

**2. Tags Técnicas - OTIMIZADAS**
- ✅ Canonical tags corretas e self-referencing
- ✅ Robots.txt bem configurado (permite crawlers de IA: GPTBot, PerplexityBot, Claude-Web)
- ✅ Sitemap.xml completo com imagens
- ✅ URLs amigáveis e consistentes
- ✅ Hreflang pt-BR configurado
- ✅ Meta robots index, follow

**3. Performance - BOAS PRÁTICAS**
- Preconnect para domínios externos (fonts, cloudinary)
- Preload de imagens LCP (Largest Contentful Paint)
- Scripts de terceiros carregados sob demanda (scroll, clique)
- Google Tag Manager implementado

**4. Conteúdo - ESTRUTURA SÓLIDA**
- Blog ativo com 8+ posts
- Landing pages específicas (Orlando, Beto Carrero, Lollapalooza, Melhor Idade)
- Títulos otimizados e persuasivos
- Meta descriptions com CTA em algumas páginas

---

## ⚠️ Problemas Identificados

### 🔴 Prioridade ALTA

**1. Keywords Genéricas em Todas as Páginas**
```html
<!-- Problema: Mesmas keywords em TODAS as páginas -->
<meta name="keywords" content="agência de viagens em São Paulo, viagens personalizadas, pacotes para Orlando, pacote Beto Carrero, Lollapalooza Brasil, viagens melhor idade 50+, roteiros exclusivos">
```

**Impacto:** Diluição de relevância semântica para cada página específica.

**Recomendação:** Personalizar keywords para cada página:
- Orlando: `pacotes para Orlando, viagem Disney, roteiro Universal Studios`
- Beto Carrero: `pacote Beto Carrero, ingresso Beto Carrero World, viagem família SC`
- Blog posts: keywords específicas do tópico

---

**2. Meta Descriptions Poderiam Ser Mais Persuasivas**

| Página | Atual | Sugestão |
|--------|-------|----------|
| Blog | "Dicas, roteiros e conteúdos para planejar viagens personalizadas com mais segurança, economia e experiência." | "Dicas de viagem, roteiros práticos e segredos de destinos. Planeje sua próxima aventura com a experiência de quem entende. Leia agora!" |

---

**3. Meta Keywords Obsoletas**
```html
<meta name="keywords" content="...">
```
Google não usa meta keywords desde 2009. Sugestão: **remover completamente** para focar em SEO moderno.

---

### 🟡 Prioridade MÉDIA

**4. URLs Sem Trailing Slash Inconsistentes**

**Problema:**
- Sitemap usa: `/blog/5-segredos-da-disney-que-ninguem-conta/`
- Mas no blog: `/blog/5-segredos-da-disney-que-ninguem-conta`

**Recomendação:** Padronizar todas as URLs com trailing slash (ou sem, mas consistente).

---

**5. Páginas Órfãs Potenciais**

**Problema:** Landing pages de produtos (Orlando, Beto Carrero, Lollapalooza, Melhor Idade) têm link "Voltar para o site principal" mas falta navegação completa.

**Recomendação:** Adicionar menu completo ou breadcrumb visível em todas as landing pages.

---

**6. Conteúdo Dinâmico vs SEO**

**Problema:** O site usa SSR (Server-Side Rendering) mas o conteúdo principal carrega via JavaScript (React). Verificar se Google consegue indexar todo o conteúdo.

**Teste recomendado:** Google Search Console > URL Inspection > View Crawled Page

---

**7. Schema Rating com Poucas Reviews**

```json
"aggregateRating": {
  "ratingValue": "4.94",
  "reviewCount": "3",  // ← Muito baixo para credibilidade
  "bestRating": "5",
  "worstRating": "1"
}
```

**Recomendação:** Coletar mais reviews de clientes reais via Google Business ou Trustpilot.

---

### 🟢 Prioridade BAIXA

**8. Rich Snippets de FAQPage**

As FAQs estão implementadas corretamente com FAQPage Schema, mas verificar se aparecem nos resultados de busca.

**Teste:** https://search.google.com/test/rich-results

---

**9. Blog - Oportunidade de Internal Linking**

Atualmente os posts do blog não têm links internos entre si.

**Recomendação:** Adicionar "Leia também" ou links contextuais entre posts relacionados.

---

**10. Images - Alt Text**

Verificar se todas as imagens têm alt text descritivo e com keywords quando relevante.

---

## 📋 Plano de Ação Priorizado

### Semana 1 (Quick Wins)
- [ ] Remover meta keywords de todas as páginas
- [ ] Padronizar URLs (trailing slash)
- [ ] Atualizar meta descriptions do blog e páginas institucionais
- [ ] Verificar Rich Results no Google

### Semana 2-3
- [ ] Implementar internal linking no blog
- [ ] Adicionar menu completo em landing pages
- [ ] Verificar indexação via Search Console

### Mês 2
- [ ] Coletar mais reviews para aumentar reviewCount
- [ ] Criar páginas de autor para E-E-A-T
- [ ] Implementar breadcrumb visual nas páginas

---

## 📊 Benchmark de Concorrência

**Anhangá está à frente em:**
- ✅ Schema markup completo
- ✅ Performance técnica (lazy loading, preconnect)
- ✅ Blog ativo com conteúdo de qualidade
- ✅ Landing pages otimizadas

**Oportunidades:**
- 📈 Mais conteúdo sobre destinos específicos (Europa, Ásia)
- 📈 Páginas de "Alternativas" (como "Alternativas ao Beto Carrero")
- 📈 Guias completos por destino (ex: "Guia completo Orlando 2026")

---

## 🎯 KPIs para Acompanhar

1. **CTR (Click-Through Rate)** nas SERPs
2. **Posição média** para "agência de viagens são paulo"
3. **Tráfego orgânico** no blog
4. **Core Web Vitals** (LCP, INP, CLS)
5. **Páginas indexadas** vs total de páginas

---

## Ferramentas Recomendadas

- **Google Search Console** - Essencial (já parece estar configurado com GTM)
- **Google Rich Results Test** - Validar schemas
- **PageSpeed Insights** - Verificar Core Web Vitals
- **Screaming Frog** - Auditoria completa (se necessário)

---

## Conclusão

O site da Anhangá Viagens tem uma **base técnica excelente**. A implementação de Schema markup é exemplar e poucas agências de viagens no Brasil têm esse nível de otimização técnica.

**Ações mais importantes:**
1. Remover meta keywords obsoletas
2. Personalizar keywords semânticas por página
3. Melhorar meta descriptions com CTAs
4. Implementar internal linking no blog

Com essas correções, o site está bem posicionado para ranquear bem e atrair tráfego qualificado de busca orgânica.

---

**Relatório gerado por:** opencode AI  
**Arquivo:** seo-audit-anhanga-viagens.md