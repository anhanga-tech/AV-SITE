# Matriz de Operadores e Transferências Internacionais

**Base legal:** Arts. 33 a 36 da Lei nº 13.709/2018 (LGPD) e Resolução CD/ANPD nº 19/2024 (Regulamento de Transferência Internacional de Dados)

---

| Campo | Informação |
|---|---|
| **Controlador (exportador)** | Anhangá Turismo Ltda. — CNPJ 37.036.732/0001-41 |
| **Encarregado (DPO)** | Felipe William Rodrigues Silva — privacidade@anhanga.tur.br |
| **Versão** | 0.1 |
| **Data de elaboração** | 11/09/2026 |
| **Status** | Rascunho — levantamento técnico feito a partir do código; evidências contratuais e revisão jurídica **pendentes** |
| **Issue** | [#1542](https://github.com/anhanga-tech/AV-SITE/issues/1542) (achados LGPD-04 e LGPD-05 da auditoria de 28/08/2026) |
| **Documentos relacionados** | [`ripd-legitimo-interesse.md`](./ripd-legitimo-interesse.md) · Política de Privacidade (`components/privacy/`, seções 5, 6 e 10) · `pages/ExclusaoDados.tsx` |

---

## 1. Como ler esta matriz

Este repositório é **público**. A matriz registra apenas o *inventário* e *ponteiros* para as evidências — nunca o texto de DPA, IDs de conta, hostnames de instâncias ou URLs de console. As evidências contratuais ficam no repositório documental com acesso controlado (ver seção 4) e são referenciadas aqui pela coluna **Evidência**.

Cada afirmação sobre país/região traz a **fonte**, porque o achado da auditoria foi justamente a falta de evidência verificável:

| Fonte | Significado |
|---|---|
| `código` | Verificado no código deste repositório (arquivo citado) |
| `política do fornecedor` | Afirmação pública do fornecedor, ainda não conferida contra o contrato assinado |
| `indício técnico` | Resolução DNS / geolocalização de IP feita em 11/09/2026. **Não é confirmação** de onde os dados são armazenados — só aponta a hipótese a confirmar |
| `a confirmar` | Sem evidência ainda; precisa de consulta ao console/contrato do fornecedor |

Status possíveis do mecanismo do art. 33: `não verificado` · `evidência obtida` · `revisado pelo DPO/jurídico`. **Nenhum fornecedor passou de `não verificado` nesta versão.**

## 2. Matriz de operadores ativos

Exportador em todas as linhas: Anhangá Turismo Ltda. (Brasil).

### 2.1 Cloudflare, Inc. — hospedagem, edge, tags server-side, mídia, analytics próprio

| Campo | Detalhe |
|---|---|
| **Importador** | Cloudflare, Inc. (EUA) |
| **Serviços em uso** | Pages + Pages Functions (site e `api/*`), Zaraz (tags server-side), R2 (`media.anhanga.tur.br`), AI Gateway (proxy das chamadas ao Gemini), Worker de coleta do Traks (ver 2.3) |
| **Dados** | IP e cabeçalhos de toda requisição; corpo dos formulários (lead, contato, quiz, waitlist, NPS) em trânsito pelas Functions; conversa do chatbot em trânsito pelo AI Gateway; eventos de navegação/conversão via Zaraz |
| **Finalidade** | Hospedagem, entrega, segurança, mensuração e intermediação server-side de conversões |
| **Duração** | Contínua enquanto houver contrato. AI Gateway configurado **sem** persistir prompt/resposta (cabeçalho `cf-aig-collect-log-payload: false` enviado em `lib/ai/gemini-config.ts`) — `código` |
| **País/região** | Rede global (processamento no PoP mais próximo; requisições brasileiras observadas em GRU) — `indício técnico`. Região de armazenamento de R2/D1/logs — `a confirmar` |
| **Suboperadores** | `a confirmar` — lista pública de subprocessadores da Cloudflare, versão vigente a arquivar |
| **Mecanismo art. 33** | `não verificado`. Confirmar se o DPA da Cloudflare aceito na conta cobre Zaraz e AI Gateway (pendência já aberta no RIPD, Atividade 1) e se incorpora as cláusulas-padrão da Res. CD/ANPD nº 19/2024 |
| **Evidência** | — |

### 2.2 Google LLC — Gemini, GA4, Google Ads, Google Fonts

| Campo | Detalhe |
|---|---|
| **Importador** | Google LLC (EUA) |
| **Serviços em uso** | Gemini API via Google AI Studio (`lib/ai/gemini-config.ts`, provider `google-ai-studio` no AI Gateway); GA4 e Google Ads via Zaraz (`hideOriginalIP`); Google Fonts carregado direto do Google nas landings `BetoCarreroLanding`, `LollapaloozaLanding` e `OrlandoLanding` |
| **Dados** | Gemini: texto das conversas do chatbot (pode conter nome, datas, destino, orçamento). GA4/Ads: eventos de navegação com identificador pseudonimizado (`anhanga_ga_cid`), IP suprimido. Fonts: IP e user agent do visitante das 3 landings (requisição direta do navegador) |
| **Finalidade** | Atendimento automatizado (chatbot), mensuração, publicidade; renderização de fontes |
| **Duração** | GA4: 14 meses (painel). Gemini: `a confirmar` — depende do nível da conta (os termos do nível gratuito do AI Studio permitem uso do conteúdo para melhoria de produto; o nível pago não) |
| **País/região** | EUA / infraestrutura global — `política do fornecedor` |
| **Suboperadores** | `a confirmar` |
| **Mecanismo art. 33** | `não verificado`. Arquivar: Google Ads Data Processing Terms / Data Processing Addendum aceito no GA4 e no Ads; termos da Gemini API com o nível de faturamento vigente |
| **Evidência** | — |

> **Achado:** Google Fonts nas 3 landings transfere IP ao Google sem passar pelo consentimento de cookies. `scripts/build-fonts.mjs` já faz self-hosting das fontes do site principal — estender às landings elimina essa transferência. Tratar em issue própria.

### 2.3 Traks (software de analytics self-hosted)

| Campo | Detalhe |
|---|---|
| **Importador** | Hipótese: nenhum importador novo — o coletor responde como `traks-collect` em `analytics-collect.anhanga.tur.br` (servido pela Cloudflare) e o Traks se descreve como "self-hosted on Cloudflare, your data in your own account". Se confirmado, o operador é a Cloudflare (2.1) e o Traks é só software — `indício técnico` + `política do fornecedor` |
| **Dados** | Pageviews (caminho, referrer, largura de tela, UTMs), eventos de conversão, identificador de sessão aleatório em `sessionStorage` (30 min). Sem cookies — `código` (`index.html`, `utils/traks.ts`) |
| **Finalidade** | Mensuração própria de conversões |
| **País/região** | `a confirmar` — região do banco (D1/Analytics Engine) onde o Worker grava |
| **Mecanismo art. 33** | Herda o da Cloudflare, se a hipótese se confirmar |
| **Evidência** | — |
| **Pendência** | Confirmar no dashboard Cloudflare que o Worker `traks-collect` e o armazenamento estão na conta da Anhangá. Se o Traks for serviço gerenciado de terceiro, ele vira operador próprio e precisa entrar na seção 6.1 da política |

### 2.4 Meta Platforms, Inc. e TikTok Pte. Ltd. — conversões server-side

| Campo | Detalhe |
|---|---|
| **Importador** | Meta Platforms, Inc. (EUA) / Meta Platforms Ireland Ltd.; TikTok Pte. Ltd. (Singapura) |
| **Serviços em uso** | Conversions API (Meta) e Events API (TikTok) disparadas pelo Zaraz **somente após consentimento de marketing** (sem pixel no navegador); `lib/conversions/meta.ts` (`graph.facebook.com`) para o loop Odoo → Meta, hoje atrás de flag |
| **Dados** | Eventos de conversão, identificadores de clique (fbclid/ttclid), dados técnicos do navegador; Customer Match **inativo** |
| **Finalidade** | Mensuração e otimização de campanhas pagas |
| **País/região** | EUA / Singapura e infraestrutura global — `política do fornecedor` |
| **Suboperadores** | `a confirmar` |
| **Mecanismo art. 33** | `não verificado`. Arquivar Meta Business Tools Terms + Data Processing Terms; TikTok Business Products (Data) Terms |
| **Evidência** | — |

### 2.5 Odoo S.A. — CRM

| Campo | Detalhe |
|---|---|
| **Importador** | Odoo S.A. (Bélgica) |
| **Serviços em uso** | Odoo Online — recebe os 5 formulários do site via JSON-RPC (`services/odoo.ts`) |
| **Dados** | Nome, e-mail, telefone, perfil de viagem/BANT, UTMs e click IDs, `x_ga_client_id`, consentimento LGPD, nota NPS |
| **Finalidade** | Gestão comercial de leads e relacionamento |
| **Duração** | 5 anos após a última interação (política, seção 7.1) — aprovação da tabela de retenção em #1544 |
| **País/região** | O IP do banco resolve para OVH em Montréal, Canadá — `indício técnico`. Região do datacenter do banco — `a confirmar` no painel da assinatura Odoo |
| **Suboperadores** | Odoo publica lista (OVH, Google Cloud etc.) — `a confirmar` versão vigente |
| **Mecanismo art. 33** | `não verificado`. Arquivar o Odoo Data Processing Agreement vigente e verificar se incorpora as cláusulas-padrão ANPD |
| **Evidência** | — |

### 2.6 Upstash, Inc. — rate limiting

| Campo | Detalhe |
|---|---|
| **Importador** | Upstash, Inc. (EUA) |
| **Serviços em uso** | Redis REST para rate limit dos endpoints de API (`lib/rate-limit.ts`) |
| **Dados** | **IP do cliente em claro** como parte da chave (`<prefixo>:<ip>`) e um contador — `código` |
| **Finalidade** | Prevenção de abuso (segurança) |
| **Duração** | TTL igual à janela do rate limit (minutos) — `código` |
| **País/região** | Banco global com primário em São Paulo (sa-east-1) — `indício técnico`. Um banco global replica para outras regiões: lista de réplicas — `a confirmar` no console |
| **Suboperadores** | AWS — `a confirmar` |
| **Mecanismo art. 33** | `não verificado`. Se todas as réplicas ficarem no Brasil, pode não haver transferência de armazenamento; ainda assim há um importador estrangeiro (Upstash, Inc.) com acesso |
| **Evidência** | — |

> **Oportunidade de minimização:** fazer hash (HMAC) do IP antes de montar a chave tira o dado pessoal em claro do Upstash sem mudar o comportamento do rate limit. Tratar em issue própria.

### 2.7 Functional Software, Inc. (Sentry) — monitoramento de erros

| Campo | Detalhe |
|---|---|
| **Importador** | Functional Software, Inc. (EUA) |
| **Serviços em uso** | Sentry no navegador (`lib/sentry-client.ts`) e nas Functions (`functions/_middleware.ts`), 10% de amostragem de transações, logs de console |
| **Dados** | Stack traces, URL (credenciais do convite NPS removidas por `scrubEventUrls`), user agent, logs estruturados (o logger mascara PII — `lib/logger.ts`). **IP:** o SDK não liga `sendDefaultPii`, mas o Sentry infere o IP da requisição de ingestão a menos que a opção "Prevent Storing of IP Addresses" esteja ativa no projeto — `a confirmar` |
| **Finalidade** | Detecção e correção de falhas |
| **Duração** | Retenção do plano Sentry — `a confirmar` |
| **País/região** | Região da organização (US ou DE) — `a confirmar` pelo host de ingestão do DSN (o DSN não está no repositório) |
| **Mecanismo art. 33** | `não verificado`. Arquivar o Sentry DPA |
| **Evidência** | — |

### 2.8 Cal.com, Inc. — agendamento

| Campo | Detalhe |
|---|---|
| **Importador** | Cal.com, Inc. (EUA) |
| **Serviços em uso** | Embed de agendamento na landing `/consultoria-de-viagem` e na página de links (`lib/cal-embed.ts`) |
| **Dados** | Nome, e-mail, notas e horário informados pelo titular no agendamento; IP/UA ao carregar o embed |
| **Finalidade** | Agendar a consultoria de viagem |
| **País/região** | EUA — `política do fornecedor`; região da conta — `a confirmar` |
| **Mecanismo art. 33** | `não verificado`. Arquivar o Cal.com DPA |
| **Evidência** | — |

### 2.9 Fora do escopo desta matriz (sem fluxo de dados pelo site)

| Fornecedor | Motivo |
|---|---|
| ONER Travel | Citado na política (seção 6.1), mas sem integração no código do site. Se houver transferência internacional no fluxo operacional (fora do site), registrar no ROPA (#1547) |
| WhatsApp (Meta) | O site só abre `wa.me` com parâmetros de rastreio; a conversa acontece no app do titular com o WhatsApp Business da agência — registrar no ROPA como canal de atendimento (#1547) |

## 3. Fornecedores aposentados

Registrados porque houve transferência no passado e podem aparecer em pedidos de titulares (art. 18, VII).

| Fornecedor | Uso anterior | Encerramento | Pendência |
|---|---|---|---|
| Stape (sGTM gerenciado) | Server-side tagging | Container desativado pela Stape em 31/08/2026; migração para Zaraz (RIPD v1.9) | Confirmar exclusão dos dados/logs e encerrar a conta |
| Google Tag Manager (client-side) | Tags no navegador | Removido na migração para o Zaraz | — |
| Mautic | Automação de marketing | Não é mais carregado pelo `index.html` (restou só comentário) | Confirmar onde a instância estava hospedada e o destino da base |
| Salesforce, HubSpot | CRM | Aposentados no cut-over para o Odoo (jun/2026) | Confirmar exclusão/exportação das bases |
| n8n | Intake de formulários | Só resta o webhook de entrada `purchase-dispatch` | Confirmar onde a instância n8n roda (se for serviço de nuvem estrangeiro, entra na matriz) |

## 4. Evidências contratuais

Local: repositório documental com acesso controlado **fora deste repositório público** (definir: pasta restrita no Drive corporativo ou equivalente). Estrutura sugerida por fornecedor:

```
LGPD/Operadores/<fornecedor>/
  DPA-<versão ou data>.pdf          # termo aceito/assinado
  subprocessadores-<data>.pdf       # lista vigente na data da coleta
  regiao-<data>.png                 # print do console mostrando região
  clausulas-anpd-<data>.pdf         # cláusulas-padrão da Res. 19/2024, se aplicável
```

Na coluna **Evidência** de cada fornecedor, registrar o caminho e a versão/data (ex.: `Drive: LGPD/Operadores/Odoo/DPA-2026-09`).

## 5. Pendências — mapa para os critérios de aceite da #1542

| Critério de aceite | Estado nesta versão | O que falta |
|---|---|---|
| Matriz preenchida e revisada fornecedor por fornecedor | Inventário técnico preenchido (seção 2) | Revisão fornecedor por fornecedor pelo DPO |
| Evidências contratuais armazenadas com acesso controlado e referenciadas | Estrutura definida (seção 4) | Baixar/arquivar os DPAs e preencher a coluna **Evidência** |
| Países, regiões, suboperadores e mecanismo legal confirmados | Só indícios técnicos e políticas públicas | Odoo: região do banco. Upstash: primário + réplicas. Sentry: região da organização e opção de IP. Cloudflare: cobertura do DPA sobre Zaraz/AI Gateway/R2 e local do armazenamento do Traks. Gemini: nível da conta (gratuito × pago). Listas de suboperadores de todos |
| Revisão do encarregado/assessoria jurídica registrada | — | Registrar data, responsável e parecer nesta tabela de metadados (campo **Status**) |
| Política pública consistente com as evidências | Afirmações não comprovadas removidas da seção 10; operadores faltantes incluídos na seção 6.1; finalidade de segurança/estabilidade declarada na seção 5.8 (base legal proposta: legítimo interesse — validar com o DPO e incluir no RIPD); página `/exclusao-dados` atualizada de Salesforce/GTM para Odoo/Zaraz | Reescrever a seção 10 citando o mecanismo concreto quando as evidências chegarem |

## 6. Histórico

| Versão | Data | Alteração |
|---|---|---|
| 0.1 | 11/09/2026 | Levantamento inicial a partir do código e de verificações técnicas (DNS/IP). Os arquivos citados pela issue (`docs/privacy/transferencias-internacionais.md`, `docs/audits/lgpd-site-2026-08-28.md`) não existem no repositório — este documento substitui o "modelo inicial" |
