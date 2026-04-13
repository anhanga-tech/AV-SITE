# TODO: Futuras Melhorias de SEO e Conteúdo

Este documento lista as melhorias identificadas na auditoria de Março de 2026 que não foram priorizadas para implementação imediata.

## Técnico & Performance
- [ ] **Padronizar navegação interna nas landing pages**: Substituir `<a href="https://www.anhanga.tur.br/">` por `<Link to="/">` do `react-router-dom` em todas as landings (`BetoCarreroLanding`, `LollapaloozaLanding`, `OrlandoLanding`, `MelhorIdadeLanding`, `BrazilPromotionDayLanding`). Melhora navegação SPA e compatibilidade com ambientes de preview (Vercel). Fazer de uma vez em todas para manter consistência.
- [ ] **Padronização Cloudinary**: Migrar todas as imagens remotas (como as do Pexels/Unsplash no blog) para o Cloudinary utilizando o helper `optimizeRemoteImageUrl` com parâmetros `f_auto,q_auto` para maximizar o Core Web Vitals (LCP).
- [ ] **Auditoria de CLS**: Adicionar `width` e `height` explícitos em componentes de imagem para evitar saltos de layout.

## Conteúdo & Autoridade
- [ ] **Clusters de Destinos Internacionais**:
    - [ ] Criar série de posts "Guia Orlando 2026".
    - [ ] Criar série de posts "Europa Gastronômica: Itália profunda".
- [ ] **Expansão de Festivais**:
    - [ ] Landing page ou blog posts para Rock in Rio 2025/2026.
    - [ ] Conteúdo para festivais boutique e eventos culturais de nicho.
- [ ] **Páginas de Serviço de Luxo**: Criar seções específicas para o atendimento "Boutique" e roteiros de alto padrão.

## Backlinks & Outreach
- [ ] Iniciar campanha de guest posts em blogs de viagem parceiros.
- [ ] Monitorar citações da marca em ferramentas de IA (GEO Tracking).
