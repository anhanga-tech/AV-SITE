# TODO: Futuras Melhorias de SEO e Conteúdo

Este documento lista melhorias de SEO e conteúdo ainda em aberto. Revisado em Junho de 2026 — itens concluídos ou cuja premissa deixou de valer foram removidos (navegação interna padronizada via #884, blog migrado para Cloudflare R2, landing de consultoria e post de Itália já publicados).

## Técnico & Performance
- [x] **Auditoria de CLS**: Varredura concluída (jun/2026). A maioria dos usos já reservava espaço (`LazyImage` em Blog/Destinations/Highlights/Categories com `width`/`height`; heros e cards do blog com dimensões). Gaps corrigidos: `img` do corpo dos posts MDX (`mdxComponents.tsx`) agora reserva espaço 16:9 por default com override por post, e a imagem de equipe em `About.tsx` recebeu `width`/`height`. Logos/favicons em landings usam tamanho fixo via CSS (sem CLS).

## Conteúdo & Autoridade
- [ ] **Clusters de Destinos Internacionais**:
    - [ ] Criar série de posts "Guia Orlando 2026" (a landing `/orlando` existe, mas falta o cluster de conteúdo de apoio).
- [ ] **Expansão de Festivais**:
    - [ ] Landing page ou blog posts para a próxima edição do Rock in Rio (2026/2027). Hoje só há menção dentro do guia de sobrevivência a festivais.
    - [ ] Conteúdo para festivais e eventos culturais de nicho (além de Lollapalooza).

## Backlinks & Outreach
- [ ] Iniciar campanha de guest posts em blogs de viagem parceiros.
- [ ] Monitorar citações da marca em ferramentas de IA (GEO Tracking).
