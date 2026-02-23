# 🚀 Guia de Deploy - Anhangá Viagens

## ⚠️ Importante: Segurança da API Key

**ATENÇÃO:** Este projeto usa a chave da API do Gemini diretamente no cliente. Isso significa que a chave será exposta no código JavaScript após o build.

### Opções de Segurança:

1. **Usar restrições de domínio na API Key do Google:**
   - Configure restrições de HTTP referrer na Google Cloud Console
   - Limite a chave apenas ao seu domínio de produção

2. **Criar um backend proxy (Recomendado para produção):**
   - Crie uma API backend que faça as chamadas ao Gemini
   - Mantenha a chave da API apenas no servidor
   - O frontend chama sua API, que por sua vez chama o Gemini

## 📋 Checklist de Deploy

### Antes do Deploy:

- [ ] Configure a variável `GEMINI_API_KEY` na plataforma de deploy
- [ ] Teste o build localmente: `pnpm build && pnpm preview`
- [ ] Verifique se todas as rotas funcionam corretamente
- [ ] Teste o chat AI com a chave de produção
- [ ] Configure restrições de domínio na API Key (se aplicável)

### Durante o Deploy:

- [ ] Build command: `pnpm build`
- [ ] Output directory: `dist`
- [ ] Node version: 18+ (se necessário)
- [ ] Environment variables: `GEMINI_API_KEY`

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
   GEMINI_API_KEY=sua_chave_aqui
   ```
   - Se for `username.github.io` (sem subdiretório), use:
   ```env
   VITE_BASE_PATH=/
   GEMINI_API_KEY=sua_chave_aqui
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
- Limpe o cache: `rm -rf node_modules dist && pnpm install`

### Chat AI não funciona em produção

- Verifique se `GEMINI_API_KEY` está configurada corretamente
- Verifique as restrições de domínio na API Key
- Verifique o console do navegador para erros

### Rotas não funcionam

- Este projeto usa `HashRouter`, então todas as rotas devem funcionar
- Se usar `BrowserRouter`, configure redirects no servidor para `/index.html`

## 📞 Suporte

Para problemas relacionados ao deploy, consulte:
- Documentação do Vite: https://vitejs.dev/guide/static-deploy.html
- Documentação da sua plataforma de deploy
