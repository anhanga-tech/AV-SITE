# Guia de Deploy - Anhangá Viagens

## Plataforma Primária: Cloudflare Pages

O deploy ativo é **Cloudflare Pages** (migrado de Vercel em mai/2026). Handlers de API rodam como Pages Functions em `functions/`, que envolvem os handlers em `api/`.

### Segurança da API Key

O chat usa `/api/generate` como proxy server-side. Nenhuma credencial do Gemini ou do AI Gateway deve ser exposta ao browser: ficam somente nas variáveis de ambiente da plataforma, nunca com prefixo `VITE_`.

### Cloudflare AI Gateway (produção, com BYOK)

Em produção a chave do Gemini fica guardada no AI Gateway (Provider Keys / BYOK) e o site só guarda a credencial do gateway. Com `AI_GATEWAY_ENABLED=true` o servidor nunca envia `GEMINI_API_KEY` ao Google: o header `x-goog-api-key` vai vazio e o gateway injeta a chave guardada (conforme a doc de BYOK da Cloudflare, ele só usa a chave guardada quando o header de autorização do provedor está ausente).

1. Crie ou selecione um AI Gateway no painel da Cloudflare.
2. Em Provider Keys, cadastre a chave do Google AI Studio e anote o alias (sem `cf-aig-byok-alias`, o gateway usa o alias `default`).
3. Habilite Authenticated Gateway.
4. Gere um token com permissão `Run` e salve-o com segurança.
5. Configure as variáveis server-side no dashboard do Pages:
   - `AI_GATEWAY_ENABLED=true`
   - `CLOUDFLARE_ACCOUNT_ID` (obrigatória)
   - `CLOUDFLARE_AI_GATEWAY_TOKEN` (obrigatória)
   - `CLOUDFLARE_AI_GATEWAY_ID` (opcional; default: `default`)
   - `AI_GATEWAY_BYOK_ALIAS` (opcional; default: `default`; deve ser o alias cadastrado no passo 2)
6. `GEMINI_API_KEY` **não é necessária** nesse modo. Se estiver definida, é ignorada e o servidor registra um aviso com o nome da variável (nunca o valor); remova-a do dashboard, sobretudo se for uma chave antiga ou revogada.

Sem `AI_GATEWAY_ENABLED=true` (por exemplo, dev local), o caminho direto continua exigindo `GEMINI_API_KEY`.

## Checklist de Deploy

### Antes do Deploy:

- [ ] Configure todas as variáveis de ambiente no dashboard do Cloudflare Pages (Settings → Environment Variables). Consulte `.env.example` para a lista completa.
- [ ] `RATE_LIMIT_KEY_SECRET` presente em **Preview e Production** antes de publicar a pseudonimização do IP (PR #1828). Gere com `openssl rand -base64 32` e não commite o valor. Sem ele, `/api/generate` e os formulários respondem 503; `/api/auth`, `/api/auth/callback` e `/api/markdown` respondem 429.
- [ ] Se usar AI Gateway, configure `AI_GATEWAY_ENABLED=true`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_ID`, `CLOUDFLARE_AI_GATEWAY_TOKEN` e, se o alias não for `default`, `AI_GATEWAY_BYOK_ALIAS`; `GEMINI_API_KEY` não é necessária nesse modo
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

- **Gemini AI** (required): `GEMINI_API_KEY` (caminho direto) **ou**, com AI Gateway BYOK, `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_AI_GATEWAY_TOKEN`
- **Odoo** (required in prod): `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_API_KEY` — CRM ativo; os 5 formulários (lead/contato/quiz/waitlist/nps) postam direto via JSON-RPC
- **n8n Webhook** (required in prod): `N8N_WEBHOOK_SECRET` — restrito a `purchase-dispatch` (inbound); não é mais usado para intake de formulários
- **Rate Limiting** (required in prod): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_KEY_SECRET` (HMAC do IP na chave; ver o checklist acima e a rotação abaixo)
- **Decap CMS OAuth** (required in prod): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- **Meta CAPI** (optional): `META_PIXEL_ID`, `META_ACCESS_TOKEN`

**Retiradas do checklist (não lidas por nenhum handler após o cut-over para Odoo):** `N8N_SUBMIT_CONTACT_WEBHOOK_URL`, `NPS_WEBHOOK_URL`. **Retiradas (set/2026 — webhook HubSpot removido):** `HUBSPOT_TOKEN`, `HUBSPOT_WEBHOOK_SECRET`. Remova-as do dashboard do Cloudflare Pages se ainda estiverem configuradas.

### Rotação de `RATE_LIMIT_KEY_SECRET`

A chave no Redis é o prefixo do endpoint mais o HMAC do IP com esse secret. Trocar o valor faz as chaves antigas deixarem de ser encontradas, e os contadores recomeçam do zero. Quem estava bloqueado volta a passar até estourar o limite de novo. Não há migração nem dado pessoal para apagar. Troque Preview e Production juntos quando o secret puder ter vazado.

## Troubleshooting

### Build falha

- Verifique se todas as dependências estão instaladas: `pnpm install`
- Sem AI Gateway, verifique se a variável `GEMINI_API_KEY` está configurada
- Se `AI_GATEWAY_ENABLED=true`, verifique se `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_AI_GATEWAY_TOKEN` estão configuradas
- Limpe o cache: `rm -rf node_modules dist && pnpm install`

### Chat AI não funciona em produção

- Sem AI Gateway, verifique se `GEMINI_API_KEY` está configurada corretamente no dashboard do Pages
- Se usar AI Gateway, confirme que o Gateway autenticado está ativo, que o token tem permissão `Run` e que o alias em `AI_GATEWAY_BYOK_ALIAS` (ou `default`) existe em Provider Keys
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
