[![React Doctor](https://www.react.doctor/share/badge?p=anhanga-viagens&s=69&w=1111&f=133)](https://www.react.doctor/share?p=anhanga-viagens&s=69&w=1111&f=133)

## Anhangá Viagens - Site Institucional

O site institucional da **Anhangá Viagens** é uma plataforma moderna e interativa desenvolvida para oferecer aos clientes uma experiência completa, desde a exploração de destinos até o planejamento de viagens com o auxílio de inteligência artificial.


## ✨ Features

- **🤖 Chat com IA Gemini:** Assistente de viagens integrado que responde dúvidas, sugere roteiros e oferece informações personalizadas em tempo real.
- **🎯 Captura de Leads Inteligente:** Integração automatizada com HubSpot via chatbot para qualificação e criação de deals.
- **🏝️ Landing Pages Especializadas:** Experiências otimizadas para destinos de alta conversão (Orlando, Beto Carrero, Lollapalooza).
- **📊 Rastreamento e Performance:** Monitoramento via Vercel Analytics/Speed Insights e persistência de UTMs/GCLID para atribuição.
- **✈️ Vitrine de Destinos:** Seção visualmente atraente para apresentar os principais pacotes da agência.
- **⭐ Depoimentos de Clientes:** Prova social integrada para aumentar a confiança na conversão.
- **❓ FAQ Interativo:** Respostas rápidas para as dúvidas mais frequentes.
- **📝 Blog de Viagens:** CMS headless integrado para publicação de roteiros e dicas de turismo.
- **📱 Design Responsivo:** Interface Mobile-First otimizada para todos os dispositivos.
- **📈 SEO de Alta Performance:** Estrutura otimizada com metadados dinâmicos e componentes de Schema.org.
- **🗺️ Mapas Interativos:** Visualização geográfica de destinos e hotéis utilizando Leaflet.


## 🛠️ Tecnologias Utilizadas

- **React 19:** O estado da arte em bibliotecas de UI.
- **Vite:** Build tool ultrarrápida para desenvolvimento moderno.
- **TypeScript:** Segurança e escalabilidade com tipagem estática.
- **Tailwind CSS:** Design system utility-first para estilização de alta performance.
- **React Router 7:** Gerenciamento de rotas e navegação SPA.
- **Google Gemini AI + Cloudflare AI Gateway:** Motor de inteligência artificial generativa com proxy opcional para observabilidade de uso.
- **HubSpot CRM:** API para gestão de leads e automação de vendas.
- **Vercel Analytics & Speed Insights:** Monitoramento de experiência do usuário em tempo real.
- **Lucide React:** Biblioteca de ícones moderna e leve.
- **Leaflet:** Biblioteca para mapas interativos e geolocalização.

## 🚀 Pré-requisitos

- Node.js 24.x
- pnpm (Gerenciador de pacotes)
- Chave da API do Google Gemini no ambiente server-side
- Opcional: Cloudflare AI Gateway autenticado para monitoramento de uso da IA
- Token de app privado do HubSpot (para captura de leads do chatbot)
- IDs de Pipeline e Stage de Deals no HubSpot

## 📦 Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/anhanga-viagens.git
   cd anhanga-viagens
   ```

2. **Instale as dependências:**
   ```bash
   pnpm install
   ```

3. **Configure as variáveis de ambiente:**
   
   Copie o arquivo de exemplo `.env.example` para um novo arquivo `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Em seguida, adicione sua chave da API do Gemini e o token do HubSpot ao arquivo `.env`.
   O frontend chama `/api/generate`; a chave do Gemini fica apenas no runtime da API.
   ```env
   GEMINI_API_KEY=sua_chave_api_aqui
   # Opcional: habilite depois de criar o gateway autenticado no Cloudflare
   AI_GATEWAY_ENABLED=false
   CLOUDFLARE_ACCOUNT_ID=seu_account_id_cloudflare
   CLOUDFLARE_AI_GATEWAY_ID=default
   CLOUDFLARE_AI_GATEWAY_TOKEN=seu_token_com_permissao_run
   HUBSPOT_TOKEN=seu_token_do_app_privado
   HUBSPOT_DEAL_PIPELINE_ID=id_do_pipeline_deals
   HUBSPOT_DEAL_STAGE_ID=id_do_stage_deals
   # Opcional (default: bant_summary)
   HUBSPOT_DEAL_BANT_PROPERTY=bant_summary
   # Opcional (fallback para tracking não mapeado)
   HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY=tracking_payload_json
   # Opcional (lista estática para contatos da waitlist do Lollapalooza)
   HUBSPOT_LOLLAPALOOZA_LIST_ID=123
   # Opcional (o projeto já usa este domínio por padrão; defina só se quiser explicitar)
   VITE_MEDIA_BASE_URL=https://media.anhanga.tur.br
   # Opcional (para assets do R2, prefira o host de mídia como zona de resize)
   VITE_MEDIA_TRANSFORM_ZONE_URL=https://media.anhanga.tur.br
   # Opcional (ative depois de validar o /cdn-cgi/image no host de mídia)
   VITE_MEDIA_ENABLE_TRANSFORMS=true
   ```

   O projeto já aponta por padrão para `https://media.anhanga.tur.br`. Use
   `VITE_MEDIA_BASE_URL` apenas se precisar sobrescrever a origem em outro ambiente.
   `VITE_MEDIA_TRANSFORM_ZONE_URL` só entra em uso quando
   `VITE_MEDIA_ENABLE_TRANSFORMS=true`. O padrão atual mantém as imagens servidas
   diretamente do bucket do R2, o que evita quebra quando `/cdn-cgi/image/...`
   ainda não está ativo. Quando ativado, o helper só transforma imagens do
   próprio host de mídia; URLs externas seguem diretas.


4. **Execute o projeto:**
   ```bash
   pnpm dev
   ```
   O site estará disponível em `http://localhost:3000` (ou outra porta indicada no terminal).


## 📝 Scripts Disponíveis

- `pnpm dev`: Inicia o servidor de desenvolvimento.
- `pnpm build`: Gera a versão de produção do site na pasta `dist/`.
- `pnpm preview`: Inicia um servidor local para visualizar o build.
- `pnpm deploy`: Executa o build e faz o deploy para o GitHub Pages.
- `pnpm test:regression`: Executa testes de regressão do chatbot.

## 🚢 Deploy

O projeto está pré-configurado para deploy simplificado em plataformas como Vercel e Netlify.

### Vercel

1. Faça o fork do repositório.
2. Conecte sua conta do GitHub ao Vercel.
3. Importe o repositório e configure as variáveis de ambiente `GEMINI_API_KEY`, `HUBSPOT_TOKEN`, `HUBSPOT_DEAL_PIPELINE_ID`, `HUBSPOT_DEAL_STAGE_ID` e, se quiser classificar a waitlist do festival em uma lista estática, `HUBSPOT_LOLLAPALOOZA_LIST_ID` no painel do projeto. Para rotear o chat pelo Cloudflare AI Gateway, adicione também `AI_GATEWAY_ENABLED=true`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_ID` e `CLOUDFLARE_AI_GATEWAY_TOKEN`.
4. O deploy será feito automaticamente a cada push para a branch principal.

### Netlify

1. Siga os mesmos passos da Vercel.
2. O arquivo `netlify.toml` já contém as configurações de build (`pnpm build`) e o diretório de publicação (`dist`).

## 📁 Estrutura do Código

A estrutura do projeto foi organizada para facilitar a manutenção e escalabilidade:

- **`/src`**: Contém todo o código-fonte da aplicação.
  - **`/components`**: Componentes React reutilizáveis (Header, Footer, etc.).
    - **`/ui`**: Componentes de UI genéricos (botões, inputs).
    - **`/schemas`**: Componentes para dados estruturados (SEO).
  - **`/pages`**: Componentes que representam as páginas da aplicação (Home, Blog, etc.).
  - **`/services`**: Módulos para comunicação com APIs externas (ex: Gemini).
  - **`/data`**: Mock de dados e informações estáticas.
  - **`/utils`**: Funções utilitárias.
- **`/public`**: Arquivos estáticos que não passam pelo processo de build (imagens, favicon).
- **`/api`**: Funções serverless (neste caso, para a comunicação segura com a API do Gemini).

## 📄 Licença

Este projeto é de propriedade privada da Anhangá Viagens.

---

<p align="center">
  Desenvolvido com ❤️ por <a href="https://anhanga.tech" target="_blank">anhangá.tech</a>
</p>
