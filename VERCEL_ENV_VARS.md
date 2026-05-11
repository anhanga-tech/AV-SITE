# 🔑 Configurando Variáveis de Ambiente no Vercel

## ✅ Variáveis Obrigatórias

### 1. Adicionar Variável no Dashboard do Vercel

1. Acesse seu projeto no Vercel: https://vercel.com/dashboard
2. Vá em **Settings** → **Environment Variables**
3. Adicione a variável server-side:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Sua chave da API do Gemini
   - **Environments**: Marque **Production**, **Preview** e **Development**

O frontend chama `/api/generate`; não crie uma variável `VITE_GEMINI_API_KEY`.

## Cloudflare AI Gateway opcional

Para rotear o Gemini pelo Cloudflare AI Gateway e monitorar uso:

1. No painel da Cloudflare, habilite Authenticated Gateway no gateway escolhido.
2. Gere um token com permissão `Run`.
3. No Vercel, adicione:
   - `AI_GATEWAY_ENABLED=true`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_AI_GATEWAY_ID` (opcional; use `default` se omitir)
   - `CLOUDFLARE_AI_GATEWAY_TOKEN`
4. Após validar o Gateway em produção, use os logs/analytics da Cloudflare para acompanhar requests, tokens, erros e custo.

### 2. Verificar se as Variáveis Estão Configuradas

Após adicionar, você deve ver:
- ✅ `GEMINI_API_KEY` na lista de variáveis
- ✅ Variáveis `CLOUDFLARE_*` se `AI_GATEWAY_ENABLED=true`
- ✅ Ambientes marcados (Production, Preview, Development)

### 3. ⚠️ IMPORTANTE: Fazer um Novo Deploy

**A variável só será aplicada em um NOVO deploy!**

Após adicionar/alterar variáveis de ambiente:
1. Vá para a aba **Deployments**
2. Clique nos **3 pontos** (⋯) do último deploy
3. Selecione **Redeploy**
4. Ou faça um novo commit e push (isso trigger um novo deploy automaticamente)

### 4. Verificar se Funcionou

1. Abra o site em produção
2. Abra o DevTools (F12)
3. Tente usar o chat AI
4. Se o chat responder, `/api/generate` conseguiu acessar o provedor
5. Se `AI_GATEWAY_ENABLED=true`, confirme também a requisição nos logs/analytics do Cloudflare AI Gateway

## 🐛 Problemas Comuns

### Problema: Variável não aparece nos logs

**Soluções:**
1. **Verifique o nome**: Deve ser exatamente `GEMINI_API_KEY` (maiúsculas)
2. **Verifique os ambientes**: Certifique-se que está marcado para **Production**
3. **Faça um novo deploy**: Variáveis só são aplicadas em novos deploys
4. **Limpe o cache**: No Vercel, vá em Settings → General → Clear Build Cache

### Problema: Variável aparece mas não funciona

**Soluções:**
1. **Verifique se não há espaços**: A chave não deve ter espaços no início/fim
2. **Verifique se a chave está completa**: Copie e cole novamente
3. **Se usar AI Gateway**: confirme `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_TOKEN` e token com permissão `Run`
4. **Verifique os logs da Function**: erros de configuração retornam `SERVER_CONFIG_ERROR`

### Problema: Funciona localmente mas não no Vercel

**Causa**: Variáveis locais (`.env.local`) não são enviadas para o Vercel

**Solução**: Configure a variável no dashboard do Vercel (não apenas localmente)

## 📋 Checklist

- [ ] Variável `GEMINI_API_KEY` adicionada no dashboard
- [ ] Variáveis `CLOUDFLARE_*` adicionadas se `AI_GATEWAY_ENABLED=true`
- [ ] Ambientes marcados (Production, Preview, Development)
- [ ] Novo deploy feito após adicionar a variável
- [ ] Chat AI funciona no site em produção

## 🔄 Como Forçar um Novo Deploy

### Método 1: Via Dashboard
1. Deployments → 3 pontos (⋯) → Redeploy

### Método 2: Via Git
```bash
# Fazer um commit vazio (apenas para trigger deploy)
git commit --allow-empty -m "Trigger deploy para aplicar variáveis de ambiente"
git push origin main
```

### Método 3: Via CLI
```bash
vercel --prod
```

## 🔍 Debug Avançado

Se ainda não funcionar, adicione logs temporários no código:

1. Verifique os logs da Function `/api/generate`
2. Se aparecer `SERVER_CONFIG_ERROR`, revise variáveis server-side
3. Se o Gateway estiver habilitado, confira os logs/analytics do Cloudflare AI Gateway

## 📞 Suporte

Se após seguir todos os passos ainda não funcionar:
1. Verifique os logs de build completos
2. Verifique o console do navegador para erros
3. Certifique-se que a chave da API está válida
