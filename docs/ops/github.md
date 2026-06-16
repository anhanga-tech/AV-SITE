# 📤 Enviar Projeto para o GitHub

O repositório Git foi inicializado e o commit inicial foi feito com sucesso! 

## 🚀 Próximos Passos

### Opção 1: Usando GitHub CLI (Recomendado)

Se você tem o GitHub CLI instalado:

```bash
# Criar repositório e fazer push
gh repo create anhanga-viagens --public --source=. --remote=origin --push
```

### Opção 2: Manualmente

1. **Crie um repositório no GitHub:**
   - Acesse: https://github.com/new
   - Nome do repositório: `anhanga-viagens` (ou o nome que preferir)
   - **NÃO** inicialize com README, .gitignore ou licença (já temos isso)
   - Clique em "Create repository"

2. **Conecte o repositório local ao GitHub:**
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/anhanga-viagens.git
   ```
   
   Ou se usar SSH:
   ```bash
   git remote add origin git@github.com:SEU_USUARIO/anhanga-viagens.git
   ```

3. **Envie o código para o GitHub:**
   ```bash
   git push -u origin main
   ```

## ✅ Verificação

Após o push, você pode verificar se funcionou:

```bash
git remote -v
git log --oneline
```

## 🔐 Importante: Variáveis de Ambiente

**NÃO** commite arquivos `.env` com suas chaves de API!

O `.gitignore` já está configurado para ignorar:
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`

Para produção, configure a variável `GEMINI_API_KEY` diretamente na plataforma de deploy (Vercel, Netlify, etc.).

## 📝 Próximos Commits

Para fazer commits futuros:

```bash
git add .
git commit -m "Descrição das alterações"
git push
```
