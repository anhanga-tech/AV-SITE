---
name: "\U0001F50D SEO"
about: Melhoria de SEO técnico ou on-page (meta tags, schema, indexação, Core Web Vitals)
title: "[SEO] "
labels: seo
assignees: ''
---

## 🎯 Objetivo
<!-- O que precisa melhorar no SEO? Ex.: indexação, ranking, CTR orgânico -->

## 📋 Tipo de SEO
<!-- Marque o(s) que se aplica(m) -->
- [ ] **Técnico** — crawling, indexação, sitemap, robots.txt, canonical, redirects
- [ ] **On-page** — title, meta description, H1-H6, alt text, internal linking
- [ ] **Structured Data** — Schema JSON-LD (Organization, FAQ, Breadcrumb, Article, etc.)
- [ ] **Core Web Vitals** — LCP, INP, CLS
- [ ] **E-E-A-T** — sinais de autoridade, credenciais, links externos

## 📄 Página(s) afetada(s)
<!-- Liste as URLs ou rotas impactadas -->
-

## 📈 Métrica atual vs. esperada
<!-- Use dados reais quando possível -->
| Métrica | Atual | Meta |
|---------|-------|------|
| Exemplo: Lighthouse SEO Score | 58 | 90+ |
| | | |

## 🔍 Evidência do problema
<!-- Como foi identificado? Relatório de audit, Search Console, Lighthouse, etc. -->
- **Fonte:**
- **Detalhe:**

## ✅ Critérios de Aceitação
- [ ] Validação com ferramenta de SEO (Lighthouse, Ahrefs, Search Console)
- [ ] HTML servido ao crawler contém as correções (testar com `curl -s URL | grep`)
- [ ] Sem regressões em outras métricas SEO
- [ ] Schema validado no [Rich Results Test](https://search.google.com/test/rich-results)

## 🔧 Tarefas
<!-- Quebre em sub-tarefas quando possível -->
- [ ]
- [ ]
- [ ]

## 🧪 Como verificar
<!-- Passo-a-passo para validar a correção -->
1.
2.
3.

## 💡 Contexto adicional
<!-- Hipóteses, links de referência, screenshots, notas sobre falsos positivos -->

## 📊 Checklist SEO (preencha o que for relevante)
<!-- Referência rápida — marque o que já está OK ou será corrigido nesta issue -->

**Técnico:**
- [ ] Sitemap XML submetido e válido
- [ ] robots.txt configurado
- [ ] Canonical tags corretas
- [ ] HTTPS ativo
- [ ] Mobile-friendly
- [ ] Core Web Vitals dentro do "bom" (LCP < 2.5s, INP < 200ms, CLS < 0.1)

**On-page:**
- [ ] Title tag otimizada (50-60 caracteres)
- [ ] Meta description (150-160 caracteres)
- [ ] Hierarquia H1-H6 correta (1 H1 por página)
- [ ] Links internos relevantes
- [ ] Alt text em todas as imagens

**Structured Data:**
- [ ] Schema JSON-LD sem erros
- [ ] Testado no Rich Results Test do Google

---
> **Para o Codex:** Valide o HTML estático servido ao crawler, não apenas o DOM renderizado pelo JS. Use `curl` ou `view-source:` para confirmar.
