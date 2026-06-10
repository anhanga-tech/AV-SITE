# AI Gateway Operations

Data da ultima verificacao: 2026-05-23

## Escopo

O endpoint `/api/generate` usa Gemini via Cloudflare AI Gateway quando `AI_GATEWAY_ENABLED=true`.
O Gateway esperado em producao e `av-site`, configurado em `wrangler.toml` por:

- `AI_GATEWAY_ENABLED = "true"`
- `CLOUDFLARE_AI_GATEWAY_ID = "av-site"`
- `GEMINI_MODEL = "gemini-3.1-flash-lite"`

Os segredos `GEMINI_API_KEY`, `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_AI_GATEWAY_TOKEN`
devem continuar fora do repositorio.

## Contrato de privacidade e cache

Chamadas de chat personalizadas nao devem ser cacheadas por padrao. O historico pode conter
preferencias de viagem, dados de contato ou outros detalhes do usuario, entao o cliente do Gemini
envia:

- `cf-aig-metadata` com apenas chaves operacionais nao sensiveis:
  `endpoint=api-generate`, `feature=travel-chat`, `model`, `environment`, `requestType=chat`.
- `cf-aig-collect-log-payload: false` para manter metricas e metadata sem persistir prompt e resposta brutos.
- `cf-aig-skip-cache: true` para ignorar cache mesmo se uma configuracao global do Gateway for ligada depois.

Cache do AI Gateway so deve ser considerado para chamadas deterministicas, sem dados do usuario,
com chave explicita e TTL curto. Hoje nao ha esse caso no fluxo de `/api/generate`.

## Como conferir em producao

### Dashboard

1. Acesse Cloudflare Dashboard.
2. Selecione a conta `Anhanga Viagens`.
3. Abra `AI > AI Gateway`.
4. Selecione o Gateway `av-site`.
5. Em `Analytics`, confira requests, tokens, errors, cost e cached responses.
6. Em `Logs`, filtre ou procure metadata com `endpoint=api-generate`.
7. Em `Cached Responses`, confirme que o chat nao esta servindo respostas em cache.

Para esse endpoint, o estado esperado e:

- requests recentes em `api-generate` quando houver trafego real de chat;
- `cached responses` igual a zero para `/api/generate`;
- logs com metadata operacional, mas sem payload bruto de prompt/resposta;
- erros 429/5xx acompanhados por volume, modelo e status, nao por PII.

### API

Use um token com permissao `AI Gateway - Read`. O OAuth local do Wrangler pode conseguir listar
Pages, mas nao necessariamente autentica essas rotas da API.

```bash
export CLOUDFLARE_ACCOUNT_ID="..."
export CLOUDFLARE_API_TOKEN="..."
export CLOUDFLARE_AI_GATEWAY_ID="av-site"

curl -sS \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai-gateway/gateways/$CLOUDFLARE_AI_GATEWAY_ID/logs?per_page=10&direction=desc" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result[] | {
      created_at,
      cached,
      model,
      path,
      provider,
      success,
      status_code,
      tokens_in,
      tokens_out,
      cost,
      metadata
    }'
```

Nao use os endpoints `/logs/{id}/request` ou `/logs/{id}/response` para rotina operacional.
Eles existem para inspecao pontual, mas podem expor payload se a configuracao do Gateway permitir.

## Limites, retries e fallback

O aplicativo ja mantem rate limit proprio em `/api/generate`: `10` requests por minuto por IP,
com prefixo `ratelimit:generate`. Esse limite deve continuar ativo mesmo com AI Gateway.

Configuracao recomendada no Gateway:

- Rate limiting: iniciar com um limite agregado conservador para o Gateway `av-site` e ajustar com base
  em analytics reais. Use o dashboard em `AI > AI Gateway > av-site > Settings > Rate-limiting`.
- Retries: habilitar apenas para erros transitorios com no maximo 2 tentativas, delay curto e backoff
  exponencial. Nao usar retry para 4xx de autenticacao, validacao, rate limit ou modelo indisponivel.
- Fallback de modelo: manter como follow-up separado. Trocar modelo pode alterar tom, handoff e tool calling,
  entao precisa de validacao funcional do fluxo de atendimento antes de ligar em producao.

## Resultado da verificacao de 2026-05-23

- `pnpm exec wrangler whoami` confirmou login na conta `Anhanga Viagens`.
- `pnpm exec wrangler pages project list` confirmou o projeto Pages `av-site` com
  `av-site-8ex.pages.dev` e `www.anhanga.tur.br`.
- A CLI Wrangler 4.91.0 nao expoe comandos especificos de AI Gateway.
- Consulta direta a
  `/accounts/{account_id}/ai-gateway/gateways/av-site` e `/logs` usando o OAuth local do Wrangler
  retornou `403 Authentication error`.

Conclusao: a presenca de trafego em `api-generate` ainda precisa ser confirmada no dashboard ou via token
API com `AI Gateway - Read`. A ausencia de confirmacao via repo local nao prova ausencia de trafego;
prova apenas que a credencial local nao serve para essa API.

## Validacao local

```bash
pnpm exec tsx --test tests/ai-gateway-config.test.ts
pnpm test:regression
```

## Referencias

- Cloudflare AI Gateway Analytics: https://developers.cloudflare.com/ai-gateway/observability/analytics/
- Cloudflare AI Gateway Logging: https://developers.cloudflare.com/ai-gateway/observability/logging/
- Cloudflare AI Gateway Caching: https://developers.cloudflare.com/ai-gateway/features/caching/
- Cloudflare AI Gateway Rate Limiting: https://developers.cloudflare.com/ai-gateway/features/rate-limiting/
- Cloudflare AI Gateway Request Handling: https://developers.cloudflare.com/ai-gateway/configuration/request-handling/
