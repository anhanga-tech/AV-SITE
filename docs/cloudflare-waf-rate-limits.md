# Cloudflare WAF e Rate-Limit Rules — APIs sensíveis

## Visão geral

O repo já implementa rate-limiting na camada de aplicação via `lib/rate-limit.ts` + Upstash Redis.
Esse controle continua necessário, mas parte do tráfego abusivo pode ser bloqueada antes de
chegar nas Pages Functions, reduzindo custo de IA, pressão em webhooks e latência de resposta
para usuários legítimos.

Este documento define as regras a criar no dashboard Cloudflare como **primeira linha de defesa**.
`lib/rate-limit.ts` segue como segunda linha — as duas camadas são complementares.

### Endpoints cobertos

| Endpoint | Rate-limit app | Tipo de proteção Cloudflare |
|---|---|---|
| `POST /api/generate` | 10 req/min | Rate-limit + bloqueio de método |
| `POST /api/submit-lead` | 5 req/min | Rate-limit + bloqueio de método |
| `POST /api/submit-contact` | 5 req/min | Rate-limit + bloqueio de método |
| `POST /api/submit-waitlist` | 5 req/min | Rate-limit + bloqueio de método |
| `POST /api/submit-quiz` | 5 req/min | Rate-limit + bloqueio de método |
| `POST /api/purchase-dispatch` | 30 req/min | Rate-limit + bloqueio de método |

> **CORS preflight:** todas as regras condicionam o método HTTP. `OPTIONS` nunca é afetado.
> Todos os endpoints retornam 204 para `OPTIONS` — esse comportamento deve ser preservado.

---

## Regra WAF: Bloquear métodos não permitidos nas APIs

Scanners e ferramentas automatizadas frequentemente enviam `PUT`, `DELETE`, `PATCH` ou `HEAD`
para descobrir endpoints. Essa regra descarta essas requests na borda antes de processar.

### Nome da regra

`Block disallowed HTTP methods on sensitive API paths`

### Expressão

```
(starts_with(http.request.uri.path, "/api/generate") or
 starts_with(http.request.uri.path, "/api/submit-") or
 http.request.uri.path eq "/api/purchase-dispatch")
and not (http.request.method eq "POST" or http.request.method eq "OPTIONS")
```

### Configuração

| Parâmetro | Valor | Motivo |
|---|---|---|
| Ação | Block | Método inválido nunca deve chegar à aplicação |
| Resposta | HTTP 405 (padrão Cloudflare) | Informa o cliente sem expor detalhes internos |

### Onde criar

Cloudflare Dashboard → zona `anhanga.tur.br` → Security → WAF → Custom rules → Create rule.

---

## Regra de Rate-Limit: `/api/generate`

O endpoint de geração de IA tem custo de API por request. Burst de poucas dezenas de requests
por minuto já representa custo relevante e pode degradar a experiência de outros usuários.

### Nome da regra

`Rate limit POST /api/generate`

### Expressão

```
http.request.method eq "POST" and http.request.uri.path eq "/api/generate"
```

### Configuração

| Parâmetro | Valor | Motivo |
|---|---|---|
| Características | IP de origem | Isolamento por cliente |
| Período | 60 segundos | Janela de 1 minuto (alinha com app layer) |
| Requisições permitidas | 10 | Espelha o limite em `api/generate.ts` |
| Ação inicial | **Log** | Coletar dados antes de endurecer |
| Ação após validação | Block | Após confirmar ausência de falso positivo |

> **Por que Block e não Managed Challenge?**
> O endpoint recebe requests programáticas (JavaScript do SPA) — um desafio interativo
> quebraria o fluxo do chatbot. Use Block para rejeitar silenciosamente após o limite.

### Onde criar

Cloudflare Dashboard → zona `anhanga.tur.br` → Security → WAF → Rate limiting rules → Create rule.

---

## Regra de Rate-Limit: `/api/submit-*`

Os endpoints de formulário (lead, contato, waitlist, quiz) disparam webhooks N8N e escrevem
em CRM. Spam repetido cria registros inválidos e consome quota de integrações.

### Nome da regra

`Rate limit POST /api/submit-*`

### Expressão

```
http.request.method eq "POST" and starts_with(http.request.uri.path, "/api/submit-")
```

### Configuração

| Parâmetro | Valor | Motivo |
|---|---|---|
| Características | IP de origem | Isolamento por cliente |
| Período | 60 segundos | Janela de 1 minuto (alinha com app layer) |
| Requisições permitidas | 5 | Espelha o limite em cada handler `api/submit-*.ts` |
| Ação inicial | **Log** | Validar eventos antes de ativar bloqueio |
| Ação após validação | Block | Após confirmar ausência de falso positivo em conversões |

> **Atenção comercial:** um lead legítimo enviará no máximo 1–2 requests por minuto.
> O limite de 5 req/min é suficientemente conservador para não afetar usuários normais.

### Onde criar

Cloudflare Dashboard → zona `anhanga.tur.br` → Security → WAF → Rate limiting rules → Create rule.

---

## Regra de Rate-Limit: `/api/purchase-dispatch`

Endpoint de despacho de conversões autenticado por `X-Webhook-Secret`. Já possui autenticação
forte no app; a camada Cloudflare adiciona proteção contra flood antes da validação de segredo.

### Nome da regra

`Rate limit POST /api/purchase-dispatch`

### Expressão

```
http.request.method eq "POST" and http.request.uri.path eq "/api/purchase-dispatch"
```

### Configuração

| Parâmetro | Valor | Motivo |
|---|---|---|
| Características | IP de origem | Isolamento por chamador |
| Período | 60 segundos | Janela de 1 minuto |
| Requisições permitidas | 30 | Espelha o limite em `api/purchase-dispatch.ts` |
| Ação | **Block** | Endpoint autenticado; chamador legítimo não excede o limite |

> Este endpoint pode ser ativado em Block diretamente — o segredo de webhook garante que
> chamadores legítimos são conhecidos e controlados.

### Onde criar

Cloudflare Dashboard → zona `anhanga.tur.br` → Security → WAF → Rate limiting rules → Create rule.

---

## Ativação gradual

O risco principal não é técnico — é comercial: bloquear ou desafiar um lead real.

### Sequência recomendada

1. **Criar todas as regras em modo Log** (exceto a regra WAF de métodos, que pode ir a Block imediatamente).
2. Aguardar 48–72 horas de tráfego real e observar os eventos em Security → Security Events.
3. Filtrar por path (`/api/generate`, `/api/submit-*`) e verificar:
   - Qual IP/ASN aparece com mais frequência?
   - Algum IP legítimo (usuário real em sessão longa) está batendo no limite?
   - O número de eventos por período é consistente com abuso ou com uso normal?
4. Se nenhum falso positivo for identificado, mudar a ação de Log para **Block**.
5. Para `/api/generate`, considerar `Managed Challenge` se quiser interceptar bots sem bloquear
   usuários humanos que por algum motivo atingiram o limite.

---

## Validação

### CORS preflight (deve continuar funcionando)

```bash
# Espera HTTP 204 com cabeçalhos CORS
curl -sSI -X OPTIONS https://www.anhanga.tur.br/api/generate \
  -H "Origin: https://www.anhanga.tur.br" \
  -H "Access-Control-Request-Method: POST"

curl -sSI -X OPTIONS https://www.anhanga.tur.br/api/submit-lead \
  -H "Origin: https://www.anhanga.tur.br" \
  -H "Access-Control-Request-Method: POST"
```

Resultado esperado: `HTTP/2 204` com `access-control-allow-methods: POST, OPTIONS`.

### Teste de método bloqueado (após ativar regra WAF)

```bash
# Espera HTTP 405 do Cloudflare
curl -sSI -X DELETE https://www.anhanga.tur.br/api/generate
curl -sSI -X PUT https://www.anhanga.tur.br/api/submit-lead
```

### Testes de regressão do app

```bash
pnpm test:regression
```

Todos os 412 testes devem continuar passando — esta é uma mudança apenas de documentação.

### Monitoramento pós-ativação

No dashboard Cloudflare:
- **Security → Security Events** → filtrar por Service = Rate limiting / WAF
- Verificar distribuição por path, IP e ASN
- Confirmar ausência de eventos com IPs de conversões reais

---

## Risco e mitigação

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Bloquear lead legítimo com IP compartilhado (NAT corporativo) | Baixa — limite de 5 req/min é generoso para humanos | Iniciar em Log; se detectado, aumentar limite para esse path |
| Falso positivo em `/api/generate` por usuário engajado | Baixa | Limite de 10 req/min; chatbot tem throttle próprio no frontend |
| Rule matcher muito amplo cobrindo endpoints não previstos | Média — `starts_with("/api/submit-")` cobre todos os submit | Revisar se novos endpoints `submit-*` forem criados sem rate-limit |

---

## Referências

- [Cloudflare WAF Custom Rules](https://developers.cloudflare.com/waf/custom-rules/)
- [Cloudflare Rate Limiting Rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Cloudflare Rule language — Fields reference](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/)
- [`lib/rate-limit.ts`](../lib/rate-limit.ts) — implementação de rate-limit no app layer
- [`api/generate.ts`](../api/generate.ts) — handler Gemini (10 req/min)
- [`api/submit-lead.ts`](../api/submit-lead.ts) — handler lead capture (5 req/min)
