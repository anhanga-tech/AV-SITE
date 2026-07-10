# Guia de Deploy - Anhangá Viagens

## Plataforma Primária: Cloudflare Pages

O deploy ativo é **Cloudflare Pages** (migrado de Vercel em mai/2026). Handlers de API rodam como Pages Functions em `functions/`, que envolvem os handlers em `api/`.

### Segurança da API Key

O chat usa `/api/generate` como proxy server-side. A chave `GEMINI_API_KEY` deve ficar somente nas variáveis de ambiente da plataforma e não deve ser exposta com prefixo `VITE_`.

### Cloudflare AI Gateway (opcional)

O Cloudflare AI Gateway é opcional e controlado por feature flag. Use para monitorar requests, tokens, erros e custo.

1. Crie ou selecione um AI Gateway no painel da Cloudflare.
2. Habilite Authenticated Gateway.
3. Gere um token com permissão `Run` e salve-o com segurança.
4. Configure as variáveis server-side no dashboard do Pages:
   - `AI_GATEWAY_ENABLED=true`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_AI_GATEWAY_ID` (opcional; default: `default`)
   - `CLOUDFLARE_AI_GATEWAY_TOKEN`
5. Mantenha `GEMINI_API_KEY` configurada; nesta fase ela ainda é enviada pelo servidor ao endpoint nativo Google AI Studio via Gateway.

## Checklist de Deploy

### Antes do Deploy:

- [ ] Configure todas as variáveis de ambiente no dashboard do Cloudflare Pages (Settings → Environment Variables). Consulte `.env.example` para a lista completa.
- [ ] Se usar AI Gateway, configure `AI_GATEWAY_ENABLED=true`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_ID` e `CLOUDFLARE_AI_GATEWAY_TOKEN`
- [ ] Teste o build localmente: `pnpm build && pnpm preview`
- [ ] Verifique se todas as rotas funcionam corretamente
- [ ] Teste o chat AI com a chave de produção
- [ ] Configure restrições de domínio na API Key (se aplicável)

### Configuração do Build no Cloudflare Pages:

- Build command: `pnpm build`
- Output directory: `dist`
- Node version: 24 (fixado via `.node-version`)
- Functions directory: `functions/` (auto-detectado pelo Pages)

### Após o Deploy:

- [ ] Teste todas as funcionalidades no ambiente de produção
- [ ] Verifique se o chat AI está funcionando
- [ ] Teste em diferentes navegadores
- [ ] Verifique performance e carregamento

## Variáveis de Ambiente Necessárias

Consulte `.env.example` para a lista completa com descrições. Grupos principais:

- **Gemini AI** (required): `GEMINI_API_KEY`
- **Odoo** (required in prod): `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_API_KEY` — CRM ativo; os 5 formulários (lead/contato/quiz/waitlist/nps) postam direto via JSON-RPC
- **n8n Webhook** (required in prod): `N8N_WEBHOOK_SECRET` — restrito a `purchase-dispatch` (inbound) e ao anúncio social do blog (outbound); não é mais usado para intake de formulários
- **Rate Limiting** (required in prod): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Decap CMS OAuth** (required in prod): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- **Meta CAPI** (optional): `META_PIXEL_ID`, `META_ACCESS_TOKEN`
- **Legado HubSpot** (somente webhook Closed-Won, não usado para leads novos): `HUBSPOT_TOKEN`, `HUBSPOT_WEBHOOK_SECRET`

**Retiradas do checklist (não lidas por nenhum handler após o cut-over para Odoo):** `N8N_SUBMIT_CONTACT_WEBHOOK_URL`, `NPS_WEBHOOK_URL`. Remova-as do dashboard do Cloudflare Pages se ainda estiverem configuradas.

## Troubleshooting

### Build falha

- Verifique se todas as dependências estão instaladas: `pnpm install`
- Verifique se a variável `GEMINI_API_KEY` está configurada
- Se `AI_GATEWAY_ENABLED=true`, verifique se as variáveis `CLOUDFLARE_*` estão configuradas
- Limpe o cache: `rm -rf node_modules dist && pnpm install`

### Chat AI não funciona em produção

- Verifique se `GEMINI_API_KEY` está configurada corretamente no dashboard do Pages
- Se usar AI Gateway, confirme que o Gateway autenticado está ativo e que o token tem permissão `Run`
- Verifique o console do navegador para erros

### Rotas não funcionam

- Pages Functions em `functions/` tratam as rotas de API. Verifique se a pasta `functions/` está presente na raiz do repositório.
- Para rotas do SPA, o `_redirects` ou a config de Pages deve reescrever `/*` para `/index.html`.

## Plataformas Legadas / Secundárias

Os arquivos `vercel.json` e `netlify.toml` estão mantidos no repo para compatibilidade, mas não são a plataforma ativa.

### Vercel (legado)

```bash
# Instalar CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

### Netlify (legado)

```bash
# Instalar CLI
pnpm add -g netlify-cli

# Deploy
netlify deploy --prod
```

O arquivo `netlify.toml` já contém as configurações de build (`pnpm build`) e o diretório de publicação (`dist`).

### GitHub Pages (estático)

GitHub Pages não suporta API serverless — use apenas para deploy estático sem chatbot.

1. **IMPORTANTE**: Configure o base path antes do build:
   ```env
   VITE_BASE_PATH=/repo-name/
   ```

2. Deploy:
```bash
pnpm deploy
```

## Suporte

Para problemas relacionados ao deploy, consulte:
- Documentação do Cloudflare Pages: https://developers.cloudflare.com/pages/
- Documentação do Vite: https://vitejs.dev/guide/static-deploy.html
