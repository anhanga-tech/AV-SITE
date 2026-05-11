# 🚀 Guia de Deploy - Anhangá Viagens

## Segurança da API Key

O chat usa `/api/generate` como proxy server-side. A chave `GEMINI_API_KEY` deve ficar somente nas variáveis de ambiente da plataforma de deploy e não deve ser exposta com prefixo `VITE_`.

### Cloudflare AI Gateway

O Cloudflare AI Gateway é opcional e controlado por feature flag. Use esta rota para monitorar requests, tokens, erros e custo antes de qualquer migração futura para outro provedor/modelo.

1. Crie ou selecione um AI Gateway no painel da Cloudflare.
2. Habilite Authenticated Gateway.
3. Gere um token com permissão `Run` e salve-o com segurança.
4. Configure as variáveis server-side:
   - `AI_GATEWAY_ENABLED=true`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_AI_GATEWAY_ID` (opcional; default: `default`)
   - `CLOUDFLARE_AI_GATEWAY_TOKEN`
5. Mantenha `GEMINI_API_KEY` configurada; nesta fase ela ainda é enviada pelo servidor ao endpoint nativo Google AI Studio via Gateway.

## 📋 Checklist de Deploy

### Antes do Deploy:

- [ ] Configure a variável `GEMINI_API_KEY` na plataforma de deploy
- [ ] Se usar AI Gateway, configure `AI_GATEWAY_ENABLED=true`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_ID` e `CLOUDFLARE_AI_GATEWAY_TOKEN`
- [ ] Teste o build localmente: `pnpm build && pnpm preview`
- [ ] Verifique se todas as rotas funcionam corretamente
- [ ] Teste o chat AI com a chave de produção
- [ ] Configure restrições de domínio na API Key (se aplicável)

### Durante o Deploy:

- [ ] Build command: `pnpm build`
- [ ] Output directory: `dist`
- [ ] Node version: 18+ (se necessário)
- [ ] Environment variables: `GEMINI_API_KEY` e, se habilitado, variáveis `CLOUDFLARE_*`

### Após o Deploy:

- [ ] Teste todas as funcionalidades no ambiente de produção
- [ ] Verifique se o chat AI está funcionando
- [ ] Teste em diferentes navegadores
- [ ] Verifique performance e carregamento

## 🔧 Configurações por Plataforma

### Vercel

```bash
# Instalar CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

**Variáveis de Ambiente:**
- Adicione `GEMINI_API_KEY` em: Project Settings → Environment Variables
- Para observabilidade via Cloudflare, adicione `AI_GATEWAY_ENABLED=true`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_ID` e `CLOUDFLARE_AI_GATEWAY_TOKEN`

### Netlify

```bash
# Instalar CLI
pnpm add -g netlify-cli

# Deploy
netlify deploy --prod
```

**Configurações no netlify.toml (opcional):**
```toml
[build]
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
```

### GitHub Pages

1. Instale `gh-pages`:
```bash
pnpm install --save-dev gh-pages
```

2. Adicione ao `package.json`:
```json
"scripts": {
  "deploy": "pnpm build && gh-pages -d dist"
}
```

3. **IMPORTANTE**: Configure o base path antes do build:
   - Se o repositório for `username.github.io/repo-name`, crie um arquivo `.env.production`:
   ```env
   VITE_BASE_PATH=/repo-name/
   # Configure GEMINI_API_KEY na plataforma server-side; nao exponha no build estatico.
   ```
   - Se for `username.github.io` (sem subdiretório), use:
   ```env
   VITE_BASE_PATH=/
   # Configure GEMINI_API_KEY na plataforma server-side; nao exponha no build estatico.
   ```

4. Deploy:
```bash
pnpm deploy
```

**Nota**: O `vite.config.ts` já está configurado para usar `VITE_BASE_PATH` automaticamente.

## 🐛 Troubleshooting

### Build falha

- Verifique se todas as dependências estão instaladas: `pnpm install`
- Verifique se a variável `GEMINI_API_KEY` está configurada
- Se `AI_GATEWAY_ENABLED=true`, verifique se as variáveis `CLOUDFLARE_*` estão configuradas
- Limpe o cache: `rm -rf node_modules dist && pnpm install`

### Chat AI não funciona em produção

- Verifique se `GEMINI_API_KEY` está configurada corretamente
- Se usar AI Gateway, confirme que o Gateway autenticado está ativo e que o token tem permissão `Run`
- Verifique o console do navegador para erros

### Rotas não funcionam

- Este projeto usa `HashRouter`, então todas as rotas devem funcionar
- Se usar `BrowserRouter`, configure redirects no servidor para `/index.html`

## 📞 Suporte

Para problemas relacionados ao deploy, consulte:
- Documentação do Vite: https://vitejs.dev/guide/static-deploy.html
- Documentação da sua plataforma de deploy
