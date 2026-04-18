# Plano de Instalação do Decap CMS — AV-SITE

## Visão Geral

Integrar o Decap CMS ao projeto Anhangá Viagens para permitir edição de posts MDX via interface web, com autenticação GitHub OAuth hospedada na Vercel.

---

## Issues

---

### `[CMS-1]` Criar arquivos base do admin

**Tipo:** Feature
**Prioridade:** Alta
**Estimativa:** 1h

**Descrição:**
Criar os arquivos estáticos que compõem o painel do Decap CMS, servidos como assets públicos.

**Tarefas:**
- [ ] Criar `/public/admin/index.html` com script do Decap CMS via CDN
- [ ] Criar `/public/admin/config.yml` com backend GitHub e coleção `blog`
- [ ] Mapear todos os campos do frontmatter existente (`types/blog.ts`) no `config.yml`
- [ ] Configurar `media_folder` apontando para `public/uploads`
- [ ] Verificar que `/admin` é acessível localmente em `http://localhost:3000/admin`

**Critérios de aceite:**
- A rota `/admin` carrega a UI do Decap CMS
- Os campos do formulário refletem exatamente o schema de `types/blog.ts`

---

### `[CMS-2]` Configurar OAuth App no GitHub

**Tipo:** Infra
**Prioridade:** Alta
**Estimativa:** 30min

**Descrição:**
Registrar o OAuth App no GitHub que será usado pelo Decap CMS para autenticação dos editores.

**Tarefas:**
- [ ] Acessar GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
- [ ] Preencher:
  - Application name: `Anhangá Viagens CMS`
  - Homepage URL: `https://www.anhanga.tur.br`
  - Authorization callback URL: `https://www.anhanga.tur.br/api/auth/callback`
- [ ] Salvar `Client ID` e gerar `Client Secret`
- [ ] Adicionar `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` nas env vars da Vercel
- [ ] Adicionar as mesmas vars ao `.env.example` (sem valores reais)

**Critérios de aceite:**
- OAuth App criado e ativo no GitHub
- Variáveis configuradas na Vercel sem expor segredos no repositório

---

### `[CMS-3]` Implementar handler OAuth na Vercel

**Tipo:** Feature
**Prioridade:** Alta
**Estimativa:** 3h

**Descrição:**
O Decap CMS com backend `github` exige um servidor que faça o handshake OAuth — o browser não pode fazê-lo diretamente por segurança. Criar duas edge functions na Vercel para isso.

**Tarefas:**
- [ ] Criar `/api/auth.ts` — inicia o fluxo OAuth redirecionando para o GitHub
- [ ] Criar `/api/auth/callback.ts` — recebe o `code` do GitHub, troca por token, devolve ao CMS via `postMessage`
- [ ] Seguir os padrões de `api-conventions.md`:
  - Validar presença das env vars na inicialização
  - Retornar erros estruturados em JSON
  - Não logar o `client_secret` nem o token
- [ ] Atualizar `vercel.json` se necessário para rotear `/api/auth`
- [ ] Testar fluxo completo em preview deploy da Vercel

**Critérios de aceite:**
- Login no `/admin` com conta GitHub autorizada funciona end-to-end
- Token não é exposto em logs ou respostas de erro
- Tentativas com `code` inválido retornam 400 estruturado

---

### `[CMS-4]` Configurar rebuild automático do manifest via CI

**Tipo:** Infra
**Prioridade:** Alta
**Estimativa:** 1h

**Descrição:**
O Decap CMS commita novos/editados arquivos `.mdx` diretamente no repositório. O `blogManifest.ts` precisa ser regenerado automaticamente após cada commit de conteúdo, caso contrário o novo post não aparece no site.

**Tarefas:**
- [ ] Criar `.github/workflows/generate-blog-manifest.yml`
- [ ] Configurar trigger em `push` para `main` quando arquivos em `content/blog/**` mudam
- [ ] Workflow deve:
  1. Checkout do repositório
  2. Instalar dependências com `pnpm`
  3. Rodar `pnpm run generate:blog-manifest`
  4. Commitar e fazer push do `data/blogManifest.ts` atualizado se houver diff
- [ ] Garantir que o bot de CI não dispara loop infinito (commitar com `[skip ci]` ou filtro de autor)

**Critérios de aceite:**
- Após publicar um post pelo CMS, o manifest é atualizado automaticamente em até 2 minutos
- O workflow não entra em loop de commits

---

### `[CMS-5]` Tratar limitações do MDX no editor

**Tipo:** Feature
**Prioridade:** Média
**Estimativa:** 2h

**Descrição:**
O widget `markdown` do Decap não renderiza nem preserva JSX (ex: `<ChatCTA />`). Definir a estratégia para que componentes MDX customizados não sejam perdidos ao editar posts pelo CMS.

**Tarefas:**
- [ ] Auditar todos os posts em `content/blog/*.mdx` e listar os que usam JSX no corpo
- [ ] Decidir estratégia (escolher uma):
  - **Opção A:** Adicionar nota de aviso no `config.yml` via `hint` nos campos, instruindo editores a não remover blocos JSX
  - **Opção B:** Mover `<ChatCTA />` para um campo booleano no frontmatter (`showChatCTA: true`) e renderizar condicionalmente no `BlogPost.tsx`
- [ ] Implementar a opção escolhida
- [ ] Documentar a limitação no `README.md` da pasta `content/blog/`

**Critérios de aceite:**
- Posts existentes com `<ChatCTA />` não são quebrados após edição pelo CMS
- Editores têm clareza sobre o que podem ou não editar via UI

---

### `[CMS-6]` Testes e validação de compatibilidade React 19

**Tipo:** QA
**Prioridade:** Alta
**Estimativa:** 2h

**Descrição:**
Existe uma issue aberta de compatibilidade do `decap-cms-app` com React 19. Validar o comportamento antes de ir para produção.

**Tarefas:**
- [ ] Instalar `decap-cms-app` e verificar warnings/errors no console
- [ ] Testar carregamento do painel `/admin` localmente
- [ ] Testar criação de um post de rascunho
- [ ] Testar edição de post existente
- [ ] Testar upload de imagem
- [ ] Se houver incompatibilidade: avaliar uso de CDN puro (sem instalar o pacote) como fallback
- [ ] Registrar resultado nos PR notes

**Critérios de aceite:**
- Nenhum erro de runtime crítico relacionado à versão do React
- Fluxo básico de criação e edição funciona sem crashes

---

### `[CMS-7]` Proteger a rota `/admin` em produção

**Tipo:** Segurança
**Prioridade:** Média
**Estimativa:** 1h

**Descrição:**
A rota `/admin` deve ser acessível apenas por colaboradores autorizados no repositório GitHub.

**Tarefas:**
- [ ] Validar que o Decap CMS só permite login de usuários com acesso de escrita ao repositório (comportamento padrão do backend `github`)
- [ ] Adicionar header `X-Robots-Tag: noindex` para `/admin/*` no `vercel.json`
- [ ] Verificar que a rota `/admin` não aparece no `sitemap.xml`
- [ ] (Opcional) Adicionar lista de colaboradores permitidos no `config.yml` via `auth_scope`

**Critérios de aceite:**
- Usuários sem acesso ao repositório não conseguem autenticar
- A rota `/admin` não é indexada por buscadores

---

## Ordem de Execução Sugerida

```
CMS-2 (OAuth App GitHub)
  → CMS-3 (Handler OAuth Vercel)
  → CMS-1 (Arquivos admin)
  → CMS-6 (Testes React 19)
  → CMS-4 (CI rebuild manifest)
  → CMS-5 (Limitações MDX)
  → CMS-7 (Segurança /admin)
```

---

## Dependências Externas

| Item | Onde configurar |
|---|---|
| GitHub OAuth App | github.com/settings/developers |
| `GITHUB_CLIENT_ID` | Vercel Project Settings → Environment Variables |
| `GITHUB_CLIENT_SECRET` | Vercel Project Settings → Environment Variables |
| Permissão de escrita no repo | GitHub → Collaborators |
