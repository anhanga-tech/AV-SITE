# Anhangá Viagens - Contexto do Projeto

## Visão Geral

**Anhangá Viagens** é um site institucional moderno para uma agência de viagens boutique brasileira. A plataforma oferece uma experiência completa aos clientes, desde exploração de destinos até planejamento de viagens com auxílio de inteligência artificial.

### Principais Funcionalidades

- 🤖 Chat com IA Gemini: Assistente de viagens integrado que responde dúvidas e sugere roteiros
- ✈️ Vitrine de Destinos: Apresentação visual de destinos turísticos
- 📝 Blog de Viagens: Conteúdo com dicas, roteiros e novidades
- ❓ FAQ Interativo: Respostas para dúvidas comuns
- ⭐ Depoimentos: Área de satisfação de clientes
- 🗺️ Mapas Interativos: Visualização de localidades com Leaflet
- 📱 Design Responsivo: Otimizado para todos os dispositivos

## Stack Tecnológico

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| React | 19.x | Framework de UI |
| TypeScript | ~5.8.2 | Tipagem estática |
| Vite | 6.2.0 | Build e dev server |
| Tailwind CSS | 3.4.17 | Estilização |
| React Router | 6.30.3 | Roteamento |
| Google Gemini AI | - | Chatbot |
| Leaflet | 1.9.4 | Mapas |
| Lucide React | 0.562.0 | Ícones |

## Comandos de Desenvolvimento

```bash
pnpm dev       # Inicia servidor de desenvolvimento (http://localhost:3000)
pnpm build     # Gera build de produção na pasta /dist
pnpm preview   # Preview do build (http://localhost:4173)
pnpm deploy    # Build + deploy para GitHub Pages
```

## Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
# Obrigatório - API do Google Gemini
GEMINI_API_KEY=sua_chave_api_aqui

# Opcional - Modelo do Gemini (padrão: gemini-3.1-flash-lite-preview)
#GEMINI_MODEL=gemini-3.1-flash-lite-preview

# Opcional - Base path para deploy (padrão: /)
VITE_BASE_PATH=/

# Opcional - CDN para assets de mídia
VITE_MEDIA_CDN_URL=

# Opcional - CORS (padrão: *)
ALLOWED_ORIGIN=*
```

> 💡 Obtenha sua chave em: [Google AI Studio](https://aistudio.google.com/apikey)

## Estrutura do Projeto

```
AV-SITE/
├── api/                    # Funções serverless (Vercel Edge Functions)
│   └── generate.ts         # Proxy para API do Gemini
├── components/             # Componentes React
│   ├── ui/                 # Componentes de UI genéricos
│   ├── schemas/            # Componentes JSON-LD para SEO
│   ├── AIChat.tsx          # Chat com IA
│   ├── Header.tsx          # Cabeçalho
│   ├── Footer.tsx          # Rodapé
│   ├── Hero.tsx            # Seção hero
│   ├── Destinations.tsx    # Vitrine de destinos
│   ├── Blog.tsx            # Componentes do blog
│   └── ...
├── data/                   # Dados estáticos e configurações
│   ├── blogData.ts         # Conteúdo do blog
│   └── mediaConfig.ts      # Configuração de assets de mídia
├── pages/                  # Componentes de página
│   ├── Home.tsx            # Página inicial
│   ├── BlogList.tsx        # Lista de posts
│   ├── BlogPost.tsx        # Post individual
│   ├── BlogRedirect.tsx    # Redirect para blog externo
│   ├── Terms.tsx           # Termos de uso
│   ├── Privacy.tsx         # Política de privacidade
│   └── landings/           # Landing pages (Beto Carrero, Lollapalooza, Orlando)
├── services/               # Serviços e clientes de API
│   └── geminiService.ts    # Cliente para API do Gemini
├── utils/                  # Funções utilitárias
│   ├── whatsapp.ts         # Integração com WhatsApp
│   ├── share.ts            # Compartilhamento social
│   └── blog.ts             # Utilitários do blog
├── public/                 # Assets estáticos
├── src/                    # Código fonte adicional
│   └── index.css           # Estilos globais
├── App.tsx                 # Componente raiz e rotas
├── index.tsx               # Entry point
├── index.html              # HTML base
├── vite.config.ts          # Configuração do Vite
├── tailwind.config.js      # Configuração do Tailwind
├── tsconfig.json           # Configuração do TypeScript
├── vercel.json             # Configuração Vercel
├── netlify.toml            # Configuração Netlify
└── package.json            # Dependências e scripts
```

## Padrões e Convenções

### Import Alias

Use `@/` para imports relativos à raiz do projeto:

```typescript
import Header from "@/components/Header";
import { whatsappUtils } from "@/utils/whatsapp";
```

### Integração com IA

- **Client-side:** `/services/geminiService.ts` faz chamadas para o proxy
- **Server-side:** `/api/generate.ts` (Vercel Edge Function) protege a API key
- Rate limiting: 10 requisições/minuto por IP
- CORS configurado via `ALLOWED_ORIGIN`

### Assets de Mídia

Centralizados em `/data/mediaConfig.ts`. Para migrar para CDN:

1. Defina `VITE_MEDIA_CDN_URL` no `.env`
2. Atualize as URLs em `mediaConfig.ts`

### Roteamento

- React Router com hash-based smooth scrolling
- Rotas desconhecidas redirecionam para home
- Landing pages em rotas específicas (`/beto-carrero`, `/lollapalooza-2026`, `/orlando`)

### Estilização

- Tailwind CSS com tema customizado em `tailwind.config.js`
- Cores principais: cyan, blue, yellow, dark, light
- Fontes: Poppins (títulos), Merriweather (texto)

### SEO

- React Helmet Async para meta tags dinâmicas
- JSON-LD structured data em `/components/schemas/`
- Google Tag Manager: GTM-T2KTS86G
- HubSpot tracking embutido

## Deploy

### Plataformas Suportadas

| Plataforma | Configuração |
|------------|--------------|
| **Vercel** | `vercel.json` com headers de segurança e rewrites para SPA |
| **Netlify** | `netlify.toml` com redirects para index.html |
| **GitHub Pages** | `pnpm deploy` (requer `VITE_BASE_PATH`) |

### Checklist de Deploy

- [ ] Configurar `GEMINI_API_KEY` na plataforma
- [ ] Testar build localmente: `pnpm build && pnpm preview`
- [ ] Verificar funcionalidade do chat AI
- [ ] Configurar restrições de domínio na API Key (recomendado)
- [ ] Testar todas as rotas em produção

### Segurança da API Key

A chave do Gemini fica exposta no client-side após o build. Para produção:

1. **Configure restrições de domínio** na Google Cloud Console
2. **Ou crie um backend proxy** para manter a chave apenas no servidor

## Troubleshooting

### Build falha
```bash
rm -rf node_modules dist && pnpm install
```

### Chat AI não funciona em produção
- Verifique se `GEMINI_API_KEY` está configurada
- Confira restrições de domínio na API Key
- Inspecione console do navegador para erros

### Rotas não funcionam
- O projeto usa hash routing, rotas devem funcionar automaticamente
- Para BrowserRouter, configure redirects no servidor

## Arquivos de Documentação Adicionais

- `README.md` - Visão geral do projeto
- `CLAUDE.md` - Guia para desenvolvimento com IA
- `DEPLOY.md` - Guia detalhado de deploy
- `TROUBLESHOOTING.md` - Solução de problemas
- `VERCEL_ENV_VARS.md` - Variáveis de ambiente Vercel
- `CORRECOES_DEPLOY.md`, `FIX_DEPLOY.md` - Histórico de correções de deploy
