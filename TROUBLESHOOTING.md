# 🔧 Troubleshooting - Problemas de Deploy

## Problema: Página Branca no Deploy

### ✅ Correções Aplicadas

1. **Removido importmap do index.html**
   - O importmap estava tentando carregar React via CDN, conflitando com o bundle do Vite
   - Agora o Vite faz o bundle corretamente de todas as dependências

2. **Corrigido caminho do script**
   - O Vite processa `/index.tsx` automaticamente durante o build
   - O caminho será ajustado automaticamente baseado no `base` configurado

3. **Melhorado tratamento de variáveis de ambiente**
   - `geminiService.ts` agora trata melhor a ausência da API key
   - Mensagens de erro mais claras

## 🔍 Como Diagnosticar Problemas

### 1. Verificar Console do Navegador

Abra o DevTools (F12) e verifique:
- **Console**: Procure por erros JavaScript
- **Network**: Verifique se os arquivos estão sendo carregados (status 200)
- **Sources**: Verifique se os arquivos JS estão presentes

### 2. Verificar Build Local

```bash
# Limpar build anterior
rm -rf dist node_modules/.vite

# Fazer build
pnpm build

# Testar localmente
pnpm preview
```

### 3. Verificar Variáveis de Ambiente

**Vercel:**
- Settings → Environment Variables
- Certifique-se que `GEMINI_API_KEY` está configurada
- Verifique se está aplicada ao ambiente correto (Production, Preview, Development)

**Netlify:**
- Site settings → Environment variables
- Certifique-se que `GEMINI_API_KEY` está configurada
- Para GitHub Pages, também configure `VITE_BASE_PATH` se necessário

**GitHub Pages:**
- Crie `.env.production` localmente antes do build
- Ou configure via GitHub Actions secrets

### 4. Verificar Logs de Build

**Vercel:**
- Vá para o deploy → View Build Logs
- Procure por erros de compilação

**Netlify:**
- Vá para Deploys → Clique no deploy → View build log
- Procure por erros

## 🐛 Problemas Comuns

### Erro: "Cannot find module"
**Causa**: Dependências não instaladas ou versões incompatíveis
**Solução**: 
```bash
rm -rf node_modules package-lock.json
pnpm install
```

### Erro: "process is not defined"
**Causa**: Variável de ambiente não configurada corretamente
**Solução**: Verifique se `GEMINI_API_KEY` está configurada na plataforma

### Página branca sem erros no console
**Causa**: Problema com base path ou caminhos de assets
**Solução**: 
- Verifique se `VITE_BASE_PATH` está correto
- Para GitHub Pages: use `/repo-name/` (com barra no final)
- Para Vercel/Netlify: use `/` ou deixe vazio

### Assets não carregam (imagens, CSS)
**Causa**: Base path incorreto
**Solução**: 
- Verifique `vite.config.ts` - o `base` deve estar correto
- Verifique se os componentes usam `import.meta.env.BASE_URL` para assets

## 📋 Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] Build local funciona (`pnpm build && pnpm preview`)
- [ ] Variáveis de ambiente estão configuradas
- [ ] Base path está correto (se GitHub Pages)
- [ ] Console do navegador não mostra erros críticos
- [ ] Network tab mostra que arquivos estão sendo carregados
- [ ] Logs de build não mostram erros

## 🆘 Ainda com Problemas?

1. **Teste o build local primeiro:**
   ```bash
   pnpm build
   pnpm preview
   ```
   Se funcionar localmente, o problema é na configuração da plataforma.

2. **Verifique os arquivos de configuração:**
   - `vite.config.ts` - Base path correto?
   - `vercel.json` - Configurado?
   - `netlify.toml` - Configurado?
   - `package.json` - Scripts corretos?

3. **Limpe o cache:**
   ```bash
   rm -rf dist node_modules/.vite .vite
   pnpm build
   ```

4. **Verifique a versão do Node:**
   - Use Node.js 18+ (verifique com `node -v`)
   - Configure na plataforma se necessário
